'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, MessageSquare, MapPin, Calendar as CalendarIcon, Package, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  useGetClientOrdersQuery,
  useGetClientServiceRequestsQuery,
} from '@/store/services/apiSlice';
import { useSocketNotifications } from '@/contexts/SocketContext';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

type ClientOrder = {
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
  scheduledDate: string;
  scheduledTime: string;
  serviceAddress: string;
  completedAt?: string | null;
  provider: {
    id: string;
    name: string;
    avatar: string;
  };
};

type ClientServiceRequest = {
  id: string;
  requestNumber: string;
  categoryName: string;
  requestSource?: 'existing_category' | 'custom_category';
  customCategoryName?: string;
  customCategoryApprovalStatus?: 'not_requested' | 'pending' | 'approved' | 'rejected';
  pendingAdminCategoryApproval?: boolean;
  linkedOrderId?: string | null;
  linkedOrderNumber?: string;
  linkedOrderStatus?: string;
  linkedOrderPaymentStatus?: string;
  linkedOrderCompletedAt?: string | null;
  serviceAddress: string;
  description: string;
  preferredDate?: string | null;
  preferredTime: string;
  budget: number;
  status: 'open' | 'accepted' | 'cancelled';
  acceptedAt?: string | null;
  acceptedProvider?: {
    id: string;
    name: string;
    avatar: string;
    sellerLevel?: string;
    rating?: number;
  } | null;
};

const STATUS_LABEL: Record<ClientOrder['status'], string> = {
  pending: 'Pending',
  accepted: 'In Progress',
  accepting_delivery: 'Payment Pending',
  revision_requested: 'Request Revision',
  under_revision: 'Under Revision',
  after_sell_revision_requested: 'After-Sale Revision Requested',
  under_after_sell_revision: 'Under After-Sale Revision',
  done_after_sell_revision: 'Done After-Sale Revision',
  completed: 'Completed',
  declined: 'Cancelled',
};

const REQUEST_STATUS_LABEL: Record<ClientServiceRequest['status'], string> = {
  open: 'Requested',
  accepted: 'Accepted',
  cancelled: 'Cancelled',
};

const ORDER_STYLE_STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  accepted: 'In Progress',
  accepting_delivery: 'Payment Pending',
  revision_requested: 'Request Revision',
  under_revision: 'Under Revision',
  after_sell_revision_requested: 'After-Sale Revision Requested',
  under_after_sell_revision: 'Under After-Sale Revision',
  done_after_sell_revision: 'Done After-Sale Revision',
  completed: 'Completed',
  declined: 'Cancelled',
};

export default function ClientOrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get('status');
  const initialTab =
    searchParams.get('tab') === 'requested'
      ? 'requested'
      : initialStatus === 'active'
        ? 'active'
        : initialStatus === 'completed'
          ? 'completed'
          : 'all';
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState(initialTab);
  const [page, setPage] = useState(1);
  const [requestedPage, setRequestedPage] = useState(1);
  const { notifications } = useSocketNotifications();
  const lastHandledNotificationIdRef = useRef<string | null>(null);

  const statusParamMap: Record<string, string> = {
    all: 'all',
    active: 'active',
    pending: 'pending',
    'in-progress': 'accepted',
    'payment-pending': 'payment_pending',
    completed: 'completed',
    cancelled: 'cancelled',
    requested: 'all',
  };

  const {
    data: ordersData,
    isLoading: isOrdersLoading,
    isFetching: isOrdersFetching,
    refetch: refetchOrders,
  } = useGetClientOrdersQuery(
    {
      page,
      limit: 6,
      search,
      status: statusParamMap[activeTab] || 'all',
    },
    {
      refetchOnFocus: true,
      refetchOnReconnect: true,
      pollingInterval: 15000,
    }
  );

  const {
    data: requestsData,
    isLoading: isRequestsLoading,
    isFetching: isRequestsFetching,
    refetch: refetchRequests,
  } = useGetClientServiceRequestsQuery(
    {
      page: requestedPage,
      limit: 6,
      search,
      status: 'all',
    },
    {
      refetchOnFocus: true,
      refetchOnReconnect: true,
      pollingInterval: 15000,
    }
  );

  const orders = useMemo(
    () => ((ordersData?.data?.items || []) as ClientOrder[]).filter(Boolean),
    [ordersData]
  );
  const requestedOrders = useMemo(
    () => ((requestsData?.data?.items || []) as ClientServiceRequest[]).filter(Boolean),
    [requestsData]
  );
  const resolveRequestedStatus = (request: ClientServiceRequest) => {
    const linkedStatus = String(request.linkedOrderStatus || '').trim().toLowerCase();
    if (linkedStatus) return linkedStatus;
    if (request.acceptedAt) return 'accepted';
    return request.status;
  };
  const filteredOrders = useMemo(() => {
    if (activeTab === 'requested') return [];
    if (activeTab === 'all') return orders;
    if (activeTab === 'active') return orders;
    if (activeTab === 'pending') return orders.filter((o) => o.status === 'pending');
    if (activeTab === 'in-progress') return orders.filter((o) => o.status === 'accepted');
    if (activeTab === 'payment-pending') return orders.filter((o) => o.status === 'accepting_delivery');
    if (activeTab === 'completed') return orders.filter((o) => o.status === 'completed');
    if (activeTab === 'cancelled') return orders.filter((o) => o.status === 'declined');
    return orders;
  }, [orders, activeTab]);

  const ordersPagination = ordersData?.data?.pagination;
  const requestedPagination = requestsData?.data?.pagination;
  const isRequestTab = activeTab === 'requested';
  const currentLoading = isRequestTab ? isRequestsLoading : isOrdersLoading;
  const currentFetching = isRequestTab ? isRequestsFetching : isOrdersFetching;
  const currentPagination = isRequestTab ? requestedPagination : ordersPagination;

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
      type === 'order_delivery_submitted' ||
      type === 'order_revision_requested' ||
      type === 'order_revision_accepted' ||
      type === 'order_revision_declined' ||
      type === 'order_revision_cancelled_self' ||
      type === 'order_after_sell_revision_requested' ||
      type === 'order_after_sell_revision_accepted' ||
      type === 'order_after_sell_revision_declined' ||
      type === 'order_after_sell_revision_cancelled' ||
      type === 'order_after_sell_revision_completed' ||
      type === 'order_finalized' ||
      type === 'service_request_accepted' ||
      type === 'custom_category_request_approved'
    ) {
      lastHandledNotificationIdRef.current = latest.id;
      refetchOrders();
      refetchRequests();
    }
  }, [notifications, refetchOrders, refetchRequests]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12 pb-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6"
        >
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">My Orders</h1>
            <p className="text-slate-500 mt-2 text-lg">
              Manage your service bookings and track their progress. Total orders: {(ordersPagination?.totalItems || ordersData?.data?.pagination?.totalItems || 0)}
            </p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-80">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search by order ID, service, or provider..."
                className="pl-10 h-12 w-full bg-white border-slate-200 focus:ring-primary/20"
                value={search}
                onChange={(e) => {
                  setPage(1);
                  setRequestedPage(1);
                  setSearch(e.target.value);
                }}
              />
            </div>
          </div>
        </motion.div>

        <Tabs
          value={activeTab}
          className="w-full"
          onValueChange={(value) => {
            setPage(1);
            setRequestedPage(1);
            setActiveTab(value);
          }}
        >
          <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 mb-8 inline-flex w-full md:w-auto overflow-x-auto hide-scrollbar">
            <TabsList className="bg-transparent h-10 w-full md:w-auto justify-start">
              <TabsTrigger value="all" className="px-6 rounded-lg data-[state=active]:bg-[#2286BE] data-[state=active]:text-white">
                All
              </TabsTrigger>
              <TabsTrigger value="active" className="px-6 rounded-lg data-[state=active]:bg-[#2286BE] data-[state=active]:text-white">
                Active
              </TabsTrigger>
              <TabsTrigger value="pending" className="px-6 rounded-lg data-[state=active]:bg-[#2286BE] data-[state=active]:text-white">
                Pending
              </TabsTrigger>
              <TabsTrigger value="in-progress" className="px-6 rounded-lg data-[state=active]:bg-[#2286BE] data-[state=active]:text-white">
                In Progress
              </TabsTrigger>
              <TabsTrigger value="payment-pending" className="px-6 rounded-lg data-[state=active]:bg-[#2286BE] data-[state=active]:text-white">
                Payment Pending
              </TabsTrigger>
              <TabsTrigger value="completed" className="px-6 rounded-lg data-[state=active]:bg-[#2286BE] data-[state=active]:text-white">
                Completed
              </TabsTrigger>
              <TabsTrigger value="cancelled" className="px-6 rounded-lg data-[state=active]:bg-[#2286BE] data-[state=active]:text-white">
                Cancelled
              </TabsTrigger>
              <TabsTrigger value="requested" className="px-6 rounded-lg data-[state=active]:bg-[#2286BE] data-[state=active]:text-white">
                Requested Orders
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value={activeTab} className="mt-0 outline-none">
            <AnimatePresence mode="wait">
              {currentLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-dashed border-slate-300"
                >
                  <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center mb-6">
                    <Package size={40} className="text-slate-300" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">
                    {isRequestTab ? 'Loading requested orders...' : 'Loading orders...'}
                  </h3>
                </motion.div>
              ) : isRequestTab ? (
                requestedOrders.length > 0 ? (
                  <motion.div
                    key={`${activeTab}-${search}-${requestedPage}`}
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  >
                    {requestedOrders.map((request) => (
                      <motion.div key={request.id} variants={itemVariants} className="h-full">
                        <Card className="h-full overflow-hidden border-slate-200 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 group">
                          <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/30 group-hover:bg-slate-50 transition-colors">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded">Request ID</span>
                                <p className="text-xs font-bold text-slate-500">{request.requestNumber || request.id}</p>
                              </div>
                              <h3 className="font-bold text-xl text-slate-900 line-clamp-1 group-hover:text-primary transition-colors">
                                {request.categoryName || 'Service Request'}
                              </h3>
                              <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                Location: {request.serviceAddress || 'Location unavailable'}
                              </p>
                              {request.requestSource === 'custom_category' ? (
                                <p className="mt-2 text-[11px] font-bold uppercase tracking-wider text-indigo-500">
                                  {request.customCategoryApprovalStatus === 'approved'
                                    ? 'Custom category approved'
                                    : 'Waiting for admin category approval'}
                                </p>
                              ) : null}
                            </div>
                              <Badge
                                className={`px-3 py-1 rounded-full text-xs font-bold ${
                                resolveRequestedStatus(request) === 'completed'
                                  ? 'bg-[#2286BE]/10 text-[#2286BE] border-[#2286BE]/20'
                                  : resolveRequestedStatus(request) === 'accepted'
                                  ? 'bg-[#2286BE]/10 text-[#2286BE] border-[#2286BE]/20'
                                  : resolveRequestedStatus(request) === 'pending'
                                    ? 'bg-blue-100 text-blue-700 border-blue-200'
                                    : resolveRequestedStatus(request) === 'accepting_delivery'
                                      ? 'bg-violet-100 text-violet-700 border-violet-200'
                                      : resolveRequestedStatus(request) === 'declined'
                                    ? 'bg-red-100 text-red-700 border-red-200'
                                    : 'bg-blue-100 text-blue-700 border-blue-200'
                              }`}
                            >
                              {resolveRequestedStatus(request) === 'completed'
                                ? 'Completed'
                                : ORDER_STYLE_STATUS_LABEL[resolveRequestedStatus(request)] || REQUEST_STATUS_LABEL[request.status] || request.status}
                            </Badge>
                          </div>
                          <CardContent className="flex h-full flex-col p-6">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
                              <div className="flex items-center gap-4">
                                <Avatar className="h-14 w-14 border border-slate-100">
                                  {request.acceptedProvider?.avatar ? (
                                    <AvatarImage src={request.acceptedProvider.avatar} alt={request.acceptedProvider.name || 'Provider'} />
                                  ) : null}
                                  <AvatarFallback className="bg-slate-100 text-slate-500">
                                    <User size={18} />
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-bold text-slate-900 text-base">{request.acceptedProvider?.name || 'Awaiting provider'}</p>
                                  <div className="flex flex-col gap-1 mt-1">
                                    <p className="text-xs text-slate-500 flex items-center font-medium">
                                      <MapPin size={12} className="mr-1.5 text-slate-400" /> {request.serviceAddress || 'Location unavailable'}
                                    </p>
                                    <p className="text-xs text-slate-500 flex items-center font-medium">
                                      <CalendarIcon size={12} className="mr-1.5 text-slate-400" />
                                      {request.preferredDate ? new Date(request.preferredDate).toLocaleDateString() : 'Any date'} • {request.preferredTime}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right w-full sm:w-auto pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-100 flex sm:block justify-between items-center">
                                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1 block sm:hidden">Budget</p>
                              <div className="text-right">
                                  <p className="text-2xl font-black text-slate-900 tracking-tight">
                                    ${Number(request.budget || 0).toFixed(2)}
                                  </p>
                                  <p className="text-[10px] font-bold text-[#2286BE] bg-[#2286BE]/10 px-2 py-0.5 rounded mt-1 inline-block uppercase tracking-widest">
                                    {request.linkedOrderPaymentStatus === 'paid' ? 'Paid via App' : request.acceptedAt ? 'Accepted' : 'Requested'}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 font-medium">
                              {request.description}
                            </div>

                            <div className="mt-4 min-h-[74px]">
                              {request.requestSource === 'custom_category' && request.pendingAdminCategoryApproval ? (
                                <div className="rounded-2xl border border-dashed border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-medium text-indigo-700">
                                  Your new category request for {request.customCategoryName || request.categoryName} is waiting for admin approval.
                                </div>
                              ) : null}
                            </div>

                            <div className="mt-auto grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                              <Button
                                variant="outline"
                                className="w-full h-12 font-bold text-slate-600 border-slate-200 hover:bg-slate-50 active:scale-95 transition-all"
                                onClick={() =>
                                  router.push(
                                    request.linkedOrderId
                                      ? `/messages?orderId=${String(request.linkedOrderId)}`
                                      : `/messages?orderId=${request.requestNumber || request.id}`
                                  )
                                }
                              >
                                <MessageSquare size={18} className="mr-2" /> Message
                              </Button>
                              <Button
                                className="w-full h-12 font-bold bg-[#2286BE] hover:bg-[#059669] shadow-lg shadow-[#2286BE]/20 active:scale-95 transition-all"
                                onClick={() =>
                                  router.push(
                                    request.linkedOrderNumber
                                      ? `/client/orders/${request.linkedOrderNumber}`
                                      : request.linkedOrderId
                                        ? `/client/orders/${String(request.linkedOrderId)}`
                                        : '/client/orders?tab=requested'
                                  )
                                }
                              >
                                Track Order
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty-requested"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-dashed border-slate-300"
                  >
                    <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center mb-6">
                      <Package size={40} className="text-slate-300" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">No requested orders yet</h3>
                    <p className="text-slate-500 max-w-xs text-center mb-8">
                      When you post a request, it will appear here for tracking.
                    </p>
                    <Button onClick={() => window.location.assign('/post-request')} className="bg-[#2286BE] hover:bg-[#1b6da0]">
                      Post a Request
                    </Button>
                  </motion.div>
                )
              ) : filteredOrders.length > 0 ? (
                <motion.div
                  key={`${activeTab}-${search}-${page}`}
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                  {filteredOrders.map((order) => (
                    <motion.div key={order.id} variants={itemVariants}>
                      <Card className="overflow-hidden border-slate-200 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 group">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/30 group-hover:bg-slate-50 transition-colors">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded">Order ID</span>
                              <p className="text-xs font-bold text-slate-500">{order.orderNumber || order.id}</p>
                            </div>
                            <h3 className="font-bold text-xl text-slate-900 line-clamp-1 group-hover:text-primary transition-colors">
                              {order.orderName}
                            </h3>
                            <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                              Category: {order.categoryName || 'General'}
                            </p>
                          </div>
                          <Badge
                            className={`px-3 py-1 rounded-full text-xs font-bold
                              ${
                                order.status === 'completed'
                                  ? 'bg-[#2286BE]/10 text-[#2286BE] border-[#2286BE]/20'
                                  : order.status === 'accepted'
                                    ? 'bg-amber-100 text-amber-700 border-amber-200'
                                    : order.status === 'pending'
                                      ? 'bg-blue-100 text-blue-700 border-blue-200'
                                      : order.status === 'accepting_delivery'
                                        ? 'bg-violet-100 text-violet-700 border-violet-200'
                                        : 'bg-red-100 text-red-700 border-red-200'
                              }`}
                          >
                            {STATUS_LABEL[order.status] || order.status}
                          </Badge>
                        </div>
                        <CardContent className="p-6">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
                            <div className="flex items-center gap-4">
                              <Avatar className="h-14 w-14 border border-slate-100">
                                {order.provider?.avatar ? <AvatarImage src={order.provider.avatar} alt={order.provider.name} /> : null}
                                <AvatarFallback className="bg-slate-100 text-slate-500">
                                  <User size={18} />
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-bold text-slate-900 text-base">{order.provider?.name || 'Provider'}</p>
                                <div className="flex flex-col gap-1 mt-1">
                                  <p className="text-xs text-slate-500 flex items-center font-medium">
                                    <MapPin size={12} className="mr-1.5 text-slate-400" /> {order.serviceAddress || 'Location unavailable'}
                                  </p>
                                  <p className="text-xs text-slate-500 flex items-center font-medium">
                                    <CalendarIcon size={12} className="mr-1.5 text-slate-400" />
                                    {new Date(order.completedAt || order.scheduledDate).toLocaleDateString()} • {order.scheduledTime}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="text-right w-full sm:w-auto pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-100 flex sm:block justify-between items-center">
                              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1 block sm:hidden">Total Amount</p>
                              <div className="text-right">
                                <p className="text-2xl font-black text-slate-900 tracking-tight">${Number(order.paymentAmount || order.packagePrice || 0).toFixed(2)}</p>
                                {order.status === 'completed' ? (
                                  <p className="text-[10px] font-bold text-[#2286BE] bg-[#2286BE]/10 px-2 py-0.5 rounded mt-1 inline-block uppercase tracking-widest">
                                    Paid via App
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <Link
                              href={
                                order.conversationId
                                  ? `/messages?conversationId=${String(order.conversationId)}&orderId=${order.id}`
                                  : `/messages?orderId=${order.id}&user=${order.provider?.id || ''}`
                              }
                              className="w-full"
                            >
                              <Button variant="outline" className="w-full h-12 font-bold text-slate-600 border-slate-200 hover:bg-slate-50 active:scale-95 transition-all">
                                <MessageSquare size={18} className="mr-2" /> Message
                              </Button>
                            </Link>
                            <Link href={`/client/orders/${order.orderNumber || order.id}`} className="w-full">
                              <Button className="w-full h-12 font-bold bg-[#2286BE] hover:bg-[#059669] shadow-lg shadow-[#2286BE]/20 active:scale-95 transition-all">
                                Track Order
                              </Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-dashed border-slate-300"
                >
                  <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center mb-6">
                    <Package size={40} className="text-slate-300" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">No orders found</h3>
                  <p className="text-slate-500 max-w-xs text-center mb-8">
                    We could not find any orders matching your current filters or search criteria.
                  </p>
                  <Button
                    onClick={() => {
                      setSearch('');
                      setActiveTab('all');
                      setPage(1);
                      setRequestedPage(1);
                    }}
                    variant="outline"
                    className="border-slate-200"
                  >
                    Clear all filters
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>
        </Tabs>
      </div>

      <div className="pointer-events-none fixed bottom-4 left-1/2 z-50 -translate-x-1/2">
        <div className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/95 px-3 py-2 shadow-xl backdrop-blur">
          <Button
            variant="outline"
            size="sm"
            disabled={!currentPagination?.hasPrevPage || currentFetching}
            onClick={() => (isRequestTab ? setRequestedPage((prev) => Math.max(1, prev - 1)) : setPage((prev) => Math.max(1, prev - 1)))}
            className="h-9 rounded-xl border-slate-200 text-xs font-black uppercase tracking-widest"
          >
            Prev
          </Button>
          <span className="text-xs font-black uppercase tracking-widest text-slate-600">
            {(currentPagination?.page || (isRequestTab ? requestedPage : page))} / {(currentPagination?.totalPages || 1)}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={!currentPagination?.hasNextPage || currentFetching}
            onClick={() => (isRequestTab ? setRequestedPage((prev) => prev + 1) : setPage((prev) => prev + 1))}
            className="h-9 rounded-xl border-slate-200 text-xs font-black uppercase tracking-widest"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
