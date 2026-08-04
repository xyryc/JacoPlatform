'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Clock3, DollarSign, User, CheckCircle2, XCircle, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAcceptServiceRequestMutation, useGetProviderServiceRequestsQuery, useIgnoreServiceRequestMutation, useRespondToAdminServiceRequestInvitationMutation } from '@/store/services/apiSlice';
import { useSocketNotifications } from '@/contexts/SocketContext';
import { formatMilesFromKm } from '@/lib/distance';
import { toast } from 'sonner';

type ProviderServiceRequest = {
  id: string;
  requestNumber: string;
  categoryName: string;
  serviceAddress: string;
  description: string;
  preferredDate?: string | null;
  preferredTime: string;
  budget: number;
  status: 'open' | 'accepted' | 'cancelled';
  distanceKm?: number | null;
  client: {
    id: string;
    name: string;
    avatar: string;
    email: string;
    phone: string;
    address: string;
  };
  imageUrls?: string[];
  adminRequestedForViewer?: boolean;
  adminInvitationStatus?: string;
  assignedToOtherProvider?: boolean;
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.97, y: 10 },
  visible: { opacity: 1, scale: 1, y: 0 },
};

export default function ProviderRequestsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [actingRequestId, setActingRequestId] = useState<string | null>(null);
  const { notifications } = useSocketNotifications();
  const lastHandledNotificationIdRef = useRef<string | null>(null);

  const { data, isLoading, isFetching, refetch } = useGetProviderServiceRequestsQuery(
    { page, limit: 6, search, radiusKm: 30 },
    {
      refetchOnFocus: true,
      refetchOnReconnect: true,
      pollingInterval: 15000,
    }
  );
  const [acceptRequest, { isLoading: isAccepting }] = useAcceptServiceRequestMutation();
  const [ignoreRequest, { isLoading: isIgnoring }] = useIgnoreServiceRequestMutation();
  const [respondToAdminInvitation, { isLoading: isRespondingAdminInvitation }] = useRespondToAdminServiceRequestInvitationMutation();

  const requests = useMemo(
    () => ((data?.data?.items || []) as ProviderServiceRequest[]).filter(Boolean),
    [data]
  );
  const pagination = data?.data?.pagination;

  useEffect(() => {
    if (!notifications.length) return;
    const latest = notifications[0] as { id?: string; data?: { notificationType?: string } };
    if (!latest?.id || latest.id === lastHandledNotificationIdRef.current) return;

    const type = latest?.data?.notificationType;
      if (
      type === 'service_request_created' ||
      type === 'service_request_accepted' ||
      type === 'service_request_ignored' ||
      type === 'admin_service_request_invitation' ||
      type === 'admin_service_request_unavailable' ||
      type === 'service_request_negotiation_started_provider'
    ) {
      lastHandledNotificationIdRef.current = latest.id;
      refetch();
    }
  }, [notifications, refetch]);

  const handleAccept = async (request: ProviderServiceRequest) => {
    try {
      setActingRequestId(request.id);
      if (request.adminRequestedForViewer) {
        const payload = await respondToAdminInvitation({ id: request.id, action: 'accept' }).unwrap();
        const conversationId = payload.data?.conversationId;
        toast.success('Negotiation started with the client.');
        if (conversationId) {
          window.location.href = `/messages?conversationId=${conversationId}`;
          return;
        }
      } else {
        await acceptRequest(request.id).unwrap();
        toast.success('Request accepted. The client has been notified.');
      }
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to accept request.');
    } finally {
      setActingRequestId(null);
    }
  };

  const handleIgnore = async (request: ProviderServiceRequest) => {
    try {
      setActingRequestId(request.id);
      if (request.adminRequestedForViewer) {
        await respondToAdminInvitation({ id: request.id, action: 'decline' }).unwrap();
        toast.info('Admin request declined.');
      } else {
        await ignoreRequest(request.id).unwrap();
        toast.info('Request removed from your inbox.');
      }
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to ignore request.');
    } finally {
      setActingRequestId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12 pb-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight text-center md:text-left">Requested Orders</h1>
            <p className="text-slate-500 mt-2 text-lg text-center md:text-left">
              Nearby service requests within {formatMilesFromKm(30)} of your service area.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-80">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search requests..."
                className="pl-10 h-12 w-full bg-white border-slate-200 focus:ring-primary/20"
                value={search}
                onChange={(e) => {
                  setPage(1);
                  setSearch(e.target.value);
                }}
              />
            </div>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-[2rem] bg-white p-16 text-center text-slate-500 font-bold shadow-sm"
            >
              Loading nearby requests...
            </motion.div>
          ) : requests.length > 0 ? (
            <motion.div
              key={`${search}-${page}`}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {requests.map((request) => (
                <motion.div key={request.id} variants={itemVariants} className="h-full">
                  <Card className="border-none shadow-sm hover:shadow-xl hover:shadow-[#2286BE]/10 transition-all duration-500 rounded-[2.5rem] bg-white h-full flex flex-col overflow-hidden border border-slate-50">
                    <div className="p-8 border-b border-slate-50 flex justify-between items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">{request.requestNumber || 'Service Request'}</p>
                        <h3 className="font-black text-xl text-slate-900 leading-tight mt-2">
                          {request.categoryName || 'Service Request'}
                        </h3>
                        <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 mt-2">
                          Request from nearby client
                        </p>
                      </div>
                      <Badge className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border-none ${request.assignedToOtherProvider ? 'bg-slate-100 text-slate-500' : request.adminRequestedForViewer ? 'bg-indigo-50 text-indigo-600' : 'bg-blue-50 text-blue-600'}`}>
                        {request.assignedToOtherProvider ? 'Taken' : request.adminRequestedForViewer ? 'Admin Request' : 'Open'}
                      </Badge>
                    </div>

                    <CardContent className="p-8 flex-1 flex flex-col">
                      <div className="flex items-start gap-4 mb-6">
                        <Avatar className="h-12 w-12 border-2 border-white shadow-sm ring-1 ring-slate-100">
                          {request.client.avatar ? <AvatarImage src={request.client.avatar} alt={request.client.name} /> : null}
                          <AvatarFallback className="bg-slate-100 text-slate-500">
                            <User size={16} />
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-black text-slate-900 text-sm tracking-tight truncate">{request.client.name || 'Client'}</p>
                          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest truncate">{request.client.address || request.serviceAddress}</p>
                        </div>
                      </div>

                      <div className="space-y-3 text-slate-500">
                        <div className="flex items-start gap-3">
                          <MapPin size={16} className="mt-0.5 text-slate-300 flex-shrink-0" />
                          <p className="text-sm font-bold text-slate-500">{request.serviceAddress || 'Location unavailable'}</p>
                        </div>
                        <div className="flex items-center gap-3 text-slate-500">
                          <Clock3 size={16} className="text-slate-300 flex-shrink-0" />
                          <p className="text-sm font-bold text-slate-500">
                            {request.preferredDate ? new Date(request.preferredDate).toLocaleDateString() : 'Any date'} • {request.preferredTime}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 text-slate-500">
                          <DollarSign size={16} className="text-slate-300 flex-shrink-0" />
                          <p className="text-sm font-bold text-slate-500">${Number(request.budget || 0).toFixed(2)} budget</p>
                        </div>
                        <p className="pt-2 text-sm font-medium text-slate-500 line-clamp-3">{request.description}</p>
                        {request.assignedToOtherProvider ? (
                          <p className="text-[11px] font-black uppercase tracking-widest text-amber-600">
                            Already accepted by another provider
                          </p>
                        ) : typeof request.distanceKm === 'number' ? (
                          <p className="text-[11px] font-black uppercase tracking-widest text-[#2286BE]">
                            {formatMilesFromKm(request.distanceKm)} away
                          </p>
                        ) : null}
                      </div>

                      <div className="mt-auto pt-6 border-t border-slate-50 flex flex-col gap-3">
                        <div className="grid grid-cols-2 gap-3">
                          <Button
                            variant="outline"
                            className="h-14 font-black uppercase tracking-widest text-[11px] border-slate-100 text-slate-500 hover:bg-slate-50 rounded-2xl transition-all"
                            onClick={() => handleIgnore(request)}
                            disabled={(isIgnoring || isRespondingAdminInvitation) && actingRequestId === request.id}
                          >
                            <XCircle size={18} className="mr-2" />
                            {(isIgnoring || isRespondingAdminInvitation) && actingRequestId === request.id ? (request.adminRequestedForViewer ? 'Declining...' : 'Ignoring...') : request.adminRequestedForViewer ? 'Decline' : 'Ignore'}
                          </Button>
                          <Button
                            className="h-14 font-black uppercase tracking-widest text-[11px] bg-[#2286BE] hover:bg-[#1b6da0] text-white shadow-xl shadow-[#2286BE]/20 rounded-2xl transition-all"
                            onClick={() => handleAccept(request)}
                            disabled={request.assignedToOtherProvider || ((isAccepting || isRespondingAdminInvitation) && actingRequestId === request.id)}
                          >
                            <CheckCircle2 size={18} className="mr-2" />
                            {(isAccepting || isRespondingAdminInvitation) && actingRequestId === request.id ? 'Accepting...' : request.adminRequestedForViewer ? 'Negotiate' : 'Accept'}
                          </Button>
                        </div>
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
                <Package size={48} />
              </div>
              <h3 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">No nearby requests</h3>
              <p className="text-slate-400 font-bold max-w-xs text-center leading-relaxed">
                New requests will appear here when clients post work near your location.
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
    </div>
  );
}
