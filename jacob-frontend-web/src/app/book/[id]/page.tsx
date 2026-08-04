'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import BookingClient from '@/components/sections/BookingClient';
import { useGetPublicServiceByIdQuery } from '@/store/services/apiSlice';

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
  categoryName?: string;
  description?: string;
  requirements?: string;
  images?: string[];
  baseCity?: string;
  zipCode?: string;
  travelRadiusKm?: number | null;
  avgPackagePrice?: number;
  packages?: ApiPackage[];
  provider?: {
    id?: string;
    name?: string;
    avatar?: string;
    rating?: number;
    type?: 'Solo' | 'Team' | 'Agency';
    level?: 'New' | 'Level 1' | 'Level 2' | 'Level 3' | 'Top Rated';
    completedOrders?: number;
  };
};

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1581578731548-c64695ce6958?q=80&w=1200&h=675&auto=format&fit=crop';

const toBookingShape = (service: ApiService, id: string) => {
  const packages = Array.isArray(service.packages) ? service.packages : [];
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
    provider: {
      id: service.provider?.id || '',
      name: service.provider?.name || 'Provider',
      type: service.provider?.type || 'Solo',
      avatar: service.provider?.avatar || '',
      level: service.provider?.level || 'Level 2',
      rating: Number(service.provider?.rating) || 0,
      completedOrders: Number(service.provider?.completedOrders) || 0,
    },
    location: {
      city: service.baseCity || 'Location unavailable',
    },
    zipCode: service.zipCode || '',
    startingPrice:
      Number(service.avgPackagePrice) ||
      (normalizedPackages.filter((item) => item.price > 0).reduce((sum, item) => sum + item.price, 0) /
        (normalizedPackages.filter((item) => item.price > 0).length || 1)),
    description: service.description || '',
    images: Array.isArray(service.images) && service.images.length > 0 ? service.images : [FALLBACK_IMAGE],
    requirements: service.requirements || '',
    travelRadius: Number(service.travelRadiusKm) || 25,
    packages: normalizedPackages,
  };
};

export default function BookingPage() {
  const params = useParams<{ id: string }>();
  const id = typeof params?.id === 'string' ? params.id : '';

  const { data, isLoading, isError } = useGetPublicServiceByIdQuery(id, {
    skip: !id,
  });

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-slate-500 font-bold">
        Loading booking details...
      </div>
    );
  }

  if (isError || !data?.success || !data?.data) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="text-2xl font-black text-slate-900">Booking not found</h1>
        <p className="text-slate-500 font-medium">This service may be unavailable or unpublished.</p>
        <Link href="/services" className="text-[#2286BE] font-black">
          Back to services
        </Link>
      </div>
    );
  }

  const service = toBookingShape(data.data as ApiService, id);
  return <BookingClient service={service} />;
}
