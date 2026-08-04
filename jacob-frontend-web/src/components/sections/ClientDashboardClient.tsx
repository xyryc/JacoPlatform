'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from '@/contexts/LocationContext';
import { useSocketNotifications } from '@/contexts/SocketContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle2, MapPin, Bell, Star } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BRAND } from '@/lib/constants';
import { formatMilesFromKm } from '@/lib/distance';
import { formatRating } from '@/lib/formatters';
import {
  useGetClientDashboardQuery,
  useGetPublicServicesQuery,
} from '@/store/services/apiSlice';

type RecentOrderCard = {
  id?: string;
  orderNumber?: string;
  orderName?: string;
  categoryName?: string;
  statusLabel?: string;
  amount?: number;
  provider?: {
    id?: string;
    name?: string;
    avatar?: string;
  };
  scheduledLabel?: string;
  scheduledTime?: string;
  location?: string;
  paymentStatus?: string;
};

type NearbyServiceCard = {
  id: string;
  title: string;
  categorySlug: string;
  categoryName: string;
  image: string;
  avgPackagePrice: number;
  distanceKm: number | null;
  provider: {
    id: string;
    name: string;
    avatar: string;
    rating: number;
  };
};

type StaticServiceMeta = {
  expertType: 'Solo' | 'Team' | 'Agency';
  sellerLevel: 'Top Rated' | 'Level 3' | 'Level 2' | 'Level 1' | 'New';
};

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

const EXPERT_TYPES: StaticServiceMeta['expertType'][] = ['Solo', 'Team', 'Agency'];
const SELLER_LEVELS: StaticServiceMeta['sellerLevel'][] = ['Top Rated', 'Level 3', 'Level 2', 'Level 1', 'New'];

const getStaticMetaById = (id: string): StaticServiceMeta => {
  const value = Array.from(id).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return {
    expertType: EXPERT_TYPES[value % EXPERT_TYPES.length],
    sellerLevel: SELLER_LEVELS[value % SELLER_LEVELS.length],
  };
};

const formatMoney = (value: number) => {
  if (!Number.isFinite(value)) return '0';
  return Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 });
};

const formatRecentTime = (scheduledDate?: string, scheduledTime?: string) => {
  if (!scheduledDate && !scheduledTime) return '';
  if (!scheduledDate) return scheduledTime || '';
  const date = new Date(scheduledDate);
  if (Number.isNaN(date.getTime())) return scheduledTime || scheduledDate;
  const formattedDate = date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  return scheduledTime ? `${formattedDate}, ${scheduledTime}` : formattedDate;
};

const buildNearbyServiceCards = (items: unknown[]): NearbyServiceCard[] => {
  return (Array.isArray(items) ? items : [])
    .map((item) => {
      const service = item as Record<string, unknown>;
      return {
        id: String(service.id || service._id || ''),
        title: String(service.title || 'Service'),
        categorySlug: String(service.categorySlug || ''),
        categoryName: String(service.categoryName || 'Category'),
        image: String(service.image || ''),
        avgPackagePrice: Number(service.avgPackagePrice || 0),
        distanceKm: typeof service.distanceKm === 'number' ? service.distanceKm : null,
        provider: {
          id: String((service.provider as Record<string, unknown>)?.id || ''),
          name: String((service.provider as Record<string, unknown>)?.name || 'Provider'),
          avatar: String((service.provider as Record<string, unknown>)?.avatar || ''),
          rating: Number((service.provider as Record<string, unknown>)?.rating || 0),
        },
      };
    })
    .filter((item) => Boolean(item.id))
    .slice(0, 3);
};

export default function ClientDashboardClient() {
  const { user } = useAuth();
  const { coordinates } = useLocation();
  const { notifications } = useSocketNotifications();
  const latestNotification = notifications[0];
  const refetchMarkerRef = useRef<string>('');

  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() ||
    user?.name ||
    'Member';
  const firstName = displayName.split(' ')[0] || 'Member';
  const lat = typeof user?.locationLat === 'number' ? user.locationLat : coordinates?.lat ?? null;
  const lng = typeof user?.locationLng === 'number' ? user.locationLng : coordinates?.lng ?? null;

  const {
    data: dashboardResponse,
    isLoading: isDashboardLoading,
    refetch: refetchDashboard,
  } = useGetClientDashboardQuery();
  const {
    data: servicesResponse,
    isLoading: isServicesLoading,
    refetch: refetchNearbyServices,
  } = useGetPublicServicesQuery({
    page: 1,
    limit: 3,
    radiusKm: 25,
    categorySlug: 'all',
    search: '',
    lat,
    lng,
  });

  const dashboard = dashboardResponse?.data;
  const activeOrders = Number(dashboard?.orders?.activeOrders || 0);
  const pendingOrders = Number(dashboard?.orders?.pendingOrders || 0);
  const inProgressOrders = Number(dashboard?.orders?.inProgressOrders || 0);
  const underReviewOrders = Number(dashboard?.orders?.underReviewOrders || 0);
  const completedOrders = Number(dashboard?.orders?.completedOrders || 0);
  const completionRate = Number(dashboard?.orders?.completionRate || 0);
  const inboxCount = Number(dashboard?.inbox?.unreadMessages || 0);
  const savedServicesCount = Array.isArray(user?.savedServiceIds) ? user.savedServiceIds.length : 0;

  const recentOrders = (Array.isArray(dashboard?.recentOrders) ? dashboard.recentOrders : []) as RecentOrderCard[];
  const nearbyServices = useMemo(
    () => buildNearbyServiceCards((servicesResponse?.data?.items || []) as unknown[]),
    [servicesResponse]
  );

  const activeNote =
    pendingOrders > 0
      ? `${pendingOrders} waiting confirmation`
      : underReviewOrders > 0
        ? `${underReviewOrders} under review`
        : inProgressOrders > 0
          ? `${inProgressOrders} in progress`
          : 'No active updates';

  useEffect(() => {
    if (!latestNotification) return;
    if (refetchMarkerRef.current === latestNotification.id) return;
    refetchMarkerRef.current = latestNotification.id;
    refetchDashboard();
    refetchNearbyServices();
  }, [latestNotification, refetchDashboard, refetchNearbyServices]);

  return (
    <div className="min-h-screen bg-slate-50/50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6"
        >
           <div>
             <h1 className="text-4xl font-black text-slate-900 tracking-tight">Welcome back, {firstName} 👋</h1>
             <p className="text-slate-500 mt-2 text-lg">Manage your ongoing services and explore new opportunities on {BRAND.name}.</p>
           </div>
           <div className="flex gap-4">
             <Link href="/services">
                <Button className="bg-[#2286BE] hover:bg-[#1b6da0] px-6 h-12 font-bold shadow-lg shadow-[#2286BE]/20 rounded-xl transition-all">Find a Service</Button>
             </Link>
             <Link href="/post-request">
                <Button variant="outline" className="border-slate-200 text-slate-600 hover:text-[#2286BE] hover:border-[#2286BE] bg-white h-12 px-6 font-bold rounded-xl shadow-sm transition-all">Post Request</Button>
             </Link>
           </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
        >
           <motion.div variants={item}>
             <Link href="/client/orders?status=active" className="block">
               <Card className="border-none shadow-md shadow-slate-200/50 bg-white group hover:scale-[1.02] transition-transform duration-300">
                 <CardHeader className="py-5 pb-2">
                   <CardTitle className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Active Orders</CardTitle>
                 </CardHeader>
                 <CardContent className="pb-6">
                   <div className="text-4xl font-black text-slate-900">{isDashboardLoading ? '0' : activeOrders}</div>
                   <div className="flex items-center text-xs text-amber-500 font-bold mt-2 bg-amber-50 w-fit px-2 py-1 rounded-full">
                      <Clock size={12} className="mr-1" /> {activeNote}
                   </div>
                 </CardContent>
               </Card>
             </Link>
           </motion.div>

           <motion.div variants={item}>
             <Link href="/client/orders?status=completed" className="block">
               <Card className="border-none shadow-md shadow-slate-200/50 bg-white group hover:scale-[1.02] transition-transform duration-300">
                 <CardHeader className="py-5 pb-2">
                   <CardTitle className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Completed</CardTitle>
                 </CardHeader>
                 <CardContent className="pb-6">
                   <div className="text-4xl font-black text-slate-900">{isDashboardLoading ? '0' : completedOrders}</div>
                   <div className="flex items-center text-xs text-[#2286BE] font-bold mt-2 bg-[#2286BE]/5 w-fit px-2 py-1 rounded-full">
                      <CheckCircle2 size={12} className="mr-1" /> {completionRate.toFixed(1)}% completion rate
                   </div>
                 </CardContent>
               </Card>
             </Link>
           </motion.div>

           <motion.div variants={item}>
             <Card className="border-none shadow-md shadow-slate-200/50 bg-white group hover:scale-[1.02] transition-transform duration-300">
               <CardHeader className="py-5 pb-2">
                 <CardTitle className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Saved Services</CardTitle>
               </CardHeader>
               <CardContent className="pb-6">
                  <div className="text-4xl font-black text-slate-900">{savedServicesCount}</div>
                 <p className="text-xs text-[#2286BE] font-bold mt-2 hover:underline cursor-pointer"><Link href="/client/saved-services">View Favorites →</Link></p>
               </CardContent>
             </Card>
           </motion.div>

           <motion.div variants={item}>
             <Link href="/messages" className="block">
               <Card
                 className={`border-none group hover:scale-[1.02] transition-transform duration-300 ${
                   inboxCount > 0
                     ? 'shadow-lg shadow-[#2286BE]/10 bg-gradient-to-br from-[#2286BE] to-[#1b6da0] text-white'
                     : 'bg-white text-slate-900 shadow-md shadow-slate-200/50'
                 }`}
               >
                 <CardHeader className="py-5 pb-2">
                   <CardTitle
                     className={`text-[12px] font-bold uppercase tracking-widest flex items-center ${
                       inboxCount > 0 ? 'text-blue-100' : 'text-slate-400'
                     }`}
                   >
                      <Bell size={14} className={`mr-2 ${inboxCount > 0 ? 'animate-bounce' : 'text-[#2286BE]'}`} /> Inbox
                 </CardTitle>
               </CardHeader>
               <CardContent className="pb-6">
                 <div className="text-4xl font-black">{isDashboardLoading || isServicesLoading ? '0' : inboxCount}</div>
                 <p className={`text-xs font-medium mt-2 ${inboxCount > 0 ? 'text-blue-100' : 'text-slate-500'}`}>New messages from providers</p>
               </CardContent>
             </Card>
             </Link>
           </motion.div>
        </motion.div>

        {/* Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

           {/* Left: Recent Orders */}
           <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.4 }}
             className="lg:col-span-2"
           >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Recent Orders</h2>
                <Link href="/client/orders" className="text-[13px] font-bold text-[#2286BE] hover:underline bg-[#2286BE]/5 px-3 py-1.5 rounded-full transition-all uppercase tracking-wider">All History</Link>
              </div>

              <div className="space-y-4">
                  {recentOrders.length > 0 ? (
                    recentOrders.map((order, idx) => {
                      const isLatest = idx === 0;
                      const providerName = order.provider?.name || 'Provider';
                      const providerAvatar = order.provider?.avatar || '';
                      const href = order.orderNumber ? `/client/orders/${order.orderNumber}` : `/client/orders/${order.id || ''}`;
                      return (
                        <motion.div
                          key={order.id || order.orderNumber || idx}
                          whileHover={{ x: 8 }}
                          className="p-1 px-1"
                        >
                          <Link href={href}>
                          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60 flex flex-col sm:flex-row gap-6 group hover:shadow-md hover:border-[#2286BE]/30 transition-all duration-300 cursor-pointer">
                             <div className={`w-16 h-16 rounded-2xl flex-shrink-0 flex items-center justify-center ${isLatest ? 'bg-amber-50 text-amber-500' : 'bg-[#2286BE]/5 text-[#2286BE]'}`}>
                                {isLatest ? <Clock size={28} /> : <CheckCircle2 size={28} />}
                             </div>
                             <div className="flex-1">
                                <div className="flex flex-col sm:flex-row sm:justify-between items-start mb-3">
                                   <div>
                                      <h3 className="font-bold text-slate-900 text-lg group-hover:text-[#2286BE] transition-colors">{order.orderName || 'Service order'}</h3>
                                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mt-1">
                                        Category: {order.categoryName || 'General'}
                                      </p>
                                      <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs font-bold text-slate-400">#{order.orderNumber || order.id}</span>
                                        <Badge variant="secondary" className={`text-[10px] font-bold uppercase border-none px-2 rounded-md ${isLatest ? 'bg-amber-100 text-amber-700' : 'bg-[#2286BE]/5 text-[#2286BE]'}`}>
                                          {order.statusLabel || 'Pending'}
                                        </Badge>
                                      </div>
                                   </div>
                                   <div className="mt-3 sm:mt-0 text-right">
                                      <p className="font-black text-xl text-slate-900 leading-none">${formatMoney(Number(order.amount || 0))}</p>
                                      <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tight">
                                        {String(order.paymentStatus || '').toLowerCase() === 'paid' ? 'Paid via Stripe' : 'Payment pending'}
                                      </p>
                                   </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-5 text-sm pt-4 border-t border-slate-50">
                                   <div className="flex items-center gap-2">
                                      <Avatar className="h-7 w-7 border-2 border-white ring-2 ring-slate-50">
                                        {providerAvatar ? <AvatarImage src={providerAvatar} /> : null}
                                        <AvatarFallback className="bg-slate-100 text-[10px] font-bold">
                                          {(providerName || 'U')
                                            .split(' ')
                                            .filter(Boolean)
                                            .map((part) => part[0])
                                            .slice(0, 2)
                                            .join('')
                                            .toUpperCase() || 'U'}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="font-bold text-slate-700">{providerName}</span>
                                   </div>
                                   <div className="flex items-center text-slate-500 font-medium">
                                      <Clock size={14} className="mr-1.5" />
                                      {formatRecentTime(order.scheduledLabel, order.scheduledTime)}
                                   </div>
                                </div>
                             </div>
                          </div>
                          </Link>
                        </motion.div>
                      );
                    })
                  ) : (
                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200/60 text-slate-500 font-medium">
                      No recent orders yet.
                    </div>
                  )}
              </div>
           </motion.div>

           {/* Right: Recommendations */}
           <motion.div
             initial={{ opacity: 0, x: 20 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ delay: 0.5 }}
           >
              <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-6 flex items-center">
                <MapPin size={22} className="mr-2 text-[#2286BE]" /> Near Your Location
              </h2>
              <div className="space-y-4">
                 {nearbyServices.length > 0 ? nearbyServices.map((svc) => {
                   return (
                     <Link href={`/services/${svc.id}`} key={svc.id}>
                     <motion.div
                      whileHover={{ scale: 1.03 }}
                      className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/80 flex gap-4 group cursor-pointer hover:border-[#2286BE]/50 transition-all duration-300"
                     >
                        <div className="h-16 w-16 bg-slate-100 rounded-xl flex-shrink-0 overflow-hidden relative shadow-inner">
                           {svc.image ? (
                             <Image src={svc.image} alt="Service thumbnail" fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                           ) : null}
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <h4 className="font-bold text-slate-800 text-sm line-clamp-1 group-hover:text-[#2286BE] transition-colors">{svc.title}</h4>
                          <div className="flex items-center mt-1.5">
                             <Star size={12} className="text-amber-400 fill-amber-400 mr-1" />
                             <span className="text-[12px] font-bold text-slate-700">{formatRating(Number(svc.provider.rating || 0))}</span>
                          </div>
                          <div className="flex items-center justify-between mt-1">
                             <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tight flex items-center">
                                <MapPin size={10} className="mr-1" /> {typeof svc.distanceKm === 'number' ? `${formatMilesFromKm(svc.distanceKm)} away` : 'Distance unavailable'}
                             </p>
                             <p className="text-xs font-black text-slate-900">${formatMoney(svc.avgPackagePrice)}</p>
                          </div>
                        </div>
                     </motion.div>
                     </Link>
                   );
                 }) : (
                   <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 text-slate-500 font-medium">
                     No nearby services found.
                   </div>
                 )}

                 <Link href="/services" className="w-full block">
                   <Button variant="ghost" className="w-full text-[#2286BE] font-bold text-sm hover:bg-[#2286BE]/5 rounded-xl h-11 py-0 transition-colors">
                      Discover More Services
                   </Button>
                 </Link>
              </div>
           </motion.div>

        </div>
      </div>
    </div>
  );
}
