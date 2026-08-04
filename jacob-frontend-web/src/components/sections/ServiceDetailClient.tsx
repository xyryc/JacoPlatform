'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Star, ShieldCheck, CheckCircle2, ChevronRight, Play, Share2, Heart, ArrowLeftRight, MessageSquare } from 'lucide-react';
import AuthModal from '@/components/ui/AuthModal';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { BRAND } from '@/lib/constants';
import { formatDeliveryTime } from '@/lib/deliveryTime';
import { formatMilesFromKm } from '@/lib/distance';
import { formatRating } from '@/lib/formatters';
import { toast } from 'sonner';
import { Copy, Facebook, Twitter, Linkedin, X } from 'lucide-react';
import ReviewFilter from '@/components/ui/ReviewFilter';
import {
  useGetFaqsQuery,
  useRemoveSavedServiceMutation,
  useSaveServiceMutation,
  useStartProviderConversationMutation,
  useStartCustomOrderConversationMutation,
} from '@/store/services/apiSlice';

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

interface ServiceDetailClientProps {
  service: any;
}

type ReviewItem = {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  date: string;
  text: string;
};

type ApiPackage = {
  name?: string;
  title?: string;
  description?: string;
  deliveryTime?: string;
  deliveryTimeUnit?: string;
  price?: number | string;
};

type GalleryMedia = {
  type: 'image' | 'video';
  url: string;
};

const REVIEWS_PER_PAGE = 5;
const FALLBACK_GALLERY_IMAGE = 'https://images.unsplash.com/photo-1581578731548-c64695ce6958?q=80&w=1200&h=675&auto=format&fit=crop';

const normalizeGalleryMedia = (media: unknown): GalleryMedia[] => {
  if (!Array.isArray(media)) return [];
  return media
    .map((item: any) => ({
      type: item?.type === 'video' ? 'video' : item?.type === 'image' ? 'image' : '',
      url: String(item?.url || '').trim(),
    }))
    .filter((item): item is GalleryMedia => (item.type === 'image' || item.type === 'video') && Boolean(item.url));
};

const calculateDistanceKm = (fromLat: number, fromLng: number, toLat: number, toLng: number) => {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const deltaLat = toRadians(toLat - fromLat);
  const deltaLng = toRadians(toLng - fromLng);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRadians(fromLat)) * Math.cos(toRadians(toLat)) * Math.sin(deltaLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Number((earthRadiusKm * c).toFixed(1));
};

export default function ServiceDetailClient({ service }: ServiceDetailClientProps) {
  const router = useRouter();
  const { isAuthenticated, role, setRole, user, updateProfile } = useAuth();
  const { data: faqResponse } = useGetFaqsQuery();
  const [startProviderConversation, { isLoading: isContactingProvider }] = useStartProviderConversationMutation();
  const galleryMedia = React.useMemo<GalleryMedia[]>(
    () => {
      const media = normalizeGalleryMedia(service.media);
      if (media.length > 0) return media;

      const images = Array.isArray(service.images) ? service.images.filter(Boolean) : [];
      const videos = Array.isArray(service.videos) ? service.videos : [];
      const legacyMedia = [
        ...images.map((url: string) => ({ type: 'image' as const, url })),
        ...videos.map((url: string) => ({ type: 'video' as const, url })),
      ];
      return legacyMedia.length > 0 ? legacyMedia : [{ type: 'image', url: FALLBACK_GALLERY_IMAGE }];
    },
    [service.images, service.media, service.videos]
  );
  const [selectedMedia, setSelectedMedia] = React.useState<GalleryMedia | null>(galleryMedia[0] || null);
  const [saveService, { isLoading: isSavingService }] = useSaveServiceMutation();
  const [removeSavedService, { isLoading: isRemovingSavedService }] = useRemoveSavedServiceMutation();
  const [startCustomOrderConversation, { isLoading: isStartingCustomOrder }] = useStartCustomOrderConversationMutation();
  const [isAuthModalOpen, setIsAuthModalOpen] = React.useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = React.useState(false);
  const [reviewFilter, setReviewFilter] = useState(0);
  const [reviewPage, setReviewPage] = React.useState(1);
  const isFavorited =
    Array.isArray(user?.savedServiceIds) && user.savedServiceIds.includes(String(service.id));
  const isFavoriteUpdating = isSavingService || isRemovingSavedService;
  const faqItems = React.useMemo(
    () => (Array.isArray(faqResponse?.data) ? faqResponse.data : []),
    [faqResponse]
  );
  const allReviews = React.useMemo<ReviewItem[]>(() => {
    if (!Array.isArray(service.reviews)) return [];
    return service.reviews
      .filter((review: any) => Number(review?.rating) > 0 && String(review?.text || '').trim())
      .map((review: any) => ({
        id: String(review.id || ''),
        name: String(review.client?.name || 'Client'),
        avatar: String(review.client?.avatar || ''),
        rating: Number(review.rating) || 0,
        date: review.createdAt
          ? new Date(review.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })
          : 'Recent',
        text: String(review.text || '').trim(),
      }));
  }, [service.reviews]);
  const reviewCounts = React.useMemo(
    () =>
      allReviews.reduce((acc: Record<number, number>, review: ReviewItem) => {
        acc[review.rating] = (acc[review.rating] || 0) + 1;
        return acc;
      }, {} as Record<number, number>),
    [allReviews]
  );
  const filteredReviews = React.useMemo(
    () => (reviewFilter === 0 ? allReviews : allReviews.filter((review: ReviewItem) => review.rating === reviewFilter)),
    [allReviews, reviewFilter]
  );
  const totalReviewPages = Math.max(1, Math.ceil(filteredReviews.length / REVIEWS_PER_PAGE));
  const paginatedReviews = React.useMemo(() => {
    const startIndex = (reviewPage - 1) * REVIEWS_PER_PAGE;
    return filteredReviews.slice(startIndex, startIndex + REVIEWS_PER_PAGE);
  }, [filteredReviews, reviewPage]);

  React.useEffect(() => {
    if (galleryMedia.length > 0 && (!selectedMedia || !galleryMedia.some((item) => item.url === selectedMedia.url))) {
      setSelectedMedia(galleryMedia[0]);
    }
  }, [galleryMedia, selectedMedia]);

  React.useEffect(() => {
    setReviewPage(1);
  }, [reviewFilter, service.id]);

  const packageTabs = React.useMemo(() => {
    const sourcePackages = (Array.isArray(service.packages) ? service.packages : []) as ApiPackage[];
    const byName = new Map<string, ApiPackage>(
      sourcePackages
        .filter((item) => item && typeof item === 'object')
        .map((item) => [String(item.name || '').toLowerCase(), item])
    );

    return ['basic', 'standard', 'premium'].map((key) => {
      const fromApi = byName.get(key);
      const fallbackPrice =
        key === 'basic'
          ? Number(service.startingPrice) || 0
          : key === 'standard'
            ? Math.round((Number(service.startingPrice) || 0) * 1.8)
            : Math.round((Number(service.startingPrice) || 0) * 3.2);

      return {
        key,
        name: key.charAt(0).toUpperCase() + key.slice(1),
        title: String(fromApi?.title || `${key.charAt(0).toUpperCase() + key.slice(1)} package`),
        description:
          String(fromApi?.description || '') ||
          (key === 'basic'
            ? 'Standard on-site service with essentials covered.'
            : key === 'standard'
              ? 'Comprehensive service with premium materials and double duration.'
              : 'VIP priority service, team of experts, and full cleanup guarantee.'),
        deliveryTime:
          String(fromApi?.deliveryTime || '') || (key === 'basic' ? '1 Day' : key === 'standard' ? '2 Days' : '3 Days'),
        deliveryTimeUnit: fromApi?.deliveryTimeUnit || 'Days',
        price: Number(fromApi?.price) || fallbackPrice,
      };
    });
  }, [service.packages, service.startingPrice]);

  const handleBooking = () => {
    if (role === 'provider') {
      toast.error('Please switch to buying mode to place service orders.');
      return;
    }

    const clientLat = typeof user?.locationLat === 'number' ? user.locationLat : null;
    const clientLng = typeof user?.locationLng === 'number' ? user.locationLng : null;
    const serviceLat = typeof service?.location?.lat === 'number' ? service.location.lat : null;
    const serviceLng = typeof service?.location?.lng === 'number' ? service.location.lng : null;
    const travelRadius = Number(service?.travelRadius);

    if (
      isAuthenticated &&
      role === 'client' &&
      clientLat !== null &&
      clientLng !== null &&
      serviceLat !== null &&
      serviceLng !== null &&
      Number.isFinite(travelRadius) &&
      travelRadius > 0
    ) {
      const distanceKm = calculateDistanceKm(clientLat, clientLng, serviceLat, serviceLng);
      if (distanceKm > travelRadius) {
        toast.error('Client cannot place this order because the location is outside the gig radius');
        return;
      }
    }

    router.push(`/book/${service.id}`);
  };

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }

    try {
      const response = isFavorited
        ? await removeSavedService(String(service.id)).unwrap()
        : await saveService(String(service.id)).unwrap();
      const nextUser = response?.data?.user as { savedServiceIds?: string[] } | undefined;
      if (nextUser) {
        updateProfile({
          savedServiceIds: Array.isArray(nextUser.savedServiceIds) ? nextUser.savedServiceIds : [],
        });
      }
      toast.success(isFavorited ? 'Service removed from saved list.' : 'Service saved successfully.');
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to update saved services.');
    }
  };

  const handleStartCustomOrder = async () => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    if (role !== 'client') {
      toast.error('Please switch to buying mode to request a custom order.');
      return;
    }

    try {
      const response = await startCustomOrderConversation({
        providerId: String(service.provider.id || ''),
        gigId: String(service.id || ''),
      }).unwrap();
      const conversationId = String((response.data as any)?.conversation?.id || '');
      if (!conversationId) {
        throw new Error('Conversation could not be started.');
      }
      toast.success('Custom order conversation started.');
      router.push(`/messages?conversationId=${conversationId}`);
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || 'Could not start the custom order conversation.');
    }
  };

  const handleContactProfessional = async () => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    if (role !== 'client') {
      toast.error('Please switch to buying mode to contact professionals.');
      return;
    }

    try {
      const response = await startProviderConversation({
        providerId: String(service.provider.id || ''),
        gigId: String(service.id || ''),
      }).unwrap();
      const conversationId = String((response.data as any)?.conversation?.id || '');
      if (!conversationId) {
        throw new Error('Conversation could not be opened.');
      }
      router.push(`/messages?conversationId=${conversationId}`);
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || 'Could not contact this professional.');
    }
  };

  if (role === 'provider') {
    return (
      <div className="min-h-screen bg-slate-50/30 py-16">
        <div className="mx-auto max-w-2xl px-4">
          <div className="rounded-[2.5rem] border border-slate-200 bg-white p-10 text-center shadow-xl shadow-slate-200/40">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#2286BE]/10 text-[#2286BE]">
              <ArrowLeftRight size={28} />
            </div>
            <h1 className="mt-6 text-3xl font-black text-slate-900">Switch to buying mode</h1>
            <p className="mt-3 text-base font-medium leading-7 text-slate-500">
              Service browsing, contact, custom orders, and checkout are available only while you are using the buyer side.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button variant="outline" className="rounded-2xl" onClick={() => router.push('/provider/dashboard')}>
                Provider Dashboard
              </Button>
              <Button
                className="rounded-2xl bg-[#2286BE] hover:bg-[#1b6da0]"
                onClick={async () => {
                  await setRole('client');
                  toast.success('Switched to buying mode.');
                  router.push(`/services/${service.id}`);
                }}
              >
                Switch to Buying
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/30 pb-36 lg:pb-20">
      <div className="border-b border-slate-100 bg-white py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
          <Link href="/" className="hover:text-[#2286BE] transition-colors">
            Home
          </Link>
          <ChevronRight size={12} className="mx-2 text-slate-300" />
          <Link href="/services" className="hover:text-[#2286BE] transition-colors">
            Services
          </Link>
          <ChevronRight size={12} className="mx-2 text-slate-300" />
          <Link href={`/services?category=${service.category}`} className="hover:text-[#2286BE] transition-colors">
            {service.category}
          </Link>
          <ChevronRight size={12} className="mx-2 text-slate-300" />
          <span className="text-slate-900 truncate">{service.subCategory}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
        <div className="flex flex-col lg:flex-row gap-12 items-start relative mb-12">
          <div className="flex-1 w-full lg:max-w-[760px]">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-10"
            >
              <div className="flex items-center gap-3 mb-6">
                <Badge className="bg-[#2286BE]/10 text-[#2286BE] border-none font-black text-[10px] px-3 py-1 uppercase tracking-widest">
                  {service.category}
                </Badge>
                <div className="flex items-center">
                  <Star size={14} className="text-amber-400 fill-amber-400 mr-1.5" />
                  <span className="font-black text-slate-900 text-sm">{formatRating(service.provider.rating)}</span>
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-[1.05] mb-8">
                {service.title}
              </h1>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-16"
            >
              <div className="relative aspect-video w-full rounded-[2.5rem] overflow-hidden bg-slate-100 group mb-6 shadow-3xl shadow-slate-300/10 border-8 border-white">
                {selectedMedia?.type === 'video' ? (
                  <video
                    src={selectedMedia.url}
                    controls
                    playsInline
                    className="h-full w-full bg-black object-contain"
                  />
                ) : (
                  <>
                    <Image
                      src={selectedMedia?.url || FALLBACK_GALLERY_IMAGE}
                      alt={service.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-1000"
                      priority
                    />
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-all flex items-center justify-center cursor-pointer">
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="h-20 w-20 bg-white/95 backdrop-blur-md rounded-full flex items-center justify-center text-[#2286BE] shadow-2xl"
                      >
                        <Play fill="currentColor" size={32} className="ml-1.5" />
                      </motion.div>
                    </div>
                  </>
                )}
                <div className="absolute top-6 right-6 flex gap-3">
                  <button
                    onClick={handleToggleFavorite}
                    disabled={isFavoriteUpdating}
                    className={`min-w-12 h-12 px-4 bg-white/95 backdrop-blur-md rounded-2xl transition-all shadow-xl flex items-center justify-center gap-2 ${
                      isFavorited ? 'text-red-500' : 'text-slate-900 hover:text-red-500'
                    }`}
                    aria-label="Add to favorites"
                  >
                    <Heart size={20} fill={isFavorited ? 'currentColor' : 'none'} />
                    {isFavoriteUpdating ? (
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        {isFavorited ? 'Removing' : 'Saving'}
                      </span>
                    ) : null}
                  </button>
                  <button
                    onClick={() => setIsShareModalOpen(true)}
                    className="h-12 w-12 bg-white/95 backdrop-blur-md rounded-2xl text-slate-900 hover:text-[#2286BE] transition-colors shadow-xl flex items-center justify-center"
                    aria-label="Share service"
                  >
                    <Share2 size={20} />
                  </button>
                </div>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
                {galleryMedia.map((media, i: number) => (
                  <motion.div
                    key={i}
                    onClick={() => setSelectedMedia(media)}
                    whileHover={{ y: -4 }}
                    className={`relative h-20 w-32 flex-shrink-0 rounded-2xl overflow-hidden cursor-pointer border-4 transition-all ${
                      selectedMedia?.url === media.url ? 'border-[#2286BE] shadow-lg shadow-[#2286BE]/20' : 'border-white shadow-sm opacity-60 hover:opacity-100'
                    }`}
                  >
                    {media.type === 'video' ? (
                      <>
                        <video src={media.url} className="h-full w-full bg-black object-cover" muted playsInline />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/25 text-white">
                          <Play fill="currentColor" size={22} />
                        </div>
                      </>
                    ) : (
                      <Image src={media.url} alt="gallery thumbnail" fill className="object-cover" />
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <div className="mb-16">
              <Tabs defaultValue="about" className="w-full">
                <TabsList className="bg-transparent border-b border-slate-100 rounded-none w-full justify-start gap-10 p-0 h-14 mb-10">
                  <TabsTrigger value="about" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#2286BE] data-[state=active]:bg-transparent data-[state=active]:text-[#2286BE] px-0 h-14 font-black uppercase text-xs tracking-widest text-slate-400 bg-transparent flex-1 shadow-none">
                    About Service
                  </TabsTrigger>
                  <TabsTrigger value="faq" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#2286BE] data-[state=active]:bg-transparent data-[state=active]:text-[#2286BE] px-0 h-14 font-black uppercase text-xs tracking-widest text-slate-400 bg-transparent flex-1 shadow-none">
                    FAQs
                  </TabsTrigger>
                  <TabsTrigger value="reviews" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#2286BE] data-[state=active]:bg-transparent data-[state=active]:text-[#2286BE] px-0 h-14 font-black uppercase text-xs tracking-widest text-slate-400 bg-transparent flex-1 shadow-none">
                    Reviews
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="about" className="mt-0">
                  <motion.div variants={item} initial="hidden" animate="show" className="prose prose-slate max-w-none text-slate-600 leading-relaxed text-lg">
                    <p className="font-medium text-slate-500 text-xl leading-relaxed mb-10">{service.description}</p>
                    <div className="grid md:grid-cols-2 gap-6 not-prose mb-12">
                      {[
                        { title: 'Verified Expert', subtitle: 'Individually Screened', icon: <ShieldCheck className="text-[#2286BE]" size={24} /> },
                        { title: 'Materials Included', subtitle: 'Standard consumables', icon: <CheckCircle2 className="text-[#2286BE]" size={24} /> },
                        { title: 'Home Service', subtitle: 'At your doorstep', icon: <MapPin className="text-[#2286BE]" size={24} /> },
                        { title: `Within ${formatMilesFromKm(service.travelRadius || 25)}`, subtitle: 'Max Travel Radius', icon: <CheckCircle2 className="text-[#2286BE]" size={24} /> },
                      ].map((feat, idx) => (
                        <div key={idx} className="flex items-center gap-4 p-6 bg-white rounded-3xl border border-slate-100 shadow-sm">
                          <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center flex-shrink-0" aria-hidden="true">
                            {feat.icon}
                          </div>
                          <div>
                            <h3 className="font-black text-slate-900 leading-none mb-1 text-[15px]">{feat.title}</h3>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{feat.subtitle}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {service.requirements && (
                      <div className="bg-amber-50/50 border border-amber-100 rounded-3xl p-8 not-prose">
                        <h2 className="font-black text-slate-900 mb-4 flex items-center gap-2 text-xl">
                          <ShieldCheck size={20} className="text-[#1b6da0]" /> Requirements from Client
                        </h2>
                        <p className="text-slate-600 font-medium leading-relaxed">{service.requirements}</p>
                      </div>
                    )}
                  </motion.div>
                </TabsContent>

                <TabsContent value="faq">
                  {faqItems.length === 0 ? (
                    <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-2xl bg-white">
                      <ShieldCheck size={28} className="text-slate-200 mx-auto mb-3" />
                      <p className="text-slate-400 font-bold">No FAQs available right now.</p>
                    </div>
                  ) : (
                    <Accordion type="single" collapsible className="w-full space-y-4">
                      {faqItems.map((faq: any, i: number) => (
                        <AccordionItem key={faq.id || i} value={`faq-${faq.id || i}`} className="border-none bg-white rounded-3xl px-8 shadow-sm">
                          <AccordionTrigger className="text-left font-black text-slate-900 hover:no-underline py-6 text-lg">
                            {faq.question}
                          </AccordionTrigger>
                          <AccordionContent className="text-slate-500 leading-relaxed pb-8 text-base font-medium">
                            {faq.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  )}
                </TabsContent>

                <TabsContent value="reviews">
                  <div className="space-y-6">
                    <ReviewFilter selected={reviewFilter} onChange={setReviewFilter} counts={reviewCounts} total={allReviews.length} />
                    {filteredReviews.length === 0 ? (
                      <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                        <Star size={28} className="text-slate-200 mx-auto mb-3" />
                        <p className="text-slate-400 font-bold">
                          {allReviews.length === 0 ? 'No reviews for this gig yet.' : 'No reviews for this rating.'}
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-6">
                          {paginatedReviews.map((review) => (
                            <div key={review.id || `${review.name}-${review.date}`} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                              <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-4">
                                  <Avatar className="h-12 w-12 border-2 border-white shadow-md">
                                    <AvatarImage src={review.avatar} alt={review.name} />
                                    <AvatarFallback className="bg-slate-100 text-[10px] font-black">{review.name.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-black text-slate-900">{review.name}</p>
                                    <div className="flex items-center text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                      Review Posted | {review.date}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex text-amber-400 gap-0.5">
                                  {[...Array(5)].map((_, index) => (
                                    <Star key={index} fill={index < review.rating ? 'currentColor' : 'none'} size={14} />
                                  ))}
                                </div>
                              </div>
                              <p className="text-slate-600 leading-relaxed text-lg font-medium">&quot;{review.text}&quot;</p>
                            </div>
                          ))}
                        </div>
                        {filteredReviews.length > REVIEWS_PER_PAGE && (
                          <div className="flex items-center justify-center gap-3 pt-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setReviewPage((current) => Math.max(1, current - 1))}
                              disabled={reviewPage === 1}
                              className="rounded-2xl border-slate-200 px-5 font-black uppercase tracking-widest text-xs"
                            >
                              Previous
                            </Button>
                            <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                              Page {reviewPage} of {totalReviewPages}
                            </span>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setReviewPage((current) => Math.min(totalReviewPages, current + 1))}
                              disabled={reviewPage === totalReviewPages}
                              className="rounded-2xl border-slate-200 px-5 font-black uppercase tracking-widest text-xs"
                            >
                              Next
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          <div className="w-full lg:w-[420px] space-y-8 lg:sticky lg:top-24">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl shadow-slate-200/50 overflow-hidden"
            >
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="w-full grid grid-cols-3 bg-slate-50/80 h-16 p-1.5 rounded-none border-b border-slate-100">
                  <TabsTrigger value="basic" className="text-[11px] uppercase tracking-widest font-black data-[state=active]:text-[#2286BE] data-[state=active]:bg-white/80 rounded-xl transition-all duration-300 shadow-none data-[state=active]:shadow-none data-[state=active]:ring-1 data-[state=active]:ring-slate-100">
                    Basic
                  </TabsTrigger>
                  <TabsTrigger value="standard" className="text-[11px] uppercase tracking-widest font-black data-[state=active]:text-[#2286BE] data-[state=active]:bg-white/80 rounded-xl transition-all duration-300 shadow-none data-[state=active]:shadow-none data-[state=active]:ring-1 data-[state=active]:ring-slate-100">
                    Standard
                  </TabsTrigger>
                  <TabsTrigger value="premium" className="text-[11px] uppercase tracking-widest font-black data-[state=active]:text-[#2286BE] data-[state=active]:bg-white/80 rounded-xl transition-all duration-300 shadow-none data-[state=active]:shadow-none data-[state=active]:ring-1 data-[state=active]:ring-slate-100">
                    Premium
                  </TabsTrigger>
                </TabsList>

                {packageTabs.map((pkg) => (
                  <TabsContent key={pkg.key} value={pkg.key} className="m-0 p-8">
                    <div className="flex justify-between items-start mb-6">
                      <h3 className="font-black text-slate-900 text-2xl">{pkg.title}</h3>
                      <span className="text-3xl font-black text-[#2286BE] tracking-tighter">${pkg.price}</span>
                    </div>
                    <p className="text-slate-500 font-medium leading-relaxed mb-10">{pkg.description}</p>

                    <div className="space-y-4 mb-10">
                      {[
                        { label: 'Delivery Time', value: formatDeliveryTime(pkg.deliveryTime, pkg.deliveryTimeUnit) },
                        { label: 'Service Duration', value: pkg.key === 'basic' ? '1 hr' : pkg.key === 'standard' ? '3 hrs' : 'Full Day' },
                        { label: 'Team Size', value: pkg.key === 'premium' ? '2 Experts' : '1 Expert' },
                      ].map((spec, i) => (
                        <div key={i} className="flex justify-between items-center text-sm">
                          <span className="text-slate-400 font-bold uppercase tracking-wider">{spec.label}</span>
                          <span className="text-slate-900 font-black">{spec.value}</span>
                        </div>
                      ))}
                    </div>

                    <Button onClick={handleBooking} className="w-full bg-[#2286BE] hover:bg-[#1b6da0] text-white h-16 text-lg font-black rounded-2xl flex items-center justify-center shadow-xl shadow-[#2286BE]/20 mb-3 group">
                      Order Now <ChevronRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>

                    <Button
                      type="button"
                      onClick={() => void handleContactProfessional()}
                      disabled={isContactingProvider}
                      className="mb-6 h-14 w-full rounded-2xl border-2 border-slate-900 bg-slate-900 text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-slate-900/15 hover:bg-slate-800"
                    >
                      <MessageSquare size={18} className="mr-2" />
                      {isContactingProvider ? 'Opening Chat...' : 'Contact Professional'}
                    </Button>

                    <button
                      type="button"
                      onClick={handleStartCustomOrder}
                      disabled={isStartingCustomOrder}
                      className="mb-6 w-full text-center text-sm font-black text-[#2286BE] hover:text-[#1b6da0] transition-colors"
                    >
                      {isStartingCustomOrder ? 'Starting custom order...' : 'You can create your custom order'}
                    </button>

                    <div className="flex items-center justify-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                      <ShieldCheck size={14} className="text-[#2286BE]" /> Money Back Guarantee
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </motion.div>

            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
              <div className="flex items-center gap-5 mb-8">
                <Link href={`/provider/${service.provider.id}`} className="relative block">
                  <Avatar className="h-20 w-20 border-4 border-slate-50 shadow-xl">
                    <AvatarImage src={service.provider.avatar} alt={service.provider.name} />
                    <AvatarFallback className="bg-[#2286BE]/10 text-[#2286BE] font-black text-2xl">
                      {service.provider.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-[#2286BE] border-4 border-white rounded-full flex items-center justify-center text-white" aria-hidden="true">
                    <ShieldCheck size={12} />
                  </div>
                </Link>
                <div>
                  <h4 className="font-black text-slate-900 text-xl leading-none mb-1.5">
                    <Link href={`/provider/${service.provider.id}`} className="hover:text-[#2286BE] transition-colors">
                      {service.provider.name}
                    </Link>
                  </h4>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest py-0.5 border-slate-100 text-slate-400">
                      {service.provider.level || 'Level 2'}
                    </Badge>
                    <Badge
                      className={`border-none font-black text-[10px] px-2 py-0.5 rounded-full ${
                        (service.provider.type || 'Solo') === 'Agency'
                          ? 'bg-purple-100 text-purple-600'
                          : (service.provider.type || 'Solo') === 'Team'
                            ? 'bg-blue-100 text-blue-600'
                            : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {service.provider.type || 'Solo'}
                    </Badge>
                    <div className="flex items-center text-amber-400">
                      <Star fill="currentColor" size={14} />
                      <span className="text-slate-900 font-black ml-1 text-xs">{formatRating(service.provider.rating)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-slate-500 font-medium text-sm leading-relaxed mb-8">
                {service.provider.bio || `Professional service provider with over ${service.provider.completedOrders || 0}+ successful local projects on ${BRAND.name}.`}
              </p>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-slate-50 p-4 rounded-2xl text-center">
                  <div className="text-xl font-black text-slate-900 leading-none mb-1">1h</div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avg. Reply</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl text-center">
                  <div className="text-xl font-black text-slate-900 leading-none mb-1">{service.provider.completedOrders || 0}</div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Done</div>
                </div>
              </div>

              <Button
                onClick={() => void handleContactProfessional()}
                disabled={isContactingProvider}
                className="w-full h-14 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 transition-all font-black text-sm uppercase tracking-widest shadow-xl shadow-slate-900/15"
              >
                <MessageSquare size={18} className="mr-2" />
                {isContactingProvider ? 'Opening Chat...' : 'Contact Professional'}
              </Button>
            </div>
          </div>
        </div>

        <div className="lg:max-w-[760px]">
          <div className="mt-4 p-8 bg-slate-900 rounded-[2.5rem] relative overflow-hidden">
            <div className="relative z-10 flex items-center gap-6">
              <div className="h-20 w-20 bg-[#2286BE] rounded-3xl flex items-center justify-center text-white flex-shrink-0 shadow-2xl" aria-hidden="true">
                <Star size={40} fill="currentColor" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white mb-2 tracking-tight">{BRAND.name} Guarantee</h3>
                <p className="text-slate-400 font-medium text-base">
                  Your satisfaction is our top priority. If you&apos;re not happy, we&apos;ll make it right.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isShareModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsShareModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="relative bg-white w-full max-w-lg rounded-[2.5rem] p-10 shadow-3xl overflow-hidden border-8 border-white/20"
            >
              <div className="absolute top-6 right-6">
                <button onClick={() => setIsShareModalOpen(false)} className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all">
                  <X size={20} />
                </button>
              </div>

              <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Share this Service</h3>
              <p className="text-slate-500 font-medium mb-8">Spread the word about {service.provider.name}&apos;s expertise.</p>

              <div className="space-y-6">
                <div className="p-2 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                  <div className="flex-1 px-4 text-sm font-bold text-slate-400 truncate tracking-tight">
                    {typeof window !== 'undefined' ? window.location.href : 'locallyserve.com/service/001'}
                  </div>
                  <Button
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        navigator.clipboard.writeText(window.location.href);
                        toast.success('Link copied to clipboard!');
                      }
                    }}
                    className="bg-white hover:bg-slate-50 text-slate-900 border border-slate-100 h-12 px-5 rounded-xl font-black text-xs uppercase tracking-widest shadow-sm"
                  >
                    <Copy size={16} className="mr-2 text-[#2286BE]" /> Copy
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {[
                    { name: 'Facebook', icon: <Facebook size={20} />, color: 'hover:bg-blue-600 hover:text-white' },
                    { name: 'X', icon: <Twitter size={20} />, color: 'hover:bg-black hover:text-white' },
                    { name: 'LinkedIn', icon: <Linkedin size={20} />, color: 'hover:bg-blue-700 hover:text-white' },
                  ].map((social) => (
                    <button key={social.name} onClick={() => toast.success(`Sharing on ${social.name}...`)} className={`flex flex-col items-center justify-center gap-3 p-6 bg-slate-50 rounded-2xl border border-slate-100 transition-all ${social.color} group`}>
                      <div className="transition-transform group-hover:scale-110">{social.icon}</div>
                      <span className="text-[10px] font-black uppercase tracking-widest">{social.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        title="Save this Service"
        subtitle="Join LocallyServe to save your favorite services and build your dream team."
      />

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-16px_45px_rgba(15,23,42,0.12)] backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <Button
            type="button"
            onClick={() => void handleContactProfessional()}
            disabled={isContactingProvider}
            className="h-14 flex-1 rounded-2xl bg-slate-900 text-xs font-black uppercase tracking-widest text-white hover:bg-slate-800"
          >
            <MessageSquare size={17} className="mr-2" />
            {isContactingProvider ? 'Opening...' : 'Contact'}
          </Button>
          <Button
            type="button"
            onClick={handleBooking}
            className="h-14 flex-1 rounded-2xl bg-[#2286BE] text-xs font-black uppercase tracking-widest text-white hover:bg-[#1b6da0]"
          >
            Order Now
          </Button>
        </div>
      </div>
    </div>
  );
}
