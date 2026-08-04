'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronRight, Heart, MapPin, Search, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DEFAULT_CATEGORIES, getIconByName } from '@/data/categories';
import AuthModal from '@/components/ui/AuthModal';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useGetCategoriesQuery, useGetPublicServicesQuery, useRemoveSavedServiceMutation, useSaveServiceMutation } from '@/store/services/apiSlice';
import { formatRating } from '@/lib/formatters';

type ApiCategory = {
  name?: string;
  slug?: string;
  iconName?: string;
  description?: string;
  color?: string;
  bgGradient?: string;
  count?: number;
};

type CategoryService = {
  id: string;
  title: string;
  categoryName: string;
  categorySlug: string;
  image: string;
  avgPackagePrice: number;
  baseCity?: string;
  provider?: {
    id: string;
    name: string;
    avatar: string;
    rating?: number;
    level?: string;
    sellerLevel?: string;
  };
};

export default function CategoryClient({ slug }: { slug: string }) {
  const router = useRouter();
  const { user, isAuthenticated, updateProfile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [activeFavoriteId, setActiveFavoriteId] = useState<string | null>(null);
  const [saveService, { isLoading: isSavingService }] = useSaveServiceMutation();
  const [removeSavedService, { isLoading: isRemovingSavedService }] = useRemoveSavedServiceMutation();
  const { data: categoriesPayload, isFetching: isCategoriesLoading } = useGetCategoriesQuery();
  const { data: servicesPayload, isFetching: isServicesLoading } = useGetPublicServicesQuery({
    page: 1,
    limit: 100,
    radiusKm: 25,
    requireCoverage: false,
    categorySlug: slug,
    search: searchQuery,
    lat: null,
    lng: null,
  });

  const approvedCategories = Array.isArray(categoriesPayload?.data) ? (categoriesPayload.data as ApiCategory[]) : [];
  const apiCategory = approvedCategories.find((item) => item.slug === slug);
  const fallbackCategory = DEFAULT_CATEGORIES.find((item) => item.slug === slug);
  const category = apiCategory
      ? {
          name: apiCategory.name || slug,
          slug: apiCategory.slug || slug,
          iconName: apiCategory.iconName || 'ShieldCheck',
          description: apiCategory.description || `Explore ${apiCategory.name || slug} services from verified professionals.`,
          color: apiCategory.color || 'text-slate-600',
          bgGradient: apiCategory.bgGradient || 'from-slate-100 to-white',
        }
      : fallbackCategory
        ? {
            name: fallbackCategory.name,
            slug: fallbackCategory.slug,
            iconName: fallbackCategory.iconName,
            description: `Explore ${fallbackCategory.name} services from verified professionals.`,
            color: fallbackCategory.color,
            bgGradient: 'from-slate-100 to-white',
          }
      : null;

  const services = useMemo(
    () => ((servicesPayload?.data?.items || []) as CategoryService[]).filter(Boolean),
    [servicesPayload?.data?.items]
  );

  const handleToggleFavorite = async (serviceId: string) => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }

    const isSaved = Array.isArray(user?.savedServiceIds) && user.savedServiceIds.includes(String(serviceId));
    try {
      setActiveFavoriteId(String(serviceId));
      const response = isSaved
        ? await removeSavedService(String(serviceId)).unwrap()
        : await saveService(String(serviceId)).unwrap();
      const nextUser = response?.data?.user as { savedServiceIds?: string[] } | undefined;
      if (nextUser) {
        updateProfile({
          savedServiceIds: Array.isArray(nextUser.savedServiceIds) ? nextUser.savedServiceIds : [],
        });
      }
      toast.success(isSaved ? 'Service removed from saved list.' : 'Service saved successfully.');
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to update saved services.');
    } finally {
      setActiveFavoriteId(null);
    }
  };

  if (isCategoriesLoading && !category) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[#2286BE]/20 border-t-[#2286BE]" />
          <p className="text-slate-500 font-medium">Loading category...</p>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-black text-slate-900 mb-4">Category Not Found</h1>
          <p className="text-slate-500 mb-8 font-medium">The category you&apos;re looking for doesn&apos;t exist.</p>
          <Link href="/categories">
            <Button className="bg-[#2286BE] hover:bg-[#1b6da0] font-black rounded-2xl h-14 px-10">
              Browse All Categories
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-b ${category.bgGradient} py-16`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 mb-10 text-sm font-bold text-slate-400">
          <Link href="/categories" className="hover:text-[#2286BE] transition-colors flex items-center gap-1.5">
            <ArrowLeft size={16} /> All Categories
          </Link>
          <span aria-hidden="true"><ChevronRight size={14} /></span>
          <span className="text-slate-700">{category.name}</span>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="mb-14">
          <div className="flex flex-col md:flex-row md:items-center gap-8">
            <div className={`h-24 w-24 shrink-0 rounded-[2rem] bg-white shadow-xl shadow-slate-200/50 flex items-center justify-center ${category.color} border border-slate-100`}>
              {getIconByName(category.iconName, { size: 36 })}
            </div>
            <div className="flex-1">
              <span className="bg-[#2286BE]/10 text-[#2286BE] text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full">
                {services.length} Open Gigs
              </span>
              <h1 className="mt-4 text-4xl md:text-5xl font-black text-slate-900 tracking-tight">{category.name} Services</h1>
              <p className="text-slate-500 text-lg font-medium max-w-2xl mt-3">{category.description}</p>
            </div>
          </div>
        </motion.div>

        <div className="mb-10 rounded-[2rem] border border-slate-100 bg-white p-5 shadow-xl shadow-slate-200/30">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={`Search ${category.name} gigs...`}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-sm font-bold text-slate-800 outline-none transition focus:border-[#2286BE] focus:ring-2 focus:ring-[#2286BE]/10"
            />
          </div>
        </div>

        {isServicesLoading ? (
          <div className="bg-white rounded-[2rem] border border-slate-100 p-20 text-center text-slate-500 font-bold">
            Loading gigs...
          </div>
        ) : services.length === 0 ? (
          <div className="bg-white rounded-[2rem] border border-slate-100 p-20 text-center">
            <h3 className="text-2xl font-black text-slate-900 mb-2">No gigs found</h3>
            <p className="text-slate-500 font-medium">No published gigs are available in this category right now.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {services.map((service, index) => {
              const providerLevel = service.provider?.level || service.provider?.sellerLevel || 'New';
              const isSaved = Array.isArray(user?.savedServiceIds) && user.savedServiceIds.includes(String(service.id));
              const isUpdatingFavorite =
                activeFavoriteId === String(service.id) && (isSavingService || isRemovingSavedService);
              return (
                <motion.div key={service.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                  <Link href={`/services/${service.id}`} className="group block h-full">
                    <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden hover:shadow-2xl hover:shadow-[#2286BE]/10 transition-all duration-300 h-full flex flex-col">
                      <div className="relative w-full aspect-[4/3] overflow-hidden bg-slate-100">
                        {service.image ? (
                          <Image src={service.image} alt={service.title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-slate-400">Service</div>
                        )}
                        <div className="absolute top-4 left-4">
                          <Badge className="bg-white/95 backdrop-blur-md text-slate-900 border-none font-black text-[10px] uppercase px-3 py-1 shadow-sm">
                            ${Number(service.avgPackagePrice || 0).toFixed(2)}
                          </Badge>
                        </div>
                        <button
                          type="button"
                          onClick={async (event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            await handleToggleFavorite(service.id);
                          }}
                          disabled={isUpdatingFavorite}
                          className={`absolute right-4 top-4 flex min-w-10 h-10 items-center justify-center rounded-xl bg-white/95 backdrop-blur-md transition px-3 gap-2 ${
                            isSaved
                              ? 'text-red-500'
                              : 'text-slate-400 hover:text-red-500'
                          }`}
                          aria-label="Toggle saved service"
                        >
                          <Heart
                            size={18}
                            fill={isSaved ? 'currentColor' : 'none'}
                          />
                          {isUpdatingFavorite ? (
                            <span className="text-[9px] font-black uppercase tracking-widest">
                              {isSaved ? 'Removing' : 'Saving'}
                            </span>
                          ) : null}
                        </button>
                      </div>

                      <div className="p-6 flex flex-col flex-1">
                        <div className="flex items-center gap-2 mb-4">
                          <Avatar className="h-6 w-6 border border-slate-100 shadow-sm">
                            <AvatarImage src={service.provider?.avatar} />
                            <AvatarFallback className="bg-[#2286BE]/10 text-[#2286BE] text-[8px] font-black">PRO</AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-black text-slate-900 tracking-tight">{service.provider?.name || 'Provider'}</span>
                          <span className="ml-auto text-[9px] font-black uppercase rounded-md bg-slate-100 px-2 py-1 text-slate-500">
                            {providerLevel}
                          </span>
                        </div>

                        <h3 className="font-black text-slate-900 group-hover:text-[#2286BE] transition-colors line-clamp-2 leading-snug text-lg mb-4">
                          {service.title}
                        </h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">{service.categoryName}</p>

                        <div className="mt-auto pt-5 border-t border-slate-50 flex items-end justify-between">
                          <div className="flex items-center gap-1.5">
                            <Star size={16} className="text-amber-400 fill-amber-400" />
                            <span className="font-black text-slate-900 text-sm">
                              {formatRating(Number(service.provider?.rating) || 0)}
                            </span>
                          </div>
                          <div className="flex items-center text-[10px] font-black text-[#2286BE] uppercase tracking-widest bg-[#2286BE]/5 px-3 py-1.5 rounded-full">
                            <MapPin size={10} className="mr-1" />
                            {service.baseCity || 'Location'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        title="Love this Service?"
        subtitle="Sign in to save your favorite services."
      />
    </div>
  );
}
