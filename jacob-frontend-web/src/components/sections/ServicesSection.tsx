'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Star } from 'lucide-react';
import { useGetPublicServicesQuery } from '@/store/services/apiSlice';
import { formatRating } from '@/lib/formatters';

type HomeService = {
  id: string;
  title: string;
  categoryName?: string;
  image?: string;
  baseCity?: string;
  avgPackagePrice?: number;
  provider?: {
    rating?: number;
    reviewCount?: number;
    name?: string;
  };
};

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1581578731548-c64695ce6958?q=80&w=1200&h=900&auto=format&fit=crop';

export default function ServicesSection() {
  const { data, isFetching } = useGetPublicServicesQuery({
    page: 1,
    limit: 100,
    radiusKm: 100,
    requireCoverage: false,
    categorySlug: 'all',
    search: '',
    lat: null,
    lng: null,
  });

  const services = React.useMemo(() => {
    const items = Array.isArray(data?.data?.items) ? (data?.data?.items as HomeService[]) : [];
    return [...items]
      .sort((left, right) => {
        const rightRating = Number(right.provider?.rating) || 0;
        const leftRating = Number(left.provider?.rating) || 0;
        if (rightRating !== leftRating) return rightRating - leftRating;

        const rightReviews = Number(right.provider?.reviewCount) || 0;
        const leftReviews = Number(left.provider?.reviewCount) || 0;
        if (rightReviews !== leftReviews) return rightReviews - leftReviews;

        return (Number(right.avgPackagePrice) || 0) - (Number(left.avgPackagePrice) || 0);
      })
      .slice(0, 6);
  }, [data?.data?.items]);

  return (
    <section className="relative w-full py-20 lg:py-24 overflow-hidden bg-[#FFFFFF]">
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        aria-hidden="true"
        style={{ background: 'linear-gradient(to bottom, #E8F4F8 0%, #FFFFFF 60%)', opacity: 0.6 }}
      />

      <div className="relative z-10 mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 lg:mb-16">
          <h2 className="text-[38px] font-black text-slate-900 sm:text-[44px] tracking-tight">
            Our Quality Services
          </h2>
          <p className="mt-4 mx-auto max-w-[500px] text-[15px] sm:text-[16px] leading-[1.6] text-slate-500 font-medium">
            Browse some of the top rated gigs from verified professionals and jump straight into the details.
          </p>
        </div>

        {isFetching ? (
          <div className="rounded-[24px] border border-slate-100 bg-white p-12 text-center text-slate-500 font-bold shadow-[0_2px_15px_rgba(0,0,0,0.03)]">
            Loading top rated services...
          </div>
        ) : services.length === 0 ? (
          <div className="rounded-[24px] border border-slate-100 bg-white p-12 text-center text-slate-500 font-bold shadow-[0_2px_15px_rgba(0,0,0,0.03)]">
            No published gigs available right now.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service, index) => (
              <Link
                key={service.id}
                href={`/services/${service.id}`}
                className={`group relative flex flex-col rounded-[24px] bg-white p-5 border transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#2286BE]/10 ${
                  index === 0
                    ? 'border-[#2286BE]/20 ring-1 ring-[#2286BE]/20 shadow-[0_12px_40px_rgba(34,134,190,0.1)]'
                    : 'border-slate-100 shadow-[0_2px_15px_rgba(0,0,0,0.03)]'
                }`}
              >
                <div className="relative h-[200px] w-full overflow-hidden rounded-[18px]">
                  <Image
                    src={service.image || FALLBACK_IMAGE}
                    alt={`${service.title} professional service`}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  {index === 0 && (
                    <div className="absolute top-3 right-3 bg-[#2286BE] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg">
                      Top Rated
                    </div>
                  )}
                  <div className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-900 shadow-sm">
                    ${Number(service.avgPackagePrice || 0).toFixed(2)}
                  </div>
                </div>

                <div className="mt-5 px-1 flex flex-col flex-1">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                      {service.categoryName || 'General'}
                    </span>
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star size={14} className="fill-current" />
                      <span className="text-sm font-black text-slate-900">
                        {formatRating(Number(service.provider?.rating) || 0)}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-xl font-black text-slate-900 group-hover:text-[#2286BE] transition-colors leading-tight line-clamp-2">
                    {service.title}
                  </h3>

                  <p className="mt-3 text-[14px] leading-relaxed text-slate-500 font-medium line-clamp-2">
                    Offered by {service.provider?.name || 'a verified provider'} in your marketplace.
                  </p>

                  <div className="mt-5 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-slate-400">
                      <MapPin size={12} className="text-[#2286BE]" />
                      <span className="truncate max-w-[140px]">{service.baseCity || 'Location'}</span>
                    </div>
                    <span className="text-[13px] font-black text-[#2286BE] uppercase tracking-widest group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                      View Details
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-12 flex justify-center lg:mt-20">
          <Link
            href="/services"
            className="group relative inline-flex items-center justify-center overflow-hidden rounded-full px-10 py-4 font-black transition-all hover:scale-105 active:scale-95 bg-white border-2 border-[#2286BE] text-[#2286BE] shadow-xl shadow-[#2286BE]/10"
          >
            <span className="relative text-base uppercase tracking-widest">Explore More Services</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
