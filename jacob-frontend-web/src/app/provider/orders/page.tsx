'use client';

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Search, MessageSquare, CheckCircle2, MapPin, Calendar as CalendarIcon, User, AlertCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';
import {
  useAcceptProviderOrderMutation,
  useDeclineProviderOrderMutation,
  useGetProviderOrdersQuery,
} from '@/store/services/apiSlice';
import { useSocketNotifications } from '@/contexts/SocketContext';

type ProviderOrder = {
  id: string;
  orderNumber: string;
  conversationId?: string | null;
  orderName: string;
  categoryName?: string;
  status:
    | 'pending'
    | 'accepted'
    | 'declined'
    | 'accepting_delivery'
    | 'revision_requested'
    | 'under_revision'
    | 'after_sell_revision_requested'
    | 'under_after_sell_revision'
    | 'done_after_sell_revision'
    | 'completed';
  packagePrice: number;
  paymentAmount?: number;
  providerEarningsAmount?: number;
  serviceAddress: string;
  scheduledDate: string;
  scheduledTime: string;
  isRequestedOrder?: boolean;
  client: {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    avatar: string;
    locationLat: number | null;
    locationLng: number | null;
  };
};

const STATUS_LABEL: Record<ProviderOrder['status'], string> = {
  pending: 'Pending',
  accepted: 'In Progress',
  declined: 'Declined',
  accepting_delivery: 'Accepting Delivery',
  revision_requested: 'Request Revision',
  under_revision: 'Under Revision',
  after_sell_revision_requested: 'After-Sale Revision',
  under_after_sell_revision: 'Under After-Sale Revision',
  done_after_sell_revision: 'Done After-Sale Revision',
  completed: 'Completed',
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.97, y: 10 },
  visible: { opacity: 1, scale: 1, y: 0 },
};

const UPCOMING_ORDER_STATUSES = new Set<ProviderOrder['status']>([
  'pending',
  'accepted',
  'accepting_delivery',
  'revision_requested',
  'under_revision',
  'after_sell_revision_requested',
  'under_after_sell_revision',
]);

const parseScheduledTime = (scheduledTime = '') => {
  const value = scheduledTime.trim().toUpperCase();
  if (!value) return null;

  const amPmMatch = value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  if (amPmMatch) {
    let hours = Number(amPmMatch[1]);
    const minutes = Number(amPmMatch[2]);
    const period = amPmMatch[3];
    if (!Number.isFinite(hours) || !Number.isFinite(minutes) || hours < 1 || hours > 12 || minutes < 0 || minutes > 59) {
      return null;
    }
    if (period === 'AM' && hours === 12) hours = 0;
    if (period === 'PM' && hours !== 12) hours += 12;
    return { hours, minutes };
  }

  const twentyFourHourMatch = value.match(/^(\d{1,2}):(\d{2})$/);
  if (twentyFourHourMatch) {
    const hours = Number(twentyFourHourMatch[1]);
    const minutes = Number(twentyFourHourMatch[2]);
    if (!Number.isFinite(hours) || !Number.isFinite(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      return null;
    }
    return { hours, minutes };
  }

  return null;
};

const formatScheduledTime = (scheduledTime = '') => {
  const parsedTime = parseScheduledTime(scheduledTime);
  if (!parsedTime) return 'Time unavailable';

  const period = parsedTime.hours >= 12 ? 'PM' : 'AM';
  const hour12 = parsedTime.hours % 12 || 12;
  const minutes = String(parsedTime.minutes).padStart(2, '0');
  return `${hour12}:${minutes} ${period}`;
};

const getScheduledAtMs = (order: ProviderOrder) => {
  const date = new Date(order.scheduledDate);
  const time = parseScheduledTime(order.scheduledTime);
  if (Number.isNaN(date.getTime()) || !time) return Number.MAX_SAFE_INTEGER;

  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    time.hours,
    time.minutes,
    0,
    0
  ).getTime();
};

const sortOrdersByAppointment = (orders: ProviderOrder[]) => {
  const nowMs = Date.now();
  return [...orders].sort((a, b) => {
    const aScheduledAt = getScheduledAtMs(a);
    const bScheduledAt = getScheduledAtMs(b);
    const aUpcoming = aScheduledAt >= nowMs && UPCOMING_ORDER_STATUSES.has(a.status);
    const bUpcoming = bScheduledAt >= nowMs && UPCOMING_ORDER_STATUSES.has(b.status);

    if (aUpcoming !== bUpcoming) return aUpcoming ? -1 : 1;
    if (aScheduledAt !== bScheduledAt) return aUpcoming ? aScheduledAt - bScheduledAt : bScheduledAt - aScheduledAt;
    return String(a.orderNumber || a.id).localeCompare(String(b.orderNumber || b.id));
  });
};

export default function ProviderOrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get('status') || 'all';
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [page, setPage] = useState(1);
  const [profileOrder, setProfileOrder] = useState<ProviderOrder | null>(null);
  const [actingOrderId, setActingOrderId] = useState<string | null>(null);
  const { notifications } = useSocketNotifications();
  const lastHandledNotificationIdRef = useRef<string | null>(null);

  const { data, isLoading, isFetching, refetch } = useGetProviderOrdersQuery(
    {
      page,
      limit: 6,
      search,
      status: statusFilter,
    },
    {
      refetchOnFocus: true,
      refetchOnReconnect: true,
      pollingInterval: 15000,
    }
  );
  const [acceptOrder, { isLoading: isAccepting }] = useAcceptProviderOrderMutation();
  const [declineOrder, { isLoading: isDeclining }] = useDeclineProviderOrderMutation();

  const orders = useMemo(
    () => sortOrdersByAppointment(((data?.data?.items || []) as ProviderOrder[]).filter(Boolean)),
    [data]
  );
  const pagination = data?.data?.pagination;

  const handleAccept = async (id: string) => {
    try {
      setActingOrderId(id);
      await acceptOrder(id).unwrap();
      toast.success('Order accepted! Client has been notified.');
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to accept order.');
    } finally {
      setActingOrderId(null);
    }
  };

  const handleReject = async (id: string) => {
    try {
      setActingOrderId(id);
      await declineOrder(id).unwrap();
      toast.success('Order declined.');
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to decline order.');
    } finally {
      setActingOrderId(null);
    }
  };

  useEffect(() => {
    if (!notifications.length) return;
    const latest = notifications[0] as {
      id?: string;
      data?: { notificationType?: string };
    };
    if (!latest?.id || latest.id === lastHandledNotificationIdRef.current) return;

    const type = latest?.data?.notificationType;
    if (
      type === 'order_created' ||
      type === 'order_accepted' ||
      type === 'order_finalized' ||
      type === 'order_revision_requested' ||
      type === 'order_revision_cancelled' ||
      type === 'order_after_sell_revision_requested' ||
      type === 'order_after_sell_revision_accepted' ||
      type === 'order_after_sell_revision_declined' ||
      type === 'order_after_sell_revision_cancelled' ||
      type === 'order_after_sell_revision_completed'
    ) {
      lastHandledNotificationIdRef.current = latest.id;
      refetch();
    }
  }, [notifications, refetch]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12 pb-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight text-center md:text-left">Order Management</h1>
            <p className="text-slate-500 mt-2 text-lg text-center md:text-left">Manage incoming job requests and track your active tasks.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full sm:w-80">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search orders..."
                className="pl-12 h-14 bg-white border-none shadow-sm rounded-2xl font-medium"
                value={search}
                onChange={(e) => {
                  setPage(1);
                  setSearch(e.target.value);
                }}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setPage(1);
                setStatusFilter(e.target.value);
              }}
              className="w-full sm:w-[180px] h-14 bg-white border-none shadow-sm rounded-2xl font-bold px-4 text-slate-700"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="accepting_delivery">Accepting Delivery</option>
              <option value="request_revision">Request Revision</option>
              <option value="under_revision">Under Revision</option>
              <option value="completed">Completed</option>
              <option value="declined">Declined</option>
            </select>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-[2rem] bg-white p-16 text-center text-slate-500 font-bold shadow-sm">
              Loading orders...
            </motion.div>
          ) : orders.length > 0 ? (
            <motion.div key={`${statusFilter}-${search}-${page}`} variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {orders.map((order) => (
                <motion.div key={order.id} variants={itemVariants} className="h-full">
                  <Card className="border-none shadow-sm hover:shadow-xl hover:shadow-[#2286BE]/10 transition-all duration-500 rounded-[2.5rem] bg-white h-full flex flex-col overflow-hidden border border-slate-50">
                      <div className="p-8 border-b border-slate-50 flex justify-between items-start gap-3">
                        <div className="flex gap-4 min-w-0 flex-1">
                          <Avatar className="h-12 w-12 border-2 border-white shadow-sm ring-1 ring-slate-100">
                          {order.client.avatar ? <AvatarImage src={order.client.avatar} alt={order.client.name} /> : null}
                          <AvatarFallback className="bg-slate-100 text-slate-500">
                            <User size={16} />
                          </AvatarFallback>
                        </Avatar>
                          <div className="min-w-0">
                            <p className="font-black text-slate-900 text-sm tracking-tight truncate">{order.client.name || 'Client'}</p>
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest truncate">{order.orderNumber || order.id}</p>
                            {order.isRequestedOrder && (
                              <p className="mt-2 inline-flex min-w-[132px] whitespace-nowrap rounded-full bg-[#2286BE]/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#2286BE]">
                                Requested Order
                              </p>
                            )}
                          </div>
                        </div>
                      <Badge
                        className={`
                          px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border-none whitespace-nowrap shrink-0
                          ${order.status === 'completed' ? 'bg-green-50 text-green-600' :
                            order.status === 'accepted' ? 'bg-[#2286BE]/10 text-[#2286BE]' :
                            order.status === 'pending' ? 'bg-blue-50 text-blue-600' :
                            order.status === 'accepting_delivery' ? 'bg-amber-50 text-amber-600' :
                            order.status === 'revision_requested' ? 'bg-orange-50 text-orange-600' :
                            order.status === 'under_revision' ? 'bg-violet-50 text-violet-600' :
                            'bg-red-50 text-red-600'}
                        `}
                      >
                        {STATUS_LABEL[order.status] || order.status}
                      </Badge>
                    </div>

                    <CardContent className="p-8 flex-1 flex flex-col">
                      <div className="mb-8 flex-1">
                        <h3 className="font-black text-xl text-slate-900 leading-tight mb-4 group-hover:text-[#2286BE] transition-colors">
                          {order.orderName}
                        </h3>
                        <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-4">
                          Category: {order.categoryName || 'General'}
                        </p>
                        <div className="space-y-3">
                          <div className="flex items-start gap-3 text-slate-500">
                            <MapPin size={16} className="mt-0.5 text-slate-300 flex-shrink-0" />
                            <p className="text-sm font-bold text-slate-500">{order.serviceAddress || 'Location unavailable'}</p>
                          </div>
                          <div className="flex items-center gap-3 text-slate-500">
                            <CalendarIcon size={16} className="text-slate-300 flex-shrink-0" />
                            <p className="text-sm font-bold text-slate-500">
                              {new Date(order.scheduledDate).toLocaleDateString()} • {formatScheduledTime(order.scheduledTime)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-auto pt-5 border-t border-slate-50 flex justify-between items-center gap-3">
                        <div className="grid flex-1 grid-cols-2 gap-2">
                          <div className="rounded-2xl bg-slate-50 px-3 py-2.5">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Customer</p>
                            <p className="mt-1 text-lg font-black text-slate-900 tracking-tight">${Number(order.paymentAmount || order.packagePrice || 0).toFixed(2)}</p>
                          </div>
                          <div className="rounded-2xl bg-[#2286BE]/10 px-3 py-2.5">
                            <p className="text-[9px] font-black text-[#2286BE]/70 uppercase tracking-widest">Your Net</p>
                            <p className="mt-1 text-lg font-black text-[#2286BE] tracking-tight">${Number(order.providerEarningsAmount || order.packagePrice || 0).toFixed(2)}</p>
                          </div>
                        </div>
                        <div className="flex shrink-0 gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              router.push(
                                order.conversationId
                                  ? `/messages?conversationId=${String(order.conversationId)}&orderId=${order.id}`
                                  : `/messages?orderId=${order.id}&user=${order.client.id}`
                              )
                            }
                            className="h-10 w-10 text-slate-400 hover:text-[#2286BE] hover:bg-[#2286BE]/5 rounded-[1rem] transition-all"
                          >
                            <MessageSquare size={18} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setProfileOrder(order)}
                            className="h-10 w-10 text-slate-400 hover:text-[#2286BE] hover:bg-[#2286BE]/5 rounded-[1rem] transition-all"
                          >
                            <User size={18} />
                          </Button>
                        </div>
                      </div>

                      <div className="mt-8">
                        {order.status === 'pending' && (
                          <div className="grid grid-cols-2 gap-4">
                            <Button
                              variant="outline"
                              className="h-14 font-black uppercase tracking-widest text-[11px] border-slate-100 text-slate-500 hover:bg-slate-50 rounded-2xl transition-all"
                              onClick={() => handleReject(order.id)}
                              disabled={isDeclining && actingOrderId === order.id}
                            >
                              {isDeclining && actingOrderId === order.id ? 'Declining...' : 'Decline'}
                            </Button>
                            <Button
                              className="h-14 font-black uppercase tracking-widest text-[11px] bg-[#2286BE] hover:bg-[#1b6da0] text-white shadow-xl shadow-[#2286BE]/20 rounded-2xl transition-all"
                              onClick={() => handleAccept(order.id)}
                              disabled={isAccepting && actingOrderId === order.id}
                            >
                              {isAccepting && actingOrderId === order.id ? 'Accepting...' : 'Accept Job'}
                            </Button>
                          </div>
                        )}

                        {order.status === 'accepted' && (
                          <Link href={`/provider/orders/${order.id}`} className="block">
                            <Button className="w-full h-14 font-black uppercase tracking-widest text-[11px] bg-[#2286BE] hover:bg-[#1b6da0] shadow-xl shadow-[#2286BE]/30 text-white rounded-2xl transition-all">
                              <CheckCircle2 size={18} className="mr-2" /> Deliver Order
                            </Button>
                          </Link>
                        )}

                        {order.status === 'accepting_delivery' && (
                          <Link href={`/provider/orders/${order.id}`} className="block">
                            <Button variant="outline" className="w-full h-14 font-black uppercase tracking-widest text-[11px] border-amber-100 text-amber-700 rounded-2xl">
                              Delivery Submitted
                            </Button>
                          </Link>
                        )}

                        {(
                          order.status === 'revision_requested' ||
                          order.status === 'under_revision' ||
                          order.status === 'after_sell_revision_requested' ||
                          order.status === 'under_after_sell_revision'
                        ) && (
                          <Link href={`/provider/orders/${order.id}`} className="block">
                            <Button variant="outline" className="w-full h-14 font-black uppercase tracking-widest text-[11px] border-violet-100 text-violet-700 rounded-2xl">
                              {order.status === 'after_sell_revision_requested' || order.status === 'under_after_sell_revision'
                                ? 'Open After-Sale Revision'
                                : 'Open Revision'}
                            </Button>
                          </Link>
                        )}

                        {order.status === 'completed' && (
                          <Button variant="outline" className="w-full h-14 font-black uppercase tracking-widest text-[11px] border-slate-50 text-slate-300 cursor-default hover:bg-white rounded-2xl">
                            Order Finalized
                          </Button>
                        )}

                        {order.status === 'declined' && (
                          <Button variant="outline" className="w-full h-14 font-black uppercase tracking-widest text-[11px] border-red-50 text-red-200 cursor-default hover:bg-white rounded-2xl">
                            Booking Declined
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-32 bg-white rounded-[3rem] shadow-sm border border-dashed border-slate-200"
            >
              <div className="h-24 w-24 rounded-[2rem] bg-slate-50 flex items-center justify-center mb-8 text-slate-200">
                <AlertCircle size={48} />
              </div>
              <h3 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">No orders found</h3>
              <p className="text-slate-400 font-bold max-w-xs text-center leading-relaxed">
                Adjust your search or filters to find specific bookings.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="pointer-events-none fixed bottom-4 left-1/2 z-50 -translate-x-1/2">
        <div className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/95 px-3 py-2 shadow-xl backdrop-blur">
          <Button
            variant="outline"
            size="sm"
            disabled={!pagination?.hasPrevPage || isFetching}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            className="h-9 rounded-xl border-slate-200 text-xs font-black uppercase tracking-widest"
          >
            Prev
          </Button>
          <span className="text-xs font-black uppercase tracking-widest text-slate-600">
            {pagination?.page || page} / {pagination?.totalPages || 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={!pagination?.hasNextPage || isFetching}
            onClick={() => setPage((prev) => prev + 1)}
            className="h-9 rounded-xl border-slate-200 text-xs font-black uppercase tracking-widest"
          >
            Next
          </Button>
        </div>
      </div>

      {profileOrder && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center gap-3">
              <Avatar className="h-12 w-12 border border-slate-100">
                {profileOrder.client.avatar ? <AvatarImage src={profileOrder.client.avatar} /> : null}
                <AvatarFallback className="bg-slate-100 text-slate-500">
                  <User size={16} />
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-black text-slate-900">{profileOrder.client.name || 'Client'}</h3>
                <p className="text-xs font-semibold text-slate-500">Client Profile</p>
              </div>
            </div>
            <div className="space-y-2 rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-700">
              <p>Name: {profileOrder.client.name || 'N/A'}</p>
              <p>Phone: {profileOrder.client.phone || 'N/A'}</p>
              <p>Email: {profileOrder.client.email || 'N/A'}</p>
              <p>Location: {profileOrder.client.address || profileOrder.serviceAddress || 'N/A'}</p>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" className="rounded-xl border-slate-200" onClick={() => setProfileOrder(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
