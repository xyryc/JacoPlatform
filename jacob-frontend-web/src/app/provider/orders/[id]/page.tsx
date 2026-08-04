'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Clock,
  MessageSquare,
  User,
  FileText,
  Upload,
  CheckCircle2,
  Image as ImageIcon,
  ChevronRight,
  MapPin,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useParams, useRouter } from 'next/navigation';
import { useGetProviderOrderDetailQuery, useRespondProviderRevisionMutation, useSubmitProviderDeliveryMutation } from '@/store/services/apiSlice';
import { useSocketNotifications } from '@/contexts/SocketContext';

type ProviderOrder = {
  id: string;
  orderNumber: string;
  conversationId?: string | null;
  repeatIteration?: number;
  repeatOrderCount?: number;
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
  providerEarningsAmount?: number;
  packageTitle: string;
  scheduledDate: string;
  scheduledTime: string;
  serviceAddress: string;
  specialInstructions: string;
  deliveryNote: string;
  deliveryImages: string[];
  revisionRequestNote?: string;
  revisionResponseNote?: string;
  revisionRequestedAt?: string | null;
  revisionRespondedAt?: string | null;
  createdAt: string;
  requirementSubmittedAt?: string | null;
  orderStartedAt?: string | null;
  deliveryPendingAt?: string | null;
  completedAt?: string | null;
  client: {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    avatar: string;
  };
};

const statusText = (status: ProviderOrder['status']) => {
  if (status === 'accepted') return 'In Progress';
  if (status === 'accepting_delivery') return 'Accepting Delivery';
  if (status === 'revision_requested') return 'Request Revision';
  if (status === 'under_revision') return 'Under Revision';
  if (status === 'after_sell_revision_requested') return 'After-Sale Revision';
  if (status === 'under_after_sell_revision') return 'Under After-Sale Revision';
  if (status === 'done_after_sell_revision') return 'Done After-Sale Revision';
  if (status === 'completed') return 'Order Finalized';
  if (status === 'declined') return 'Declined';
  return 'Pending';
};

const fmtDate = (value?: string | null) => {
  if (!value) return 'N/A';
  return new Date(value).toLocaleString();
};

const getMessagePath = (order: ProviderOrder) =>
  order.conversationId
    ? `/messages?conversationId=${String(order.conversationId)}&orderId=${order.id}`
    : `/messages?orderId=${order.id}&user=${order.client.id}`;

export default function ProviderOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = typeof params?.id === 'string' ? params.id : '';

  const [activeTab, setActiveTab] = useState<'details' | 'requirements' | 'delivery'>('details');
  const [deliveryNote, setDeliveryNote] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [showProfile, setShowProfile] = useState(false);
  const { notifications } = useSocketNotifications();
  const lastHandledNotificationIdRef = useRef<string | null>(null);

  const { data, isLoading, refetch } = useGetProviderOrderDetailQuery(id, { skip: !id });
  const [submitDelivery, { isLoading: isDelivering }] = useSubmitProviderDeliveryMutation();
  const [respondRevision, { isLoading: isRespondingRevision }] = useRespondProviderRevisionMutation();

  const order = useMemo(() => (data?.data?.order || null) as ProviderOrder | null, [data]);
  const repeatOrderCount = Math.max(1, Number(order?.repeatOrderCount || order?.repeatIteration || 1));

  useEffect(() => {
    if (!notifications.length || !id) return;
    const latest = notifications[0] as {
      id?: string;
      data?: { notificationType?: string; orderId?: string };
    };
    if (!latest?.id || latest.id === lastHandledNotificationIdRef.current) return;

    const type = latest?.data?.notificationType;
    const notificationOrderId = String(latest?.data?.orderId || '');
    const isSameOrder = notificationOrderId === id;
    const shouldRefreshByType =
      type === 'order_revision_requested' ||
      type === 'order_after_sell_revision_requested' ||
      type === 'order_after_sell_revision_accepted' ||
      type === 'order_after_sell_revision_declined' ||
      type === 'order_after_sell_revision_completed' ||
      type === 'order_after_sell_revision_cancelled' ||
      type === 'order_revision_cancelled' ||
      type === 'order_finalized' ||
      type === 'order_accepted' ||
      type === 'order_created';

    if (isSameOrder || shouldRefreshByType) {
      lastHandledNotificationIdRef.current = latest.id;
      refetch();
    }
  }, [notifications, id, refetch]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const uploaded = Array.from(e.target.files).slice(0, 4);
      setFiles(uploaded);
      toast.success('Files attached to delivery.');
    }
  };

  const handleDeliver = async () => {
    if (!order || !['accepted', 'under_revision', 'accepting_delivery', 'under_after_sell_revision'].includes(order.status)) return;
    const noteToSubmit =
      order.status === 'under_revision' || order.status === 'under_after_sell_revision'
        ? (order.deliveryNote || '').trim()
        : deliveryNote.trim();
    if (!noteToSubmit) {
      toast.error('Please provide a delivery note.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('deliveryNote', noteToSubmit);
      files.forEach((file) => formData.append('deliveryImages', file));
      await submitDelivery({ id: order.id, formData }).unwrap();
      toast.success(
        order.status === 'under_revision'
          ? 'Revision submitted. Waiting for client review.'
          : order.status === 'under_after_sell_revision'
            ? 'After-sale revision completed.'
            : 'Work delivered! Waiting for client review.'
      );
      setFiles([]);
      setDeliveryNote('');
      await refetch();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to submit delivery.');
    }
  };

  const handleRevisionResponse = async (action: 'accept' | 'decline') => {
    if (!order || !['revision_requested', 'after_sell_revision_requested'].includes(order.status)) return;
    try {
      await respondRevision({ id: order.id, action }).unwrap();
      toast.success(
        action === 'accept'
          ? 'Revision request accepted.'
          : order.status === 'after_sell_revision_requested'
            ? 'After-sale revision declined.'
            : 'Revision request declined.'
      );
      await refetch();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to respond to revision.');
    }
  };

  if (isLoading || !order) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] py-12">
        <div className="mx-auto max-w-5xl px-4">
          <div className="rounded-[2rem] bg-white p-12 text-center text-slate-500 font-bold">Loading order details...</div>
        </div>
      </div>
    );
  }

  const timeline = [
    { status: 'Order Created', time: fmtDate(order.createdAt), completed: true },
    { status: 'Requirement Submitted', time: fmtDate(order.requirementSubmittedAt || order.createdAt), completed: true },
    { status: 'Order Started', time: fmtDate(order.orderStartedAt), completed: Boolean(order.orderStartedAt) },
    { status: 'Delivery Pending', time: fmtDate(order.deliveryPendingAt), completed: Boolean(order.deliveryPendingAt) },
    { status: 'Revision Requested', time: fmtDate(order.revisionRequestedAt), completed: Boolean(order.revisionRequestedAt) },
    { status: 'Revision Responded', time: fmtDate(order.revisionRespondedAt), completed: Boolean(order.revisionRespondedAt) },
  ];
  const isDeliveryEditable = order.status === 'accepted';

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <Link href="/provider/orders" className="inline-flex items-center text-sm font-bold text-slate-400 hover:text-[#2286BE] transition-colors group">
            <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Orders
          </Link>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="h-11 rounded-xl border-slate-200 text-slate-600 hover:text-[#2286BE] hover:border-[#2286BE] bg-white transition-all shadow-sm"
              onClick={() => router.push(getMessagePath(order))}
            >
              <MessageSquare size={18} className="mr-2" /> Messenger
            </Button>
            <Button
              variant="outline"
              className="h-11 rounded-xl border-slate-200 text-slate-600 hover:text-[#2286BE] hover:border-[#2286BE] bg-white transition-all shadow-sm"
              onClick={() => setShowProfile(true)}
            >
              <User size={18} className="mr-2" /> Client Profile
            </Button>
          </div>
        </div>

        <Card className="border-none shadow-xl shadow-slate-200/40 bg-white rounded-[2.5rem] mb-10 overflow-hidden">
          <div className="p-8 md:p-12 border-b border-slate-50 flex flex-col md:flex-row justify-between gap-8">
            <div className="flex gap-6">
              <div className="h-20 w-20 bg-[#2286BE]/10 rounded-[2rem] flex items-center justify-center text-[#2286BE] shrink-0">
                <FileText size={32} />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Badge className="bg-slate-900 border-none px-3 py-1 font-black text-[10px] uppercase tracking-widest">{order.orderNumber}</Badge>
                  <Badge className={`px-3 py-1 font-black text-[10px] uppercase border-none tracking-widest ${order.status === 'completed' ? 'bg-green-50 text-green-600' : 'bg-[#2286BE]/10 text-[#2286BE]'}`}>
                    {statusText(order.status)}
                  </Badge>
                </div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">{order.orderName}</h1>
                <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-3">
                  Category: {order.categoryName || 'General'}
                </p>
                {repeatOrderCount > 1 ? (
                  <Badge className="bg-[#2286BE]/10 text-[#2286BE] border-none px-3 py-1 font-black text-[10px] uppercase tracking-widest">
                    Ordered {repeatOrderCount} Times
                  </Badge>
                ) : null}
                <div className="flex items-center gap-4 text-sm font-bold text-slate-400">
                  <div className="flex items-center gap-1.5"><Calendar size={14} /> {new Date(order.scheduledDate).toLocaleDateString()}</div>
                  <div className="flex items-center gap-1.5"><Clock size={14} /> {order.scheduledTime}</div>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-3xl p-6 md:px-10 flex flex-col justify-center items-center md:items-end">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Your Earnings</p>
              <div className="text-4xl font-black text-slate-900 tracking-tighter">${Number(order.providerEarningsAmount || order.packagePrice || 0).toFixed(2)}</div>
            </div>
          </div>

          <div className="px-12 flex gap-10">
            {['details', 'requirements', 'delivery'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as 'details' | 'requirements' | 'delivery')}
                className={`py-6 font-black text-[11px] uppercase tracking-[0.2em] transition-all relative ${activeTab === tab ? 'text-[#2286BE]' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {tab}
                {activeTab === tab && <motion.div layoutId="orderTab" className="absolute bottom-0 left-0 right-0 h-1 bg-[#2286BE] rounded-t-full" />}
              </button>
            ))}
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-10">
            <AnimatePresence mode="wait">
              {activeTab === 'details' && (
                <motion.div key="details" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-8">
                  <Card className="border-none shadow-sm bg-white rounded-[2rem] p-10">
                    <h3 className="text-xl font-black text-slate-900 mb-8 tracking-tight">Project Timeline</h3>
                    <div className="space-y-8 relative">
                      <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-slate-100" />
                      {timeline.map((item, i) => (
                        <div key={i} className="flex gap-6 relative z-10">
                          <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 border-4 border-white shadow-sm ${item.completed ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                            {item.completed && <CheckCircle2 size={10} />}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <p className={`font-black text-sm tracking-tight ${item.completed ? 'text-slate-900' : 'text-slate-400'}`}>{item.status}</p>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.time}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              )}

              {activeTab === 'requirements' && (
                <motion.div key="reqs" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                  <Card className="border-none shadow-sm bg-white rounded-[2.5rem] p-12">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="h-12 w-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 shrink-0">
                        <FileText size={24} />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Client Requirements</h3>
                        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Submitted from booking page</p>
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded-3xl p-8 text-slate-700 font-medium leading-relaxed italic border-l-4 border-amber-400">
                      &quot;{order.specialInstructions || 'No special instructions provided.'}&quot;
                    </div>
                  </Card>
                </motion.div>
              )}

              {activeTab === 'delivery' && (
                <motion.div key="delivery" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-8">
                  <Card className="border-none shadow-xl shadow-slate-200/40 bg-white rounded-[2.5rem] p-10 overflow-hidden relative">
                    <div className="relative z-10">
                      <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Submit Your Work</h3>
                      <p className="text-slate-500 font-medium mb-10">Deliver your finished service and provide instructions for the client.</p>

                      <div className="space-y-8">
                        <div className="space-y-3">
                          <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">Delivery Note</label>
                          <textarea
                            className="w-full h-48 rounded-[2rem] bg-slate-50 border-none p-8 text-slate-700 font-medium focus:ring-2 focus:ring-[#2286BE] transition-all"
                            placeholder="Explain the work you've done..."
                            value={isDeliveryEditable ? deliveryNote : (order.deliveryNote || '')}
                            onChange={(e) => setDeliveryNote(e.target.value)}
                            disabled={!isDeliveryEditable}
                          />
                        </div>

                        {['revision_requested', 'after_sell_revision_requested'].includes(order.status) && (
                          <div className="rounded-3xl border border-orange-100 bg-orange-50 p-6">
                            <p className="text-[10px] font-black uppercase tracking-widest text-orange-500 mb-2">Revision Note From Client</p>
                            <p className="text-sm font-semibold text-orange-900">
                              {order.revisionRequestNote || 'Client requested revision.'}
                            </p>
                          </div>
                        )}

                        <div className="space-y-4">
                          <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">Project Files & Proof</label>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {(isDeliveryEditable ? files.map((f) => f.name) : (order.deliveryImages || [])).slice(0, 4).map((name, i) => (
                              <div key={i} className="aspect-square bg-slate-50 rounded-3xl border-2 border-dashed border-slate-100 flex flex-col items-center justify-center p-4 text-center">
                                <ImageIcon size={24} className="text-slate-300 mb-2" />
                                <p className="text-[10px] font-bold text-slate-400 truncate w-full">{typeof name === 'string' ? name : 'image'}</p>
                              </div>
                            ))}
                            {isDeliveryEditable && (
                              <label className="aspect-square bg-[#2286BE]/5 hover:bg-[#2286BE]/10 rounded-3xl border-2 border-dashed border-[#2286BE]/20 flex flex-col items-center justify-center p-6 text-center group cursor-pointer transition-all active:scale-95">
                                <Upload size={24} className="text-[#2286BE] mb-2 group-hover:scale-110 transition-transform" />
                                <p className="text-[10px] font-black text-[#2286BE] uppercase tracking-[0.1em]">Upload</p>
                                <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileUpload} />
                              </label>
                            )}
                          </div>
                        </div>

                        <div className="pt-6 border-t border-slate-50">
                          {['revision_requested', 'after_sell_revision_requested'].includes(order.status) ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
                              <Button
                                onClick={() => handleRevisionResponse('decline')}
                                disabled={isRespondingRevision}
                                variant="outline"
                                className="h-14 rounded-2xl font-black uppercase tracking-widest text-[11px] border-red-100 text-red-600"
                              >
                                {isRespondingRevision ? 'Processing...' : 'Decline Revision'}
                              </Button>
                              <Button
                                onClick={() => handleRevisionResponse('accept')}
                                disabled={isRespondingRevision}
                                className="h-14 rounded-2xl font-black uppercase tracking-widest text-[11px] bg-[#2286BE] hover:bg-[#1b6da0] text-white"
                              >
                                {isRespondingRevision ? 'Processing...' : 'Accept Revision'}
                              </Button>
                            </div>
                          ) : null}
                          <Button
                            onClick={handleDeliver}
                            disabled={isDelivering || !['accepted', 'under_revision', 'accepting_delivery', 'under_after_sell_revision'].includes(order.status)}
                            className="w-full h-16 rounded-2xl bg-[#2286BE] hover:bg-[#1b6da0] text-white font-black text-lg shadow-xl shadow-[#2286BE]/20 transition-all flex items-center justify-center gap-3"
                          >
                            {order.status === 'completed'
                              ? 'Order Finalized'
                              : order.status === 'under_revision' || order.status === 'under_after_sell_revision'
                                ? isDelivering
                                  ? 'Submitting...'
                                  : order.status === 'under_after_sell_revision'
                                    ? 'Done After Sell Revision'
                                    : 'Submit Revision'
                              : ['revision_requested', 'after_sell_revision_requested'].includes(order.status)
                                ? 'Respond to revision request first'
                              : isDelivering
                                  ? 'Submitting...'
                                  : 'Submit Delivery'}
                            <ChevronRight size={20} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-10">
            <Card className="border-none shadow-sm bg-white rounded-[2.5rem] p-10 text-center relative overflow-hidden">
              <div className="relative z-10">
                <Avatar className="h-24 w-24 border-4 border-white shadow-xl ring-2 ring-slate-100 mx-auto mb-6">
                  {order.client.avatar ? <AvatarImage src={order.client.avatar} /> : null}
                  <AvatarFallback className="text-slate-500 bg-slate-100">
                    <User size={28} />
                  </AvatarFallback>
                </Avatar>
                <h3 className="text-2xl font-black text-slate-900 mb-1">{order.client.name || 'Client'}</h3>
                <div className="flex items-center justify-center gap-2 mb-8 text-xs font-bold text-slate-400">
                  <MapPin size={12} /> {order.client.address || order.serviceAddress || 'N/A'}
                </div>
                <Link href={getMessagePath(order)} className="block">
                  <Button variant="outline" className="w-full h-14 rounded-2xl border-slate-200 text-slate-700 hover:bg-[#2286BE]/5 hover:text-[#2286BE] hover:border-[#2286BE]/20 font-black transition-all">
                    Contact Client
                  </Button>
                </Link>
              </div>
            </Card>

            <Card className="border-none shadow-sm bg-white rounded-[2.5rem] p-10">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Order Information</h4>
              <div className="space-y-5">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-slate-400">Package</span>
                  <span className="font-black text-slate-900">{order.packageTitle || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-slate-400">Scheduled</span>
                  <span className="font-black text-slate-900">{new Date(order.scheduledDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-slate-400">Time</span>
                  <span className="font-black text-slate-700">{order.scheduledTime}</span>
                </div>
                <div className="pt-5 border-t border-slate-50 flex justify-between items-center">
                  <span className="font-bold text-slate-900">Total Earnings</span>
                  <span className="text-2xl font-black text-[#2286BE]">${Number(order.providerEarningsAmount || order.packagePrice || 0).toFixed(2)}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {showProfile && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center gap-3">
              <Avatar className="h-12 w-12 border border-slate-100">
                {order.client.avatar ? <AvatarImage src={order.client.avatar} /> : null}
                <AvatarFallback className="bg-slate-100 text-slate-500">
                  <User size={16} />
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-black text-slate-900">{order.client.name || 'Client'}</h3>
                <p className="text-xs font-semibold text-slate-500">Client Profile</p>
              </div>
            </div>
            <div className="space-y-2 rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-700">
              <p>Name: {order.client.name || 'N/A'}</p>
              <p>Phone: {order.client.phone || 'N/A'}</p>
              <p>Email: {order.client.email || 'N/A'}</p>
              <p>Location: {order.client.address || order.serviceAddress || 'N/A'}</p>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" className="rounded-xl border-slate-200" onClick={() => setShowProfile(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
