'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Star, Heart, Trash2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatRating } from '@/lib/formatters';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useGetSavedServicesQuery, useRemoveSavedServiceMutation } from '@/store/services/apiSlice';

type SavedService = {
  id: string;
  title: string;
  categoryName?: string;
  images?: string[];
  baseCity?: string;
  startingPrice?: number;
  provider?: {
    id?: string;
    name?: string;
    avatar?: string;
    rating?: number;
    level?: string;
    sellerLevel?: string;
  };
};

export default function SavedServicesPage() {
  const { updateProfile } = useAuth();
  const { data, isLoading } = useGetSavedServicesQuery();
  const [removeSavedService, { isLoading: isRemoving }] = useRemoveSavedServiceMutation();
  const [removingId, setRemovingId] = React.useState<string | null>(null);

  const savedServices = React.useMemo(
    () => ((data?.data?.items || []) as SavedService[]).filter(Boolean),
    [data]
  );

  const handleRemove = async (id: string) => {
    try {
      setRemovingId(id);
      const response = await removeSavedService(id).unwrap();
      const nextUser = response?.data?.user as { savedServiceIds?: string[] } | undefined;
      if (nextUser) {
        updateProfile({
          savedServiceIds: Array.isArray(nextUser.savedServiceIds) ? nextUser.savedServiceIds : [],
        });
      }
      toast.success('Service removed from saved list.');
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to remove saved service.');
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Saved Services</h1>
            <p className="text-slate-500 font-medium">All the gigs you saved with the love icon will appear here.</p>
          </motion.div>
          <div className="flex items-center gap-3">
            <Badge className="bg-[#2286BE]/10 text-[#2286BE] border-none font-black text-xs uppercase tracking-widest px-4 py-2 rounded-xl">
              {savedServices.length} Saved
            </Badge>
          </div>
        </div>

        {isLoading ? (
          <div className="bg-white p-20 rounded-[3rem] border border-slate-100 text-center shadow-2xl shadow-slate-200/50 text-slate-500 font-bold">
            Loading saved services...
          </div>
        ) : savedServices.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-20 rounded-[3rem] border border-slate-100 text-center shadow-2xl shadow-slate-200/50"
          >
            <div className="mx-auto w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-10 text-red-500">
              <Heart size={48} />
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-4">No Saved Services Yet</h2>
            <p className="text-slate-500 mb-10 max-w-md mx-auto font-medium text-lg leading-relaxed">
              Browse services and click the love icon to save them here.
            </p>
            <Link href="/services">
              <Button className="bg-[#2286BE] hover:bg-[#1b6da0] px-10 h-16 text-lg font-black rounded-2xl shadow-xl shadow-[#2286BE]/20">
                Explore Marketplace
              </Button>
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence>
              {savedServices.map((service, idx) => (
                <motion.div
                  key={service.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, x: -20 }}
                  transition={{ delay: idx * 0.08 }}
                  className="group bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden hover:shadow-2xl hover:shadow-[#2286BE]/10 transition-all duration-500 flex flex-col h-full"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                    <Link href={`/services/${service.id}`} className="block h-full w-full">
                      <Image
                        src={service.images?.[0] || 'https://images.unsplash.com/photo-1581578731548-c64695ce6958?q=80&w=1200&h=675&auto=format&fit=crop'}
                        alt={service.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    </Link>
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-white/95 backdrop-blur-md text-slate-900 border-none font-black text-[10px] uppercase px-3 py-1 shadow-sm">
                        ${Number(service.startingPrice || 0).toFixed(2)}
                      </Badge>
                    </div>
                    <button
                      onClick={() => handleRemove(service.id)}
                      disabled={isRemoving && removingId === service.id}
                      className="absolute top-4 right-4 min-w-10 h-10 px-3 bg-white/95 backdrop-blur-md rounded-xl text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm flex items-center justify-center gap-2"
                    >
                      <Trash2 size={18} />
                      {isRemoving && removingId === service.id ? (
                        <span className="text-[9px] font-black uppercase tracking-widest">Removing</span>
                      ) : null}
                    </button>
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/60 to-transparent p-6 pt-10">
                      <Link href={`/provider/${service.provider?.id || ''}`} className="flex items-center gap-2 w-fit hover:opacity-90 transition-opacity">
                        <Avatar className="h-8 w-8 border-2 border-white/20">
                          <AvatarImage src={service.provider?.avatar} />
                          <AvatarFallback className="bg-[#2286BE] text-white text-[10px] font-black">PRO</AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-black text-white">{service.provider?.name || 'Provider'}</span>
                        <ShieldCheck size={14} className="text-[#2286BE]" />
                      </Link>
                    </div>
                  </div>

                  <div className="p-8 flex flex-col flex-1">
                    <Link href={`/services/${service.id}`} className="block">
                      <h3 className="font-black text-slate-900 group-hover:text-[#2286BE] transition-colors line-clamp-2 leading-snug text-xl mb-4">
                        {service.title}
                      </h3>
                    </Link>

                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
                      {service.categoryName || 'General'}
                    </p>

                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-1.5">
                        <Star size={18} className="text-amber-400 fill-amber-400" />
                        <span className="font-black text-slate-900">{formatRating(Number(service.provider?.rating) || 0)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-full">
                        <MapPin size={12} className="text-[#2286BE]" /> {service.baseCity || 'Location unavailable'}
                      </div>
                    </div>

                    <Link href={`/services/${service.id}`} className="mt-auto">
                      <Button className="w-full h-12 rounded-xl bg-[#2286BE] hover:bg-[#1b6da0] text-white font-black transition-all shadow-lg shadow-[#2286BE]/10">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
