'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Star, MessageSquare, AlertTriangle,
  CheckCircle2, Clock, MapPin, UploadCloud,
  X, HelpCircle, FileText, Image as ImageIcon,
  AlertCircle, User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  useCancelClientRevisionMutation,
  useConfirmClientCheckoutPaymentMutation,
  useCreateClientCheckoutSessionMutation,
  useGetClientOrderDetailQuery,
  useRequestClientRevisionMutation,
  useStartRepeatOrderConversationMutation,
  useSubmitClientOrderReviewMutation,
  useSendClientResolutionMessageMutation,
} from '@/store/services/apiSlice';
import { useSocketNotifications } from '@/contexts/SocketContext';

type ClientOrder = {
  id: string;
  orderNumber: string;
  conversationId?: string | null;
  repeatRootOrderId?: string | null;
  repeatSourceOrderId?: string | null;
  repeatIteration?: number;
  repeatOrderCount?: number;
  canRequestRepeatOrder?: boolean;
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
  specialInstructions?: string;
  deliveryNote?: string;
  deliveryImages?: string[];
  revisionRequestNote?: string;
  revisionResponseNote?: string;
  provider: {
    id: string;
    name: string;
    avatar: string;
    averageRating?: number;
    reviewCount?: number;
    completedOrders?: number;
  };
  paymentStatus?: 'unpaid' | 'pending' | 'paid' | 'failed';
};

const statusLabel = (status: ClientOrder['status']) => {
  if (status === 'completed') return 'Completed';
  if (status === 'accepting_delivery') return 'Payment Pending';
  if (status === 'revision_requested') return 'Request Revision';
  if (status === 'under_revision') return 'Under Revision';
  if (status === 'after_sell_revision_requested') return 'After-Sale Revision Requested';
  if (status === 'under_after_sell_revision') return 'Under After-Sale Revision';
  if (status === 'done_after_sell_revision') return 'Done After-Sale Revision';
  if (status === 'accepted') return 'In Progress';
  if (status === 'declined') return 'Cancelled';
  return 'Pending';
};

export default function OrderTrackingPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderIdOrNumber = typeof params?.id === 'string' ? params.id : '';

  const [activeModal, setActiveModal] = useState<null | 'complete' | 'review' | 'revision' | 'cancel'>(null);
  const [revisionMode, setRevisionMode] = useState<'delivery' | 'after_sell'>('delivery');
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [revisionText, setRevisionText] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [cancelText, setCancelText] = useState('');
  const paymentHandledRef = useRef<string | null>(null);
  const { notifications } = useSocketNotifications();
  const lastHandledNotificationIdRef = useRef<string | null>(null);

  const { data, isLoading, refetch } = useGetClientOrderDetailQuery(orderIdOrNumber, { skip: !orderIdOrNumber });
  const [createCheckoutSession, { isLoading: isCreatingCheckout }] = useCreateClientCheckoutSessionMutation();
  const [confirmCheckoutPayment, { isLoading: isConfirmingPayment }] = useConfirmClientCheckoutPaymentMutation();
  const [startRepeatOrderConversation, { isLoading: isStartingRepeatOrder }] = useStartRepeatOrderConversationMutation();
  const [submitOrderReview, { isLoading: isSubmittingReview }] = useSubmitClientOrderReviewMutation();
  const [requestRevision, { isLoading: isRequestingRevision }] = useRequestClientRevisionMutation();
  const [cancelRevision, { isLoading: isCancelingRevision }] = useCancelClientRevisionMutation();
  const [sendResolutionMessage, { isLoading: isSendingResolution }] = useSendClientResolutionMessageMutation();

  const order = useMemo(() => (data?.data?.order || null) as ClientOrder | null, [data]);
  const providerRating = Number(order?.provider?.averageRating || 0);
  const providerReviewCount = Number(order?.provider?.reviewCount || 0);
  const orderStatus = order?.status || 'pending';
  const displayStatus = statusLabel(orderStatus as ClientOrder['status']);
  const messagePath = order
    ? order.conversationId
      ? `/messages?conversationId=${String(order.conversationId)}&orderId=${order.id}`
      : `/messages?orderId=${order.id}&user=${order.provider?.id || ''}`
    : '/messages';
  const repeatOrderCount = Math.max(1, Number(order?.repeatOrderCount || order?.repeatIteration || 1));

  useEffect(() => {
    const sessionId = searchParams.get('session_id') || searchParams.get('sessionId');
    if (!sessionId || !order || paymentHandledRef.current === sessionId) return;

    paymentHandledRef.current = sessionId;
    confirmCheckoutPayment({
      id: order.id,
      sessionId,
    })
      .unwrap()
      .then(async (response) => {
        setRating(0);
        setHoveredRating(0);
        setReviewText('');
        if (!response?.data?.order?.clientRating) {
          setActiveModal('review');
          toast.success('Payment completed. Please rate your provider.');
        } else {
          setActiveModal(null);
          toast.success('Payment completed and order marked complete.');
        }
        await refetch();
      })
      .catch((error: any) => {
        toast.error(error?.data?.message || 'Payment confirmation failed.');
      });
  }, [confirmCheckoutPayment, order, refetch, searchParams]);

  useEffect(() => {
    if (!notifications.length) return;
    const latest = notifications[0] as {
      id?: string;
      data?: { notificationType?: string; orderId?: string };
    };
    if (!latest?.id || latest.id === lastHandledNotificationIdRef.current) return;

    const type = latest?.data?.notificationType;
    const notificationOrderId = String(latest?.data?.orderId || '');
    const isSameOrder = Boolean(order?.id) && notificationOrderId === String(order?.id);
    const isRelevantType =
      type === 'order_delivery_submitted' ||
      type === 'order_revision_accepted' ||
      type === 'order_revision_declined' ||
      type === 'order_revision_cancelled_self' ||
      type === 'order_revision_requested' ||
      type === 'order_revision_cancelled' ||
      type === 'order_after_sell_revision_requested' ||
      type === 'order_after_sell_revision_accepted' ||
      type === 'order_after_sell_revision_declined' ||
      type === 'order_after_sell_revision_cancelled' ||
      type === 'order_after_sell_revision_completed' ||
      type === 'order_finalized';

    if (isSameOrder || isRelevantType) {
      lastHandledNotificationIdRef.current = latest.id;
      refetch();
    }
  }, [notifications, order?.id, refetch]);

  const handleCompleteOrder = async () => {
    if (!order) return;
    if (order.status !== 'accepting_delivery') {
      toast.error('Delivery is not ready for finalization.');
      return;
    }

    try {
      const session = await createCheckoutSession({ id: order.id }).unwrap();
      if (!session?.data?.checkoutUrl && !session?.data?.sessionId) {
        throw new Error('Stripe checkout session not created.');
      }

      setActiveModal(null);
      toast.info('Redirecting to secure payment checkout...');
      if (typeof window !== 'undefined') {
        window.location.href = String(session.data.checkoutUrl || window.location.href);
      }
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to complete order.');
    }
  };

  const handleSubmitReview = async () => {
    if (!order) return;
    if (rating === 0) return toast.error('Please select a rating.');

    try {
      await submitOrderReview({
        id: order.id,
        rating,
        review: reviewText.trim(),
      }).unwrap();
      setActiveModal(null);
      setRating(0);
      setHoveredRating(0);
      setReviewText('');
      toast.success('Thanks for your review.');
      await refetch();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to submit review.');
    }
  };

  const handleRequestRevision = () => {
    if (!revisionText) return toast.error('Please provide details for the revision.');
    if (!order) return;
    const mode = revisionMode;
    if (revisionMode === 'delivery' && order.status !== 'accepting_delivery') {
      toast.error('Revision can be requested only when delivery is pending your approval.');
      return;
    }
    if (revisionMode === 'after_sell' && !(order.status === 'completed' && order.paymentStatus === 'paid')) {
      toast.error('After-sale revision can only be requested after payment is completed.');
      return;
    }
    requestRevision({ id: order.id, note: revisionText.trim() })
      .unwrap()
      .then(async () => {
        setActiveModal(null);
        setRevisionText('');
        setRevisionMode('delivery');
        toast.success(mode === 'after_sell' ? 'After-sale revision request sent to the provider.' : 'Revision request sent to the provider.');
        await refetch();
      })
      .catch((error: any) => {
        toast.error(error?.data?.message || 'Failed to request revision.');
      });
  };

  const handleCancelRevision = () => {
    if (!order) return;
    if (!['revision_requested', 'under_revision', 'after_sell_revision_requested', 'under_after_sell_revision'].includes(order.status)) {
      toast.error('No active revision request to cancel.');
      return;
    }
    if (!cancelReason || !cancelText) return toast.error('Please complete all fields to cancel the revision request.');
    cancelRevision(order.id)
      .unwrap()
      .then(async () => {
        setActiveModal(null);
        setRevisionMode('delivery');
        toast.success(
          ['after_sell_revision_requested', 'under_after_sell_revision'].includes(order.status)
            ? 'After-sale revision request cancelled.'
            : 'Revision request cancelled. Order is back to delivery approval.'
        );
        await refetch();
      })
      .catch((error: any) => {
      toast.error(error?.data?.message || 'Failed to cancel revision request.');
      });
  };

  const handleTalkWithProvider = async () => {
    if (!order) return;
    try {
      const text = `Resolution discussion for ${order.orderNumber || order.id}: ${order.revisionRequestNote || 'Please review my latest concern.'}`;
      const res = await sendResolutionMessage({ id: order.id, text }).unwrap();
      const conversationId = String((res?.data as any)?.conversationId || '');
      if (conversationId) {
        window.location.href = `/messages?conversationId=${conversationId}&orderId=${order.id}`;
      } else {
        window.location.href = messagePath;
      }
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to send resolution message.');
    }
  };

  const handleRepeatOrder = async () => {
    if (!order) return;
    try {
      const result = await startRepeatOrderConversation({ sourceOrderId: order.id }).unwrap();
      const conversationId = String(result?.data?.conversation?.id || '');
      if (!conversationId) {
        toast.error('Repeat order chat is unavailable right now.');
        return;
      }
      router.push(`/messages?conversationId=${conversationId}&sourceOrderId=${order.id}&proposalType=repeat_order`);
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to start repeat order chat.');
    }
  };

  const closeModal = () => {
    setActiveModal(null);
    setRevisionMode('delivery');
  };

  if (isLoading || !order) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] py-12 relative">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/50 border border-slate-100 text-center text-slate-500 font-bold">
            Loading order details...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12 relative">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/client/orders" className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-[#2286BE] transition-colors mb-8">
          <ArrowLeft size={16} className="mr-2" /> Back to My Orders
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/50 border border-slate-100">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-10">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#2286BE] bg-[#2286BE]/10 px-3 py-1 rounded-full">
                      {order.orderNumber || order.id}
                    </span>
                    <Badge
                      className={`
                        px-3 py-1 text-[10px] rounded-full uppercase tracking-widest font-black border-none
                        ${displayStatus === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                          displayStatus === 'Payment Pending' ? 'bg-amber-100 text-amber-700' :
                          'bg-[#2286BE]/10 text-[#2286BE]'}
                      `}
                    >
                      {displayStatus}
                    </Badge>
                  </div>
                  <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">{order.orderName}</h1>
                  <p className="mt-2 text-[11px] font-black uppercase tracking-wider text-slate-400">
                    Category: {order.categoryName || 'General'}
                  </p>
                  {repeatOrderCount > 1 ? (
                    <div className="mt-4">
                      <Badge className="bg-[#2286BE]/10 text-[#2286BE] border-none px-3 py-1 rounded-full font-black text-[10px] uppercase tracking-widest">
                        Ordered {repeatOrderCount} Times
                      </Badge>
                    </div>
                  ) : null}
                </div>
                <div className="text-left md:text-right shrink-0">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Amount</p>
                  <p className="text-4xl font-black text-slate-900 tracking-tight">${Number(order.paymentAmount || order.packagePrice || 0).toFixed(2)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50/50 p-6 rounded-3xl border border-slate-100 mb-8">
                <div className="flex gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center text-[#2286BE] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
                    <Clock size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Date & Time</p>
                    <p className="font-bold text-slate-900">
                      {new Date(order.scheduledDate).toLocaleDateString()} at {order.scheduledTime}
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center text-[#2286BE] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Service Location</p>
                    <p className="font-bold text-slate-900 line-clamp-2 pr-4">{order.serviceAddress || 'Location unavailable'}</p>
                  </div>
                </div>
              </div>

              {order.status === 'accepting_delivery' && (
                <div className="bg-[#2286BE]/5 border border-[#2286BE]/10 rounded-[2.5rem] p-10 mt-10 relative overflow-hidden">
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-[#2286BE]">
                          <UploadCloud size={24} />
                        </div>
                        <div>
                          <h3 className="text-2xl font-black text-slate-900 tracking-tight">Provider Delivery</h3>
                          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-0.5">Submitted by provider</p>
                        </div>
                      </div>
                      <Badge className="bg-amber-500 text-white border-none px-4 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-widest">Awaiting Approval</Badge>
                    </div>

                    <div className="bg-white border border-[#2286BE]/10 rounded-3xl p-8 mb-8">
                      <p className="text-slate-700 font-medium leading-relaxed italic mb-6">
                        &ldquo;{order.deliveryNote || 'Delivery note not provided.'}&rdquo;
                      </p>
                      <div className="grid grid-cols-3 gap-4">
                        {(Array.isArray(order.deliveryImages) && order.deliveryImages.length > 0 ? order.deliveryImages : ['']).slice(0, 3).map((img, idx) => (
                          <div key={`${img}-${idx}`} className="aspect-square bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center justify-center p-4 text-center group cursor-pointer hover:bg-slate-100 transition-all transition-colors overflow-hidden">
                            {img ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={img} alt="Delivery proof" className="h-full w-full object-cover rounded-xl" />
                            ) : (
                              <>
                                <ImageIcon size={20} className="text-slate-300 mb-2" />
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">No Image</span>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button
                        onClick={() => setActiveModal('revision')}
                        variant="outline"
                        className="flex-1 h-16 rounded-2xl border-slate-200 text-slate-600 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 font-black transition-all"
                      >
                        Request Revision
                      </Button>
                      <Button
                        onClick={() => setActiveModal('complete')}
                        className="flex-1 h-16 bg-slate-900 hover:bg-black text-white font-black shadow-xl shadow-slate-900/20 transition-all"
                      >
                        Approve and Make Payment
                      </Button>
                    </div>
                  </div>
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[#2286BE]/5 rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl pointer-events-none" />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-white rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/50 border border-slate-100 text-center relative overflow-hidden group">
              <div className="relative z-10">
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-[#2286BE]/5 to-[#2286BE]/20 mx-auto mb-4 flex items-center justify-center text-3xl font-black text-[#2286BE] shadow-inner ring-4 ring-white overflow-hidden">
                  {order.provider?.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={order.provider.avatar} alt={order.provider.name || 'Provider'} className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-10 w-10" aria-hidden="true" />
                  )}
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-1">{order.provider?.name || 'Provider'}</h3>
                <div className="flex items-center justify-center gap-2 mb-8 text-sm font-bold text-slate-400">
                  <Star size={14} className="text-amber-400 fill-amber-400" />
                  <span className="text-slate-900">{providerRating.toFixed(1)}</span>
                  <span>
                    {providerReviewCount > 0
                      ? `(${providerReviewCount} review${providerReviewCount === 1 ? '' : 's'})`
                      : `(${Number(order.provider?.completedOrders || 0)} orders)`}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <Link href={messagePath} className="block">
                    <Button variant="outline" className="w-full h-14 rounded-2xl border-slate-200 text-slate-700 hover:bg-[#2286BE]/5 hover:text-[#2286BE] hover:border-[#2286BE]/20 font-black transition-all">
                      <MessageSquare size={18} className="mr-2" /> Message Pro
                    </Button>
                  </Link>
                  <Link href={`/provider/${order.provider?.id || ''}`} className="block">
                    <Button variant="ghost" className="w-full h-12 rounded-xl text-slate-400 hover:text-[#2286BE] hover:bg-[#2286BE]/5 font-black text-sm transition-all">
                      View Portfolio
                    </Button>
                  </Link>
                  {(['completed', 'done_after_sell_revision'].includes(order.status) || order.paymentStatus === 'paid') &&
                  !['after_sell_revision_requested', 'under_after_sell_revision'].includes(order.status) ? (
                    <Button
                      variant="outline"
                      className="w-full h-12 rounded-2xl border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-300 font-black transition-all"
                      onClick={() => {
                        setRevisionMode('after_sell');
                        setActiveModal('revision');
                      }}
                    >
                      Request After-Sale Revision
                    </Button>
                  ) : null}
                  {order.canRequestRepeatOrder ? (
                    <Button
                      onClick={() => void handleRepeatOrder()}
                      disabled={isStartingRepeatOrder}
                      className="w-full h-12 rounded-2xl bg-slate-900 hover:bg-black text-white font-black transition-all"
                    >
                      {isStartingRepeatOrder ? 'Opening chat...' : 'Order This Again'}
                    </Button>
                  ) : null}
                </div>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#2286BE]/5 rounded-full translate-x-1/2 -translate-y-1/2 blur-2xl group-hover:bg-[#2286BE]/10 transition-colors" />
            </div>

            {['revision_requested', 'under_revision', 'after_sell_revision_requested', 'under_after_sell_revision'].includes(order.status) && (
              <div className="bg-red-50/50 rounded-[2.5rem] p-8 border border-red-100 relative overflow-hidden">
                <div className="relative z-10">
                  <h4 className="text-sm font-black text-red-900 mb-2 uppercase tracking-widest flex items-center">
                    <AlertTriangle size={14} className="mr-2 text-red-500" /> Resolution Center
                  </h4>
                  <p className="text-xs font-medium text-red-700/80 leading-relaxed mb-2">
                    {order.status === 'under_revision' || order.status === 'under_after_sell_revision'
                      ? 'Your order is under revision. You can talk with provider or cancel revision request.'
                      : 'Revision request sent. You can talk with provider or cancel revision request.'}
                  </p>
                  {order.revisionRequestNote ? (
                    <p className="text-xs font-bold text-red-800/80 mb-4">Revision note: {order.revisionRequestNote}</p>
                  ) : null}
                  <div className="space-y-3">
                    <Button
                      onClick={() => setActiveModal('cancel')}
                      disabled={isCancelingRevision}
                      className="w-full h-12 bg-white text-red-600 hover:bg-red-600 hover:text-white border-2 border-red-100 hover:border-red-600 rounded-xl font-black transition-all shadow-sm"
                    >
                      {isCancelingRevision ? 'Canceling...' : 'Request Cancellation'}
                    </Button>
                    <Button
                      onClick={handleTalkWithProvider}
                      disabled={isSendingResolution}
                      variant="ghost"
                      className="w-full h-12 bg-transparent text-slate-400 hover:text-[#2286BE] hover:bg-[#2286BE]/5 font-black rounded-xl transition-all"
                    >
                      {isSendingResolution ? 'Sending...' : 'Talk with Provider'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="bg-slate-50 px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                  {activeModal === 'complete' && <><CheckCircle2 size={24} className="text-[#2286BE]" /> Complete Order</>}
                  {activeModal === 'review' && <><Star size={24} className="text-amber-500" /> Rate Your Provider</>}
                  {activeModal === 'revision' && (
                    <>
                      <HelpCircle size={24} className="text-amber-500" />
                      {revisionMode === 'after_sell' ? 'Request After-Sale Revision' : 'Request Revision'}
                    </>
                  )}
                  {activeModal === 'cancel' && <><AlertTriangle size={24} className="text-red-500" /> Cancel Revision Request</>}
                </h2>
                <button onClick={closeModal} className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-900 shadow-sm border border-slate-100 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 overflow-y-auto">
                {activeModal === 'complete' && (
                  <div className="space-y-6">
                    <p className="text-sm font-medium text-slate-500 leading-relaxed bg-[#2286BE]/5 p-4 rounded-2xl border border-[#2286BE]/10">
                      You&apos;ll be sent to Stripe Checkout to complete payment securely. Once payment is successful,
                      you&apos;ll return here and can rate your provider.
                    </p>
                    <Button onClick={handleCompleteOrder} disabled={isCreatingCheckout || isConfirmingPayment} className="w-full h-16 rounded-2xl bg-[#2286BE] hover:bg-[#1b6da0] font-black text-lg shadow-xl shadow-[#2286BE]/20">
                      {isCreatingCheckout || isConfirmingPayment ? 'Processing Payment...' : 'Proceed to Payment'}
                    </Button>
                  </div>
                )}

                {activeModal === 'review' && (
                  <div className="space-y-6">
                    <div className="text-center mb-8">
                      <div className="flex justify-center gap-2 mb-4">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button
                            key={s}
                            onMouseEnter={() => setHoveredRating(s)}
                            onMouseLeave={() => setHoveredRating(0)}
                            onClick={() => setRating(s)}
                            className="transition-transform active:scale-90"
                          >
                            <Star
                              size={40}
                              className={`transition-colors ${s <= (hoveredRating || rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`}
                            />
                          </button>
                        ))}
                      </div>
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Rate your experience</p>
                    </div>
                    <textarea
                      placeholder="Share your feedback with the community..."
                      className="w-full h-32 p-6 rounded-3xl bg-slate-50 border-none focus:ring-2 focus:ring-[#2286BE] font-medium resize-none shadow-inner"
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                    />
                    <Button onClick={handleSubmitReview} disabled={isSubmittingReview} className="w-full h-16 rounded-2xl bg-[#2286BE] hover:bg-[#1b6da0] font-black text-lg shadow-xl shadow-[#2286BE]/20">
                      {isSubmittingReview ? 'Submitting Review...' : 'Submit Review'}
                    </Button>
                  </div>
                )}

                {activeModal === 'revision' && (
                  <div className="space-y-6">
                    <p className="text-sm font-medium text-slate-500 leading-relaxed bg-amber-50 p-4 rounded-2xl border border-amber-100">
                      {revisionMode === 'after_sell'
                        ? 'Describe the change you want after the order has already been completed. Be specific so the provider can respond quickly.'
                        : 'Describe what you&apos;d like to change. Be as specific as possible to help the provider meet your expectations.'}
                    </p>
                    <textarea
                      placeholder={
                        revisionMode === 'after_sell'
                          ? 'e.g., Please adjust the final work area and revisit the wall paint finish...'
                          : 'e.g., I need the kitchen tiles to be cleaned again, there are still some stains...'
                      }
                      className="w-full h-40 p-6 rounded-3xl bg-slate-50 border-none focus:ring-2 focus:ring-amber-500 font-medium resize-none shadow-inner"
                      value={revisionText}
                      onChange={(e) => setRevisionText(e.target.value)}
                    />
                    <Button
                      onClick={handleRequestRevision}
                      disabled={isRequestingRevision}
                      className="w-full h-16 rounded-2xl bg-amber-500 hover:bg-amber-600 font-black text-lg shadow-xl shadow-amber-500/20"
                    >
                      {isRequestingRevision
                        ? 'Sending...'
                        : revisionMode === 'after_sell'
                          ? 'Send After-Sale Revision'
                          : 'Send Revision Request'}
                    </Button>
                  </div>
                )}

                {activeModal === 'cancel' && (
                  <div className="space-y-6">
                    <div className="p-4 bg-red-50 rounded-2xl border border-red-100 flex gap-4">
                      <AlertCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
                      <p className="text-xs font-bold text-red-700 leading-relaxed">
                        This will only cancel your revision request. Your order will not be cancelled, and status will return to delivery approval.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Reason for cancelling revision</label>
                      <select
                        className="w-full h-12 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-red-500 font-bold px-4"
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                      >
                        <option value="">Select a reason</option>
                        <option value="unresponsive">Provider is unresponsive</option>
                        <option value="poor-quality">Poor quality work</option>
                        <option value="late">Revision is delayed</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <textarea
                      placeholder="Provide detailed context for cancelling this revision request..."
                      className="w-full h-32 p-6 rounded-3xl bg-slate-50 border-none focus:ring-2 focus:ring-red-500 font-medium resize-none shadow-inner"
                      value={cancelText}
                      onChange={(e) => setCancelText(e.target.value)}
                    />
                    <Button onClick={handleCancelRevision} className="w-full h-16 rounded-2xl bg-red-600 hover:bg-red-700 font-black text-lg shadow-xl shadow-red-600/20">
                      Cancel Revision Request
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
