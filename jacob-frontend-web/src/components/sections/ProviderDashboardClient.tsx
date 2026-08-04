'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Ban, CalendarDays, ChevronLeft, ChevronRight, DollarSign, CheckSquare, Clock, MapPin, TrendingUp, PlusCircle, Share2, Star, Trash2, User } from 'lucide-react';
import { BRAND } from '@/lib/constants';
import { toast } from 'sonner';
import {
  useAcceptProviderOrderMutation,
  useCreateProviderAvailabilityBlockMutation,
  useDeleteProviderAvailabilityBlockMutation,
  useGetProviderAvailabilityBlocksQuery,
  useDeclineProviderOrderMutation,
  useGetProviderDashboardQuery,
  useGetProviderOrdersQuery,
} from '@/store/services/apiSlice';
import { useSocketNotifications } from '@/contexts/SocketContext';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const formatRelativeTime = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hr${diffHours > 1 ? 's' : ''} ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const formatMoney = (value: number) => {
  if (!Number.isFinite(value)) return '0';
  return Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 });
};

type ProviderBookedJob = {
  id: string;
  orderNumber?: string;
  orderName?: string;
  categoryName?: string;
  status?: string;
  packagePrice?: number;
  providerEarningsAmount?: number;
  serviceAddress?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  client?: {
    name?: string;
    email?: string;
    phone?: string;
    avatar?: string;
  };
};

type AvailabilityBlock = {
  id: string;
  scope: 'full_day' | 'time_slot';
  dateKey: string;
  startTime?: string;
  endTime?: string;
  note?: string;
  recurrence?: 'none' | 'weekly';
};

const ACTIVE_BOOKING_STATUSES = new Set([
  'accepted',
  'accepting_delivery',
  'revision_requested',
  'under_revision',
  'after_sell_revision_requested',
  'under_after_sell_revision',
  'done_after_sell_revision',
]);

const getDateKey = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatBookingDate = (value?: string) => {
  if (!value) return 'Date not set';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatMonthLabel = (value: Date) =>
  value.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

const buildCalendarDays = (monthDate: Date) => {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const start = new Date(year, month, 1 - firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      date,
      key: getDateKey(date.toISOString()),
      isCurrentMonth: date.getMonth() === month,
      isToday: getDateKey(date.toISOString()) === getDateKey(new Date().toISOString()),
    };
  });
};

const parseDateKey = (dateKey: string) => {
  const [year, month, day] = String(dateKey || '').split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

const blockAppliesToDate = (block: AvailabilityBlock, dateKey: string) => {
  if (block.dateKey === dateKey) return true;
  if (block.recurrence !== 'weekly') return false;
  const startDate = parseDateKey(block.dateKey);
  const targetDate = parseDateKey(dateKey);
  return Boolean(startDate && targetDate && targetDate >= startDate && targetDate.getDay() === startDate.getDay());
};

const formatBlockLabel = (block: AvailabilityBlock) => {
  if (block.scope === 'full_day') return `Full day${block.recurrence === 'weekly' ? ' weekly' : ''}`;
  return `${block.startTime || 'Start'} - ${block.endTime || 'End'}${block.recurrence === 'weekly' ? ' weekly' : ''}`;
};

export default function ProviderDashboardClient() {
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState('');
  const [blockScope, setBlockScope] = useState<'full_day' | 'time_slot'>('time_slot');
  const [blockStartTime, setBlockStartTime] = useState('09:00');
  const [blockEndTime, setBlockEndTime] = useState('12:00');
  const [blockNote, setBlockNote] = useState('');
  const [blockRecursWeekly, setBlockRecursWeekly] = useState(false);
  const { data, isLoading, refetch } = useGetProviderDashboardQuery();
  const { data: providerOrdersData } = useGetProviderOrdersQuery(
    { page: 1, limit: 100, search: '', status: 'all' },
    {
      refetchOnFocus: true,
      refetchOnReconnect: true,
      pollingInterval: 15000,
    }
  );
  const [acceptOrder] = useAcceptProviderOrderMutation();
  const [declineOrder] = useDeclineProviderOrderMutation();
  const [createAvailabilityBlock, { isLoading: isCreatingBlock }] = useCreateProviderAvailabilityBlockMutation();
  const [deleteAvailabilityBlock, { isLoading: isDeletingBlock }] = useDeleteProviderAvailabilityBlockMutation();
  const { notifications } = useSocketNotifications();
  const refetchMarkerRef = useRef<string>('');
  const latestNotification = notifications[0];

  const summary = data?.data;
  const revenue = Number(summary?.revenue?.totalEarnings || 0);
  const activeOrders = Number(summary?.orders?.activeOrders || 0);
  const pendingOrders = Number(summary?.orders?.pendingOrders || 0);
  const completedOrders = Number(summary?.orders?.completedOrders || 0);
  const completionRate = Number(summary?.orders?.completionRate || 0);
  const averageRating = Number(summary?.ratings?.averageRating || 0);
  const reviewCount = Number(summary?.ratings?.reviewCount || 0);
  const bookedJobs = useMemo(() => {
    const todayKey = getDateKey(new Date().toISOString());
    return (((providerOrdersData?.data?.items || []) as ProviderBookedJob[]).filter((order) => {
      const dateKey = getDateKey(order.scheduledDate);
      return Boolean(dateKey && dateKey >= todayKey && ACTIVE_BOOKING_STATUSES.has(String(order.status || '')));
    })).sort((a, b) => {
      const dateCompare = getDateKey(a.scheduledDate).localeCompare(getDateKey(b.scheduledDate));
      if (dateCompare !== 0) return dateCompare;
      return String(a.scheduledTime || '').localeCompare(String(b.scheduledTime || ''));
    });
  }, [providerOrdersData]);

  const bookedJobsByDate = useMemo(() => {
    return bookedJobs.reduce<Record<string, ProviderBookedJob[]>>((acc, job) => {
      const dateKey = getDateKey(job.scheduledDate);
      if (!dateKey) return acc;
      acc[dateKey] = [...(acc[dateKey] || []), job];
      return acc;
    }, {});
  }, [bookedJobs]);

  const calendarDays = useMemo(() => buildCalendarDays(calendarMonth), [calendarMonth]);
  const calendarRange = useMemo(() => {
    return {
      from: calendarDays[0]?.key || '',
      to: calendarDays[calendarDays.length - 1]?.key || '',
    };
  }, [calendarDays]);
  const { data: availabilityData } = useGetProviderAvailabilityBlocksQuery(calendarRange);
  const availabilityBlocks = useMemo(
    () => (availabilityData?.data?.items || []) as AvailabilityBlock[],
    [availabilityData?.data?.items]
  );
  const availabilityByDate = useMemo(() => {
    return calendarDays.reduce<Record<string, AvailabilityBlock[]>>((acc, day) => {
      const blocks = availabilityBlocks.filter((block) => blockAppliesToDate(block, day.key));
      if (blocks.length) acc[day.key] = blocks;
      return acc;
    }, {});
  }, [availabilityBlocks, calendarDays]);
  const selectedDateJobs = selectedCalendarDate ? bookedJobsByDate[selectedCalendarDate] || [] : [];
  const selectedDateBlocks = selectedCalendarDate ? availabilityByDate[selectedCalendarDate] || [] : [];

  const chartData = summary?.earningsAnalytics?.length
    ? summary.earningsAnalytics.map((entry) => ({
        name: String(entry.name || ''),
        earnings: Number(entry.earnings || 0),
      }))
    : [
        { name: 'Jan', earnings: 0 },
        { name: 'Feb', earnings: 0 },
        { name: 'Mar', earnings: 0 },
        { name: 'Apr', earnings: 0 },
        { name: 'May', earnings: 0 },
        { name: 'Jun', earnings: 0 },
        { name: 'Jul', earnings: 0 },
        { name: 'Aug', earnings: 0 },
        { name: 'Sep', earnings: 0 },
        { name: 'Oct', earnings: 0 },
        { name: 'Nov', earnings: 0 },
        { name: 'Dec', earnings: 0 },
      ];

  const requests = (summary?.pendingRequests || []).slice(0, 2).map((request) => {
    const client = (request.client as Record<string, unknown>) || {};
    return {
      id: String(request.id || request.orderId || request.orderNumber || ''),
      title: String(request.title || request.orderName || 'Service order'),
      category: String(request.category || request.categoryName || 'General'),
      customer: String(request.customer || client.name || 'Client'),
      address: String(request.address || request.serviceAddress || request.location || 'Location not set'),
      time: String(request.time || request.createdAt || ''),
      avatar: String(request.avatar || client.avatar || ''),
    };
  });

  const handleAction = async (id: string, action: 'accept' | 'decline') => {
    try {
      if (action === 'accept') {
        await acceptOrder(id).unwrap();
      } else {
        await declineOrder(id).unwrap();
      }
      toast.success(`Order ${action === 'accept' ? 'accepted' : 'declined'} successfully!`);
    } catch (error: any) {
      toast.error(error?.data?.message || `Failed to ${action} order.`);
    }
  };

  const handleCreateAvailabilityBlock = async () => {
    if (!selectedCalendarDate) return;
    try {
      await createAvailabilityBlock({
        dateKey: selectedCalendarDate,
        scope: blockScope,
        startTime: blockScope === 'time_slot' ? blockStartTime : '',
        endTime: blockScope === 'time_slot' ? blockEndTime : '',
        note: blockNote,
        recurrence: blockRecursWeekly ? 'weekly' : 'none',
      }).unwrap();
      setBlockNote('');
      toast.success('Availability block added.');
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to block availability.');
    }
  };

  const handleDeleteAvailabilityBlock = async (id: string) => {
    try {
      await deleteAvailabilityBlock(id).unwrap();
      toast.success('Availability block removed.');
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to remove availability block.');
    }
  };

  useEffect(() => {
    if (!latestNotification) return;
    const notificationType = String((latestNotification.data || {})?.notificationType || '');
    if (notificationType !== 'order_created') return;
    if (refetchMarkerRef.current === latestNotification.id) return;
    refetchMarkerRef.current = latestNotification.id;
    refetch();
  }, [latestNotification, refetch]);

  return (
    <div className="min-h-screen bg-slate-50/50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-[#2286BE]/5 text-[#2286BE] text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md">Provider Hub</span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Provider Dashboard</h1>
            <p className="text-slate-500 mt-2 text-lg">Manage your business, track growth, and serve your neighborhood on {BRAND.name}.</p>
          </div>
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(window.location.origin + '/provider/profile');
                toast.success('Profile link copied to clipboard!');
              }}
              className="border-slate-200 text-slate-600 hover:text-[#2286BE] hover:border-[#2286BE] bg-white h-12 px-6 font-bold rounded-xl shadow-sm transition-all"
            >
              <Share2 size={18} className="mr-2" /> Share Profile
            </Button>
            <Link href="/provider/gigs/create">
              <Button className="bg-[#2286BE] hover:bg-[#1b6da0] px-6 h-12 font-bold shadow-lg shadow-[#2286BE]/20 rounded-xl transition-all">
                <PlusCircle size={18} className="mr-2" /> Create New Gig
              </Button>
            </Link>
          </div>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
        >
          <motion.div variants={item}>
            <Card className="border-none shadow-md shadow-slate-200/50 bg-white group hover:scale-[1.02] transition-transform duration-300">
              <CardHeader className="flex flex-row items-center justify-between py-5 pb-2">
                <Link href="/provider/revenue">
                  <CardTitle className="text-[12px] font-bold text-slate-400 uppercase tracking-widest hover:text-[#2286BE]">Revenue</CardTitle>
                </Link>
                <div className="p-2 bg-[#2286BE]/5 rounded-lg" aria-hidden="true">
                  <DollarSign size={16} className="text-[#2286BE]" />
                </div>
              </CardHeader>
              <CardContent className="pb-6">
                <div className="flex items-end justify-between">
                  <div>
                    <Link href="/provider/revenue" className="block">
                      <div className="text-3xl font-black text-slate-900">${formatMoney(revenue)}</div>
                      <div className="flex items-center text-xs text-[#2286BE] font-bold mt-2">
                        <TrendingUp size={14} className="mr-1" /> Total earnings
                      </div>
                    </Link>
                  </div>
                  <Link href="/provider/withdrawals">
                    <Button size="sm" className="h-9 px-4 rounded-lg bg-[#2286BE]/10 text-[#2286BE] hover:bg-[#2286BE] hover:text-white font-bold transition-all border-none">
                      Withdraw
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Link href="/provider/orders?status=active" className="block">
              <Card className="border-none shadow-md shadow-slate-200/50 bg-white group hover:scale-[1.02] transition-transform duration-300">
                <CardHeader className="flex flex-row items-center justify-between py-5 pb-2">
                  <CardTitle className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Active Orders</CardTitle>
                  <div className="p-2 bg-blue-50 rounded-lg" aria-hidden="true">
                    <Clock size={16} className="text-blue-500" />
                  </div>
                </CardHeader>
                <CardContent className="pb-6">
                  <div className="text-3xl font-black text-slate-900">{isLoading ? '0' : activeOrders}</div>
                  <p className="text-xs text-slate-400 font-bold mt-2">{pendingOrders} waiting confirmation</p>
                </CardContent>
              </Card>
            </Link>
          </motion.div>

          <motion.div variants={item}>
            <Link href="/provider/orders?status=completed" className="block">
              <Card className="border-none shadow-md shadow-slate-200/50 bg-white group hover:scale-[1.02] transition-transform duration-300">
                <CardHeader className="flex flex-row items-center justify-between py-5 pb-2">
                  <CardTitle className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Completed</CardTitle>
                  <div className="p-2 bg-indigo-50 rounded-lg" aria-hidden="true">
                    <CheckSquare size={16} className="text-indigo-500" />
                  </div>
                </CardHeader>
                <CardContent className="pb-6">
                  <div className="text-3xl font-black text-slate-900">{isLoading ? '0' : completedOrders}</div>
                  <p className="text-xs text-slate-400 font-bold mt-2">{completionRate.toFixed(1)}% Completion Rate</p>
                </CardContent>
              </Card>
            </Link>
          </motion.div>

          <motion.div variants={item}>
            <Link href="/provider/ratings" className="block">
              <Card className="border-none shadow-md shadow-slate-200/50 bg-white group hover:scale-[1.02] transition-transform duration-300">
                <CardHeader className="flex flex-row items-center justify-between py-5 pb-2">
                  <CardTitle className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Avg. Rating</CardTitle>
                  <div className="p-2 bg-amber-50 rounded-lg" aria-hidden="true">
                    <Star size={16} className="text-amber-500 fill-amber-500" />
                  </div>
                </CardHeader>
                <CardContent className="pb-6">
                  <div className="text-3xl font-black text-slate-900">{averageRating.toFixed(1)}</div>
                  <p className="text-xs text-slate-400 font-bold mt-2">Based on {reviewCount} reviews</p>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2"
          >
            <Card className="border-none shadow-sm bg-white overflow-hidden rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl font-black text-slate-900 tracking-tight">Earnings Analytics</CardTitle>
                <CardDescription className="font-medium">Total income generated across all services on {BRAND.name}.</CardDescription>
              </CardHeader>
              <CardContent className="h-[350px] pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2286BE" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#2286BE" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} tickFormatter={(val) => `$${Number(val).toLocaleString()}`} dx={-10} />
                    <Tooltip
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '16px' }}
                      itemStyle={{ color: '#2286BE', fontWeight: 900 }}
                    />
                    <Area type="monotone" dataKey="earnings" stroke="#2286BE" strokeWidth={5} fillOpacity={1} fill="url(#colorEarnings)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="border-none shadow-sm bg-white rounded-2xl h-full flex flex-col">
              <CardHeader>
                <CardTitle className="text-xl font-black text-slate-900 tracking-tight">New Requests</CardTitle>
                <CardDescription className="font-medium">Pending orders for your approval</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="space-y-4">
                  {requests.length === 0 ? (
                    <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-[2rem] bg-slate-50/30">
                      <div className="h-16 w-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 text-slate-300">
                        <Clock size={28} />
                      </div>
                      <p className="text-base font-black text-slate-400">No new requests</p>
                      <p className="text-xs font-bold text-slate-300 uppercase tracking-widest mt-1">Check back later</p>
                    </div>
                  ) : (
                    requests.map((req) => (
                      <motion.div
                        key={req.id}
                        whileHover={{ y: -4 }}
                        className="p-5 border border-slate-100 rounded-2xl hover:border-[#2286BE]/30 hover:shadow-xl transition-all cursor-pointer group bg-white shadow-sm"
                      >
                        <Link href={`/provider/orders/${req.id}`}>
                          <div className="flex items-center justify-between mb-3 text-[10px] font-black uppercase tracking-wider">
                            <span className="bg-amber-50 text-amber-600 px-2.5 py-1 rounded-lg">Incoming Order</span>
                            <span className="text-slate-400">{formatRelativeTime(req.time)}</span>
                          </div>
                          <h4 className="font-bold text-slate-900 mb-3 leading-snug group-hover:text-[#2286BE] transition-colors line-clamp-2">
                            {req.title}
                          </h4>
                          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-3">
                            Category: {req.category}
                          </p>
                          <div className="flex items-center gap-2 mb-5">
                            <Avatar className="h-8 w-8 border-2 border-white ring-2 ring-slate-50 shadow-sm">
                              <AvatarImage src={req.avatar} alt="Customer" />
                              <AvatarFallback className="text-[10px] font-bold bg-slate-100">{req.customer?.[0] || 'C'}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="text-xs font-black text-slate-800 tracking-tight">{req.customer}</span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{req.address}</span>
                            </div>
                          </div>
                        </Link>
                        <div className="grid grid-cols-2 gap-3">
                          <Button
                            onClick={(e) => {
                              e.preventDefault();
                              handleAction(req.id, 'decline');
                            }}
                            variant="outline"
                            size="sm"
                            className="w-full h-11 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 border-slate-200 transition-all hover:bg-slate-50"
                          >
                            Decline
                          </Button>
                          <Button
                            onClick={(e) => {
                              e.preventDefault();
                              handleAction(req.id, 'accept');
                            }}
                            size="sm"
                            className="w-full h-11 rounded-xl text-xs font-black uppercase tracking-widest bg-[#2286BE] hover:bg-[#1b6da0] transition-all shadow-lg shadow-[#2286BE]/20"
                          >
                            Accept
                          </Button>
                        </div>
                      </motion.div>
                    ))
                  )}
                  <Link href="/provider/orders" className="w-full block">
                    <Button variant="ghost" className="w-full h-12 text-sm font-black uppercase tracking-widest text-[#2286BE] hover:bg-[#2286BE]/5 rounded-xl mt-2 transition-colors">
                      All Orders History →
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="mb-12"
        >
          <Card className="border-none shadow-sm bg-white overflow-hidden rounded-2xl">
            <CardHeader className="flex flex-col gap-4 border-b border-slate-100 py-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <div className="rounded-lg bg-[#2286BE]/10 p-2 text-[#2286BE]">
                    <CalendarDays size={18} />
                  </div>
                  <CardTitle className="text-xl font-black text-slate-900 tracking-tight">Calendar View</CardTitle>
                </div>
                <CardDescription className="font-medium">
                  Upcoming booked jobs and blocked availability. Click any day to manage blocked time.
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-xl border-slate-200"
                  onClick={() => setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                  aria-label="Previous month"
                >
                  <ChevronLeft size={18} />
                </Button>
                <div className="min-w-36 text-center text-sm font-black uppercase tracking-widest text-slate-700">
                  {formatMonthLabel(calendarMonth)}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-xl border-slate-200"
                  onClick={() => setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                  aria-label="Next month"
                >
                  <ChevronRight size={18} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-5">
              <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="py-1">{day}</div>
                ))}
              </div>

              <div className="mt-1.5 grid grid-cols-7 gap-1.5">
                {calendarDays.map((day) => {
                  const dayJobs = bookedJobsByDate[day.key] || [];
                  const hasJobs = dayJobs.length > 0;
                  const dayBlocks = availabilityByDate[day.key] || [];
                  const hasBlocks = dayBlocks.length > 0;
                  const hasFullDayBlock = dayBlocks.some((block) => block.scope === 'full_day');

                  return (
                    <button
                      key={day.key}
                      type="button"
                      onClick={() => setSelectedCalendarDate(day.key)}
                      className={`min-h-16 rounded-xl border p-1.5 text-left transition-all ${
                        hasFullDayBlock
                          ? 'border-rose-300 bg-rose-50 hover:-translate-y-0.5 hover:border-rose-400 hover:shadow-md'
                          : hasBlocks
                            ? 'border-amber-300 bg-amber-50 hover:-translate-y-0.5 hover:border-amber-400 hover:shadow-md'
                            : hasJobs
                          ? 'border-[#2286BE]/30 bg-[#2286BE]/5 hover:-translate-y-0.5 hover:border-[#2286BE] hover:bg-[#2286BE]/10 hover:shadow-md'
                          : 'border-slate-100 bg-slate-50/50'
                      } ${day.isCurrentMonth ? 'opacity-100' : 'opacity-40'}`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-black ${
                          day.isToday ? 'bg-slate-900 text-white' : 'text-slate-700'
                        }`}>
                          {day.date.getDate()}
                        </span>
                        {hasJobs ? (
                          <span className="rounded-full bg-[#2286BE] px-1.5 py-0.5 text-[9px] font-black text-white">
                            {dayJobs.length}
                          </span>
                        ) : hasBlocks ? (
                          <Ban size={14} className={hasFullDayBlock ? 'text-rose-500' : 'text-amber-500'} />
                        ) : null}
                      </div>

                      {hasBlocks ? (
                        <div className="mt-1 truncate rounded-md bg-white px-1.5 py-0.5 text-[10px] font-black text-rose-600 shadow-sm">
                          {formatBlockLabel(dayBlocks[0])}
                        </div>
                      ) : hasJobs ? (
                        <div className="mt-1">
                          <div className="truncate rounded-md bg-white px-1.5 py-0.5 text-[10px] font-black text-slate-700 shadow-sm">
                            {dayJobs[0]?.scheduledTime || 'Time TBD'} - {dayJobs[0]?.orderName || 'Booked job'}
                          </div>
                          {dayJobs.length > 1 ? (
                            <div className="mt-0.5 px-1 text-[9px] font-black text-[#2286BE]">
                              +{dayJobs.length - 1} more
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </button>
                  );
                })}
              </div>

              {bookedJobs.length === 0 && availabilityBlocks.length === 0 ? (
                <div className="mt-4 rounded-2xl border-2 border-dashed border-slate-100 bg-slate-50/50 py-5 text-center">
                  <p className="text-sm font-black text-slate-400">No upcoming booked jobs or blocked time yet</p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-300">Click a day to block availability</p>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </motion.div>

        <Dialog open={Boolean(selectedCalendarDate)} onOpenChange={(open) => {
          if (!open) setSelectedCalendarDate('');
        }}>
          <DialogContent className="top-24 max-h-[calc(100vh-7rem)] max-w-3xl translate-y-0 rounded-[2rem] border-slate-200 p-0 overflow-hidden">
            <div className="flex max-h-[calc(100vh-7rem)] flex-col bg-white">
              <DialogHeader className="shrink-0 border-b border-slate-100 px-7 py-5">
                <DialogTitle className="text-2xl font-black text-slate-900">
                  {formatBookingDate(selectedDateJobs[0]?.scheduledDate || selectedCalendarDate)}
                </DialogTitle>
                <DialogDescription className="font-medium text-slate-500">
                  {selectedDateJobs.length} booked {selectedDateJobs.length === 1 ? 'job' : 'jobs'} and {selectedDateBlocks.length} blocked {selectedDateBlocks.length === 1 ? 'slot' : 'slots'}.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 overflow-y-auto px-7 py-5">
                <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-5">
                  <div className="flex items-center gap-2">
                    <Ban size={18} className="text-rose-500" />
                    <h3 className="text-lg font-black text-slate-900">Block availability</h3>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div className="flex rounded-xl bg-white p-1 shadow-sm">
                      {(['time_slot', 'full_day'] as const).map((scope) => (
                        <button
                          key={scope}
                          type="button"
                          onClick={() => setBlockScope(scope)}
                          className={`flex-1 rounded-lg px-3 py-2 text-xs font-black uppercase tracking-widest ${
                            blockScope === scope ? 'bg-rose-500 text-white' : 'text-slate-500'
                          }`}
                        >
                          {scope === 'time_slot' ? 'Time Slot' : 'Full Day'}
                        </button>
                      ))}
                    </div>
                    <label className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-600 shadow-sm">
                      <input
                        type="checkbox"
                        checked={blockRecursWeekly}
                        onChange={(event) => setBlockRecursWeekly(event.target.checked)}
                        className="h-4 w-4 accent-rose-500"
                      />
                      Repeat weekly
                    </label>
                    {blockScope === 'time_slot' ? (
                      <>
                        <Input type="time" value={blockStartTime} onChange={(event) => setBlockStartTime(event.target.value)} className="rounded-xl bg-white" />
                        <Input type="time" value={blockEndTime} onChange={(event) => setBlockEndTime(event.target.value)} className="rounded-xl bg-white" />
                      </>
                    ) : null}
                    <Input
                      value={blockNote}
                      onChange={(event) => setBlockNote(event.target.value)}
                      placeholder="Optional reason or note"
                      className="rounded-xl bg-white md:col-span-2"
                    />
                  </div>
                  <Button
                    type="button"
                    disabled={isCreatingBlock}
                    onClick={handleCreateAvailabilityBlock}
                    className="mt-4 rounded-xl bg-rose-500 px-5 font-black hover:bg-rose-600"
                  >
                    {isCreatingBlock ? 'Saving...' : 'Block This Time'}
                  </Button>
                </div>

                {selectedDateBlocks.length ? (
                  <div className="space-y-3">
                    {selectedDateBlocks.map((block) => (
                      <div key={block.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                        <div>
                          <p className="text-sm font-black text-slate-900">{formatBlockLabel(block)}</p>
                          {block.note ? <p className="mt-1 text-sm font-medium text-slate-500">{block.note}</p> : null}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          disabled={isDeletingBlock}
                          onClick={() => handleDeleteAvailabilityBlock(block.id)}
                          className="h-10 w-10 rounded-xl border-rose-100 text-rose-500 hover:bg-rose-50"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : null}

                {selectedDateJobs.map((job) => (
                  <div key={job.id} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#2286BE]">
                          {job.orderNumber || 'Booked Job'}
                        </p>
                        <h3 className="mt-2 text-lg font-black text-slate-900">{job.orderName || 'Service booking'}</h3>
                        <p className="mt-1 text-xs font-black uppercase tracking-wider text-slate-400">
                          {job.categoryName || 'General'} - {String(job.status || 'accepted').replaceAll('_', ' ')}
                        </p>
                      </div>
                      <div className="rounded-xl bg-white px-4 py-3 text-right shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Earning</p>
                        <p className="text-xl font-black text-slate-900">
                          ${Number(job.providerEarningsAmount || job.packagePrice || 0).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 text-sm font-bold text-slate-600 md:grid-cols-2">
                      <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-3">
                        <Clock size={16} className="text-slate-300" />
                        <span>{job.scheduledTime || 'Time not set'}</span>
                      </div>
                      <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-3">
                        <User size={16} className="text-slate-300" />
                        <span>{job.client?.name || 'Client'}</span>
                      </div>
                      <div className="flex items-start gap-3 rounded-xl bg-white px-4 py-3 md:col-span-2">
                        <MapPin size={16} className="mt-0.5 flex-shrink-0 text-slate-300" />
                        <span>{job.serviceAddress || 'Address unavailable'}</span>
                      </div>
                      {job.client?.phone || job.client?.email ? (
                        <div className="rounded-xl bg-white px-4 py-3 md:col-span-2">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Client Contact</p>
                          <p className="mt-1 text-sm font-bold text-slate-700">
                            {[job.client?.phone, job.client?.email].filter(Boolean).join(' - ')}
                          </p>
                        </div>
                      ) : null}
                    </div>

                    <div className="mt-5 flex justify-end">
                      <Link href={`/provider/orders/${job.id}`}>
                        <Button className="rounded-xl bg-[#2286BE] px-5 font-black hover:bg-[#1b6da0]">
                          View Order Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
