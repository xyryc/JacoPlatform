'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, MoreHorizontal, Star, TrendingUp, Clock, Sparkles, ShieldCheck, AlertTriangle, Play } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  useDeleteGigMutation,
  useDeleteGigRequestMutation,
  useLazyGetMyGigsQuery,
  useLazyGetGigAnalyticsQuery,
  useGetPublicProviderProfileQuery,
} from '@/store/services/apiSlice';
import { formatDeliveryTime } from '@/lib/deliveryTime';
import { calculateAdminFeeAmount } from '@/lib/pricing';

type GigPackage = {
  name: string;
  title: string;
  description: string;
  deliveryTime: string;
  deliveryTimeUnit?: string;
  price: number;
};

type MyGig = {
  _id: string;
  title: string;
  categoryName: string;
  categorySlug: string;
  expertType?: 'solo' | 'team';
  images?: string[];
  videos?: string[];
  packages?: GigPackage[];
  status: 'draft' | 'pending_approval' | 'published' | 'rejected';
  baseCity?: string;
  travelRadiusKm?: number | null;
  description?: string;
  createdAt?: string;
  approvedAt?: string;
};

type PendingRequest = {
  _id: string;
  title: string;
  categoryName: string;
  customCategoryName?: string;
  gigRef?: string | { _id?: string } | null;
  status: string;
  expertType?: 'solo' | 'team';
  images?: string[];
  videos?: string[];
  packages?: GigPackage[];
  baseCity?: string;
  travelRadiusKm?: number | null;
  description?: string;
  createdAt?: string;
};

type DeleteTarget = {
  id: string;
  type: 'gig' | 'request';
  title: string;
};

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

const kmToMiles = (km?: number | null) => {
  const numericKm = Number(km || 0);
  return (numericKm * 0.621371).toFixed(1);
};

const formatMoney = (value?: number | null) => `$${Number(value || 0).toFixed(2)}`;

const formatCompactMoney = (value?: number | null) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(Number(value || 0));

export default function ProviderGigsPage() {
  const PAGE_SIZE = 9;
  const { role, user } = useAuth();
  const [activeTab, setActiveTab] = useState('published');
  const [page, setPage] = useState(1);
  const [publishedGigs, setPublishedGigs] = useState<MyGig[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [analyticsGig, setAnalyticsGig] = useState<{ id: string; title: string } | null>(null);
  const [getMyGigs] = useLazyGetMyGigsQuery();
  const [getGigAnalytics, { data: gigAnalyticsData, isFetching: isGigAnalyticsFetching }] = useLazyGetGigAnalyticsQuery();
  const [deleteGig] = useDeleteGigMutation();
  const [deleteGigRequest] = useDeleteGigRequestMutation();
  const { data: providerProfileData } = useGetPublicProviderProfileQuery(user?.id || '', {
    skip: role !== 'provider' || !user?.id,
  });

  const loadMyGigs = useCallback(async () => {
    try {
      const payload = await getMyGigs().unwrap();
      if (payload?.success) {
        setPublishedGigs(
          Array.isArray(payload?.data?.publishedGigs) ? (payload.data.publishedGigs as MyGig[]) : []
        );
        setPendingRequests(
          Array.isArray(payload?.data?.pendingRequests) ? (payload.data.pendingRequests as PendingRequest[]) : []
        );
      }
    } catch {
      // keep empty state
    } finally {
      setLoading(false);
    }
  }, [getMyGigs]);

  useEffect(() => {
    void loadMyGigs();
  }, [loadMyGigs]);

  const pendingGigRefSet = useMemo(() => {
    return new Set(
      pendingRequests
        .filter((request) => request.status === 'pending_approval')
        .map((request) => {
          if (!request.gigRef) return null;
          if (typeof request.gigRef === 'string') return request.gigRef;
          if (typeof request.gigRef === 'object' && request.gigRef._id) return String(request.gigRef._id);
          return String(request.gigRef);
        })
        .filter((gigRef): gigRef is string => Boolean(gigRef)),
    );
  }, [pendingRequests]);

  const visiblePublishedGigs = useMemo(() => {
    return publishedGigs.filter((gig) => gig.status === 'published' && !pendingGigRefSet.has(String(gig._id)));
  }, [pendingGigRefSet, publishedGigs]);

  const activeItems = useMemo(() => {
    if (activeTab === 'published') return visiblePublishedGigs;
    if (activeTab === 'pending') return pendingRequests.filter((gig) => gig.status === 'pending_approval');
    return publishedGigs.filter((gig) => gig.status === 'rejected' || gig.status === 'draft');
  }, [activeTab, pendingRequests, publishedGigs, visiblePublishedGigs]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(activeItems.length / PAGE_SIZE)), [activeItems.length]);

  const paginatedItems = useMemo(() => {
    const startIndex = (page - 1) * PAGE_SIZE;
    return activeItems.slice(startIndex, startIndex + PAGE_SIZE);
  }, [activeItems, page]);

  const providerRating = useMemo(() => {
    const rating = Number(providerProfileData?.data?.provider?.rating ?? user?.averageRating ?? 0);
    return Number.isFinite(rating) ? rating : 0;
  }, [providerProfileData?.data?.provider?.rating, user?.averageRating]);

  const tabCounts = {
    published: visiblePublishedGigs.length,
    pending: pendingRequests.filter((gig) => gig.status === 'pending_approval').length,
    rejected: publishedGigs.filter((gig) => gig.status === 'rejected' || gig.status === 'draft').length,
  };

  useEffect(() => {
    setPage(1);
  }, [activeTab]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      if (deleteTarget.type === 'request') {
        await deleteGigRequest(deleteTarget.id).unwrap();
      } else {
        await deleteGig(deleteTarget.id).unwrap();
      }

      await loadMyGigs();
      setDeleteTarget(null);
    } catch (error) {
      console.error('Failed to delete gig:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenAnalytics = async (gigId: string, title: string) => {
    setAnalyticsGig({ id: gigId, title });
    void getGigAnalytics(gigId);
  };

  const activeAnalyticsData =
    gigAnalyticsData?.data?.gig?.id && gigAnalyticsData.data.gig.id === analyticsGig?.id
      ? gigAnalyticsData.data
      : null;
  const analyticsSummary = activeAnalyticsData?.summary;
  const analyticsSeries = Array.isArray(activeAnalyticsData?.detailViewSeries)
    ? activeAnalyticsData.detailViewSeries.map((item) => ({
        date: item.date || '',
        label: item.label || '',
        earnings: Number(item.earnings || 0),
      }))
    : [];
  const analyticsTrendSummary = useMemo(() => {
    if (!analyticsSeries.length) {
      return {
        averageDailyIncome: 0,
        bestDayIncome: 0,
        bestDayLabel: '',
        activeIncomeDays: 0,
      };
    }

    const totalIncome = analyticsSeries.reduce((sum, item) => sum + Number(item.earnings || 0), 0);
    const bestDay = analyticsSeries.reduce(
      (top, item) => (Number(item.earnings || 0) > Number(top.earnings || 0) ? item : top),
      analyticsSeries[0]
    );

    return {
      averageDailyIncome: totalIncome / analyticsSeries.length,
      bestDayIncome: Number(bestDay?.earnings || 0),
      bestDayLabel: bestDay?.label || '',
      activeIncomeDays: analyticsSeries.filter((item) => Number(item.earnings || 0) > 0).length,
    };
  }, [analyticsSeries]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6"
        >
          <div>
            <p className="text-sm font-black uppercase tracking-[0.3em] text-[#2286BE] mb-2">My Gig</p>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Manage Your Gigs</h1>
            <p className="text-slate-500 mt-2 text-lg">View published gigs and track anything waiting for admin review.</p>
          </div>
          {role === 'provider' ? (
            <Link href="/provider/gigs/create">
              <Button className="bg-[#2286BE] hover:bg-[#059669] font-bold h-12 px-8 rounded-xl shadow-lg shadow-[#2286BE]/20 group">
                <Plus size={20} className="mr-2 group-hover:rotate-90 transition-transform duration-300" /> Create New Gig
              </Button>
            </Link>
          ) : null}
        </motion.div>

        <div className="bg-white p-1 rounded-2xl shadow-sm border border-slate-200 mb-8 w-full md:inline-flex md:w-auto">
          <Tabs defaultValue="published" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="grid h-auto w-full grid-cols-3 gap-1 bg-transparent md:flex md:h-12 md:w-auto md:justify-start">
              <TabsTrigger value="published" className="min-w-0 rounded-xl px-2 py-2.5 text-[11px] font-bold transition-all data-[state=active]:bg-[#2286BE] data-[state=active]:text-white data-[state=active]:shadow-md sm:text-sm md:px-8">
                <span className="truncate">Published</span> <span className="ml-1 shrink-0 rounded-full bg-black/10 px-1.5 py-0.5 text-[10px] opacity-70">{tabCounts.published}</span>
              </TabsTrigger>
              <TabsTrigger value="pending" className="min-w-0 rounded-xl px-2 py-2.5 text-[11px] font-bold transition-all data-[state=active]:bg-[#2286BE] data-[state=active]:text-white data-[state=active]:shadow-md sm:text-sm md:px-8">
                <span className="truncate">Review</span> <span className="ml-1 shrink-0 rounded-full bg-black/10 px-1.5 py-0.5 text-[10px] opacity-70">{tabCounts.pending}</span>
              </TabsTrigger>
              <TabsTrigger value="other" className="min-w-0 rounded-xl px-2 py-2.5 text-[11px] font-bold transition-all data-[state=active]:bg-[#2286BE] data-[state=active]:text-white data-[state=active]:shadow-md sm:text-sm md:px-8">
                <span className="truncate">Other</span> <span className="ml-1 shrink-0 rounded-full bg-black/10 px-1.5 py-0.5 text-[10px] opacity-70">{tabCounts.rejected}</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {loading ? (
          <div className="rounded-[2rem] bg-white border border-slate-200 p-10 text-slate-500 font-medium">Loading your gigs...</div>
        ) : null}

        <AnimatePresence mode="wait">
          {!loading ? (
            <motion.div key={activeTab} variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {paginatedItems.map((gig) => {
                const cover = gig.images?.[0] || '';
                const thumbnailVideo = !cover && Array.isArray(gig.videos) ? gig.videos[0] : '';
                const fallbackCover = 'https://images.unsplash.com/photo-1581578731548-c64695cc6954?q=80&w=800&auto=format&fit=crop';
                const isPending = gig.status === 'pending_approval';
                return (
                  <motion.div key={gig._id} variants={itemVariants}>
                    <Card className="overflow-hidden border-slate-200 hover:shadow-2xl transition-all duration-500 group flex flex-col h-full rounded-2xl">
                      <div className="relative aspect-[16/10] overflow-hidden">
                        {cover ? (
                          <Image src={cover} alt={gig.title} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                        ) : thumbnailVideo ? (
                          <>
                            <video
                              src={thumbnailVideo}
                              muted
                              playsInline
                              preload="metadata"
                              className="h-full w-full bg-black object-cover"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 text-white">
                              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-[#2286BE] shadow-lg">
                                <Play size={22} fill="currentColor" className="ml-0.5" />
                              </div>
                            </div>
                          </>
                        ) : (
                          <Image src={fallbackCover} alt={gig.title} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="absolute top-4 left-4">
                          <Badge
                            className={`font-black uppercase tracking-widest text-[10px] px-3 py-1 shadow-lg ${
                              isPending ? 'bg-amber-500 text-white' : gig.status === 'published' ? 'bg-[#2286BE] text-white' : 'bg-slate-500 text-white'
                            }`}
                          >
                            {isPending ? 'Under Review' : gig.status}
                          </Badge>
                        </div>
                        <div className="absolute top-4 right-4 flex gap-2">
                          <Link href={`/provider/gigs/create?editId=${gig._id}`}>
                            <Button variant="secondary" size="icon" className="h-9 w-9 bg-white/90 backdrop-blur shadow-xl hover:bg-white active:scale-90 transition-all">
                              <Edit2 size={16} />
                            </Button>
                          </Link>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="secondary" size="icon" className="h-9 w-9 bg-white/90 backdrop-blur shadow-xl hover:bg-white active:scale-90 transition-all">
                                <MoreHorizontal size={16} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 p-2 rounded-xl">
                              <DropdownMenuItem
                                className={`cursor-pointer py-3 rounded-lg ${isPending ? 'opacity-50' : ''}`}
                                disabled={isPending}
                                onClick={() => {
                                  if (isPending) return;
                                  void handleOpenAnalytics(gig._id, gig.title);
                                }}
                              >
                                <TrendingUp size={16} className="mr-3 text-slate-400" /> View Analytics
                              </DropdownMenuItem>
                              {isPending ? (
                                <DropdownMenuItem className="cursor-pointer py-3 rounded-lg text-amber-600 focus:text-amber-600 focus:bg-amber-50">
                                  <Clock size={16} className="mr-3" /> Waiting Review
                                </DropdownMenuItem>
                              ) : null}
                              <DropdownMenuItem
                                className="cursor-pointer py-3 rounded-lg text-red-600 focus:text-red-600 focus:bg-red-50"
                                onClick={() => {
                                  setDeleteTarget({
                                    id: gig._id,
                                    type: isPending ? 'request' : 'gig',
                                    title: gig.title,
                                  });
                                }}
                              >
                                <Trash2 size={16} className="mr-3" /> Permanent Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <div className="absolute bottom-4 left-4 right-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                          <Link href={`/provider/gigs/create?editId=${gig._id}`}>
                            <Button className="w-full bg-white text-slate-900 hover:bg-slate-100 font-bold shadow-xl">Fast Edit Details</Button>
                          </Link>
                        </div>
                      </div>

                      <CardContent className="p-6 flex flex-col flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          <Badge className="bg-slate-100 text-slate-700 border-none font-black text-[9px] uppercase px-2 py-0.5 rounded-md">
                            {gig.categoryName}
                          </Badge>
                          {isPending ? (
                            <Badge className="bg-amber-100 text-amber-700 border-none font-black text-[9px] uppercase px-2 py-0.5 rounded-md">
                              Admin Review
                            </Badge>
                          ) : null}
                        </div>

                        <h3 className="font-bold text-slate-900 text-lg line-clamp-2 leading-tight mb-4 min-h-[3.5rem] group-hover:text-primary transition-colors">
                          {gig.title}
                        </h3>

                        <div className="space-y-2 text-sm text-slate-500 mb-5">
                          {gig.baseCity ? <p className="font-medium">{gig.baseCity}</p> : null}
                          <p className="font-medium">Expert type: {gig.expertType === 'team' ? 'Team' : 'Solo'}</p>
                          {gig.travelRadiusKm ? <p className="font-medium">Service radius: {kmToMiles(gig.travelRadiusKm)} miles</p> : null}
                          {gig.description ? <p className="line-clamp-2">{gig.description}</p> : null}
                        </div>

                        {Array.isArray(gig.packages) && gig.packages.length > 0 ? (
                          <div className="mb-5 flex flex-wrap gap-2">
                            {gig.packages.map((pkg) => {
                              const adminFee = calculateAdminFeeAmount(Number(pkg.price || 0));
                              return (
                                <span
                                  key={`${gig._id}-${pkg.name}`}
                                  className="rounded-full bg-amber-100 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-amber-700"
                                >
                                  {pkg.name}: {formatDeliveryTime(pkg.deliveryTime, pkg.deliveryTimeUnit)} · Admin commission ${adminFee.toFixed(2)}
                                </span>
                              );
                            })}
                          </div>
                        ) : null}

                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-1.5">
                            <div className="flex items-center bg-amber-50 px-2 py-1 rounded-lg">
                              <Star size={14} className="text-amber-500 mr-1 fill-amber-500" />
                              <span className="text-sm font-black text-amber-700">{providerRating.toFixed(1)}</span>
                            </div>
                            <span className="text-xs font-bold text-slate-400">from your profile</span>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Packages</p>
                            <p className="text-2xl font-black text-slate-900 tracking-tight">{gig.packages?.length || 0}</p>
                          </div>
                        </div>

                        <div className="mt-auto grid grid-cols-3 gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-100 group-hover:bg-primary/5 group-hover:border-primary/10 transition-colors">
                          <div className="text-center">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1">Status</p>
                            <div className="flex items-center justify-center text-slate-900 gap-1">
                              <ShieldCheck size={12} className="text-slate-400" />
                              <p className="font-extrabold text-xs">{isPending ? 'Review' : 'Live'}</p>
                            </div>
                          </div>
                          <div className="text-center border-x border-slate-200">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1">Images</p>
                            <div className="flex items-center justify-center text-slate-900 gap-1">
                              <Sparkles size={12} className="text-[#2286BE]" />
                              <p className="font-extrabold text-xs">{gig.images?.length || 0}</p>
                            </div>
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1">Radius</p>
                            <div className="flex items-center justify-center text-[#2286BE] gap-1">
                              <TrendingUp size={12} />
                              <p className="font-extrabold text-xs">{kmToMiles(gig.travelRadiusKm)}mi</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : null}
        </AnimatePresence>

        {!loading && activeItems.length > PAGE_SIZE ? (
          <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-[2rem] border border-slate-200 bg-white px-5 py-4 md:flex-row">
            <p className="text-sm font-bold text-slate-500">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        ) : null}

        {deleteTarget ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
            <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                  <AlertTriangle size={22} />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-black text-slate-900">Delete this gig permanently?</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    <span className="font-semibold text-slate-700">{deleteTarget.title}</span> will be removed permanently.
                    This action cannot be undone.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => setDeleteTarget(null)}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="rounded-xl bg-red-600 text-white hover:bg-red-700"
                  onClick={() => {
                    void handleDeleteConfirm();
                  }}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete permanently'}
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        <Dialog open={Boolean(analyticsGig)} onOpenChange={(open) => {
          if (!open) setAnalyticsGig(null);
        }}>
          <DialogContent className="top-24 max-h-[calc(100vh-7rem)] max-w-3xl translate-y-0 rounded-[2rem] border-slate-200 p-0 overflow-hidden">
            <div className="flex max-h-[calc(100vh-7rem)] flex-col bg-white">
              <DialogHeader className="shrink-0 border-b border-slate-100 px-8 py-5">
                <DialogTitle className="text-2xl font-black text-slate-900">Gig Analytics</DialogTitle>
                <DialogDescription className="text-slate-500 font-medium">
                  {analyticsGig?.title || 'Selected gig'} income for the last 30 days.
                </DialogDescription>
              </DialogHeader>

              <div className="overflow-y-auto px-8 py-5">
                <div className="grid gap-4 md:grid-cols-2 mb-5">
                  <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">
                      Last 30 Days Income
                    </p>
                    <p className="text-3xl font-black text-slate-900">
                      {isGigAnalyticsFetching ? '...' : `$${Number(analyticsSummary?.totalIncome || 0).toFixed(2)}`}
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-500">
                      Provider earnings from this gig over the last 30 days.
                    </p>
                  </div>

                  <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">
                      Paid Completed Orders
                    </p>
                    <p className="text-3xl font-black text-slate-900">
                      {isGigAnalyticsFetching ? '...' : Number(analyticsSummary?.completedPaidOrders || 0)}
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-500">
                      Orders that contributed income in this 30-day window.
                    </p>
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                  <div className="mb-4">
                    <h3 className="text-lg font-black text-slate-900">Daily Income Trend</h3>
                    <p className="text-sm font-medium text-slate-500">
                      Earnings from this gig across the last 30 days.
                    </p>
                  </div>

                  {isGigAnalyticsFetching ? (
                    <div className="h-[220px] rounded-[1.25rem] bg-slate-50 flex items-center justify-center text-slate-500 font-bold">
                      Loading analytics...
                    </div>
                  ) : analyticsSeries.length > 0 ? (
                    <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
                      <div className="mb-4 grid gap-3 md:grid-cols-3">
                        <div className="rounded-2xl bg-white px-4 py-3">
                          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                            Avg / Day
                          </p>
                          <p className="mt-2 text-xl font-black text-slate-900">
                            {formatMoney(analyticsTrendSummary.averageDailyIncome)}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-white px-4 py-3">
                          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                            Best Day
                          </p>
                          <p className="mt-2 text-xl font-black text-slate-900">
                            {formatMoney(analyticsTrendSummary.bestDayIncome)}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            {analyticsTrendSummary.bestDayLabel || 'No peak day'}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-white px-4 py-3">
                          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                            Earning Days
                          </p>
                          <p className="mt-2 text-xl font-black text-slate-900">
                            {analyticsTrendSummary.activeIncomeDays}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            Days with income recorded
                          </p>
                        </div>
                      </div>

                      <div className="h-[220px] rounded-[1.25rem] bg-white p-4">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={analyticsSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                            <defs>
                              <linearGradient id="gigIncomeFill" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#2286BE" stopOpacity={0.28} />
                                <stop offset="95%" stopColor="#2286BE" stopOpacity={0.03} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid vertical={false} stroke="#E2E8F0" strokeDasharray="3 3" />
                            <XAxis
                              dataKey="label"
                              axisLine={false}
                              tickLine={false}
                              minTickGap={24}
                              interval="preserveStartEnd"
                              tick={{ fill: '#94A3B8', fontSize: 12 }}
                            />
                            <YAxis
                              axisLine={false}
                              tickLine={false}
                              width={56}
                              tick={{ fill: '#94A3B8', fontSize: 12 }}
                              tickFormatter={(value) => formatCompactMoney(Number(value || 0))}
                            />
                            <Tooltip
                              cursor={{ stroke: '#2286BE', strokeOpacity: 0.14, strokeWidth: 1 }}
                              contentStyle={{
                                borderRadius: '16px',
                                border: '1px solid #E2E8F0',
                                boxShadow: '0 18px 40px rgba(15, 23, 42, 0.08)',
                                padding: '12px 14px',
                              }}
                              formatter={(value) => [formatMoney(Number(value || 0)), 'Income']}
                              labelFormatter={(label) => `Date: ${label}`}
                            />
                            <Area
                              type="monotone"
                              dataKey="earnings"
                              stroke="#2286BE"
                              strokeWidth={3}
                              fill="url(#gigIncomeFill)"
                              activeDot={{ r: 5, strokeWidth: 0, fill: '#2286BE' }}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  ) : (
                    <div className="h-[220px] rounded-[1.25rem] bg-slate-50 flex items-center justify-center text-slate-500 font-bold">
                      No income recorded for this gig in the last 30 days.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {!loading && activeItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-32 bg-white rounded-[2rem] border-2 border-dashed border-slate-200"
          >
            <div className="h-24 w-24 rounded-full bg-slate-50 flex items-center justify-center mb-6">
              <Plus size={48} className="text-slate-200" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">No Gigs Found</h3>
            <p className="text-slate-500 max-w-xs text-center mb-8 font-medium">
              You haven&apos;t created any services yet. Start growing your business today!
            </p>
            <Link href="/provider/gigs/create">
              <Button className="bg-[#2286BE] hover:bg-[#059669] font-black h-14 px-10 rounded-2xl shadow-xl shadow-primary/20">
                Create Your First Gig
              </Button>
            </Link>
          </motion.div>
        ) : null}
      </div>
    </div>
  );
}
