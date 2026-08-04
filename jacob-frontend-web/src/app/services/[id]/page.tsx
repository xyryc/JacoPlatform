'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import ServiceDetailClient from '@/components/sections/ServiceDetailClient';
import { useAuth } from '@/contexts/AuthContext';
import { useGetPublicServiceByIdQuery, useTrackGigDetailViewMutation } from '@/store/services/apiSlice';

type ApiPackage = {
  name?: string;
  title?: string;
  description?: string;
  deliveryTime?: string;
  deliveryTimeUnit?: string;
  price?: number;
};

type ApiService = {
  id?: string;
  title?: string;
  categorySlug?: string;
  categoryName?: string;
  expertType?: 'solo' | 'team';
  description?: string;
  requirements?: string;
  images?: string[];
  videos?: string[];
  media?: Array<{
    type?: 'image' | 'video';
    url?: string;
  }>;
  baseCity?: string;
  zipCode?: string;
  locationLat?: number | null;
  locationLng?: number | null;
  travelRadiusKm?: number | null;
  avgPackagePrice?: number;
  packages?: ApiPackage[];
  reviews?: Array<{
    id?: string;
    rating?: number;
    review?: string;
    createdAt?: string | null;
    client?: {
      id?: string;
      name?: string;
      avatar?: string;
    };
  }>;
  provider?: {
    id?: string;
    name?: string;
    avatar?: string;
    bio?: string;
    rating?: number;
    type?: 'Solo' | 'Team' | 'Agency';
    level?: 'New' | 'Level 1' | 'Level 2' | 'Level 3' | 'Top Rated';
    completedOrders?: number;
  };
};

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1581578731548-c64695ce6958?q=80&w=1200&h=675&auto=format&fit=crop';

const splitMedia = (media: ApiService['media']) => {
  if (!Array.isArray(media)) return { images: [], videos: [] };
  return media.reduce(
    (acc, item) => {
      const url = String(item?.url || '').trim();
      if (!url) return acc;
      if (item.type === 'video') acc.videos.push(url);
      if (item.type === 'image') acc.images.push(url);
      return acc;
    },
    { images: [] as string[], videos: [] as string[] }
  );
};

const toServiceDetailShape = (service: ApiService, id: string) => {
  const packages = Array.isArray(service.packages) ? service.packages : [];
  const media = Array.isArray(service.media)
    ? service.media
        .map((item) => ({
          type: item?.type === 'video' ? 'video' as const : item?.type === 'image' ? 'image' as const : null,
          url: String(item?.url || '').trim(),
        }))
        .filter((item): item is { type: 'image' | 'video'; url: string } => Boolean(item.type && item.url))
    : [];
  const mediaUrls = splitMedia(media);
  const hasMedia = media.length > 0;
  const normalizedPackages = ['Basic', 'Standard', 'Premium'].map((name) => {
    const matched = packages.find((item) => String(item?.name || '').toLowerCase() === name.toLowerCase());
    return {
      name,
      title: matched?.title || `${name} package`,
      description: matched?.description || '',
      deliveryTime: matched?.deliveryTime || '',
      deliveryTimeUnit: matched?.deliveryTimeUnit || 'Days',
      price: Number(matched?.price) || 0,
    };
  });

  return {
    id: service.id || id,
    title: service.title || 'Service',
    category: service.categoryName || 'General',
    subCategory: service.categoryName || 'General',
    provider: {
      id: service.provider?.id || '',
      name: service.provider?.name || 'Provider',
      type: service.expertType === 'team' ? 'Team' : service.provider?.type || 'Solo',
      avatar: service.provider?.avatar || '',
      bio: service.provider?.bio || '',
      level: service.provider?.level || 'Level 2',
      rating: Number(service.provider?.rating) || 0,
      completedOrders: Number(service.provider?.completedOrders) || 0,
    },
    location: {
      city: service.baseCity || 'Location unavailable',
      lat: typeof service.locationLat === 'number' ? service.locationLat : null,
      lng: typeof service.locationLng === 'number' ? service.locationLng : null,
    },
    zipCode: service.zipCode || '',
    startingPrice:
      Number(service.avgPackagePrice) ||
      (normalizedPackages.filter((item) => item.price > 0).reduce((sum, item) => sum + item.price, 0) /
        (normalizedPackages.filter((item) => item.price > 0).length || 1)),
    description: service.description || '',
    images: hasMedia ? mediaUrls.images : Array.isArray(service.images) && service.images.length > 0 ? service.images : [FALLBACK_IMAGE],
    videos: hasMedia ? mediaUrls.videos : Array.isArray(service.videos) ? service.videos : [],
    media: hasMedia ? media : [],
    requirements: service.requirements || '',
    travelRadius: Number(service.travelRadiusKm) || 25,
    packages: normalizedPackages,
    reviews: Array.isArray(service.reviews)
      ? service.reviews.map((review) => ({
          id: review.id || '',
          rating: Number(review.rating) || 0,
          text: review.review || '',
          createdAt: review.createdAt || null,
          client: {
            id: review.client?.id || '',
            name: review.client?.name || 'Client',
            avatar: review.client?.avatar || '',
          },
        }))
      : [],
  };
};

export default function ServiceDetailPage() {
  const params = useParams<{ id: string }>();
  const id = typeof params?.id === 'string' ? params.id : '';
  const trackedGigIdRef = useRef<string | null>(null);
  const { isAuthenticated, role } = useAuth();
  const [trackGigDetailView] = useTrackGigDetailViewMutation();

  const { data, isLoading, isError } = useGetPublicServiceByIdQuery(id, {
    skip: !id,
  });

  useEffect(() => {
    if (!id || !data?.success || !data?.data) return;
    if (!isAuthenticated || role !== 'client') return;
    if (trackedGigIdRef.current === id) return;

    trackedGigIdRef.current = id;
    void trackGigDetailView(id);
  }, [data?.data, data?.success, id, isAuthenticated, role, trackGigDetailView]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-slate-500 font-bold">
        Loading service details...
      </div>
    );
  }

  if (isError || !data?.success || !data?.data) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="text-2xl font-black text-slate-900">Service not found</h1>
        <p className="text-slate-500 font-medium">This service may be unavailable or unpublished.</p>
        <Link href="/services" className="text-[#2286BE] font-black">
          Back to services
        </Link>
      </div>
    );
  }

  const service = toServiceDetailShape(data.data as ApiService, id);
  return <ServiceDetailClient service={service} />;
}
