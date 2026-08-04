'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CalendarDays, MessageSquare, Star } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useGetProviderRatingsQuery } from '@/store/services/apiSlice';

type RatingOrder = {
  id: string;
  orderNumber?: string;
  orderName?: string;
  categoryName?: string;
  clientRating?: number | null;
  clientReview?: string;
  completedAt?: string | null;
  paidAt?: string | null;
  createdAt?: string | null;
  client?: {
    name?: string;
    avatar?: string;
  };
};

const formatDate = (value?: string | null) => {
  if (!value) return 'Date unavailable';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const Stars = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-1">
    {Array.from({ length: 5 }).map((_, index) => (
      <Star
        key={index}
        size={16}
        className={index < Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}
      />
    ))}
  </div>
);

export default function ProviderRatingsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching } = useGetProviderRatingsQuery({ page, limit: 8 });
  const reviews = useMemo(() => ((data?.data?.items || []) as RatingOrder[]).filter(Boolean), [data]);
  const pagination = data?.data?.pagination;
  const summary = data?.data?.summary;

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12 pb-28">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <Link href="/provider/dashboard" className="mb-4 inline-flex items-center text-sm font-black text-[#2286BE]">
              <ArrowLeft size={16} className="mr-2" /> Back to Dashboard
            </Link>
            <h1 className="text-4xl font-black tracking-tight text-slate-900">Provider Ratings</h1>
            <p className="mt-2 text-lg font-medium text-slate-500">All ratings clients have submitted for completed paid orders.</p>
          </div>
          <div className="rounded-2xl bg-white px-6 py-5 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Average Rating</p>
            <div className="mt-1 flex items-center gap-3">
              <p className="text-3xl font-black text-slate-900">{Number(summary?.averageRating || 0).toFixed(1)}</p>
              <Stars rating={Number(summary?.averageRating || 0)} />
            </div>
            <p className="mt-1 text-xs font-bold text-slate-400">Based on {Number(summary?.reviewCount || 0)} reviews</p>
          </div>
        </div>

        {isLoading ? (
          <div className="rounded-[2rem] bg-white p-16 text-center font-bold text-slate-500 shadow-sm">Loading ratings...</div>
        ) : reviews.length ? (
          <div className="space-y-4">
            {reviews.map((review) => {
              const rating = Number(review.clientRating || 0);
              return (
                <Card key={review.id} className="border-none bg-white shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                      <div className="flex min-w-0 items-center gap-4">
                        <Avatar className="h-12 w-12 border border-slate-100">
                          {review.client?.avatar ? <AvatarImage src={review.client.avatar} alt={review.client.name || 'Client'} /> : null}
                          <AvatarFallback className="bg-slate-100 font-black text-slate-500">{review.client?.name?.[0] || 'C'}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-black text-slate-900">{review.client?.name || 'Client'}</p>
                          <Link href={`/provider/orders/${review.id}`} className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-[#2286BE]">
                            {review.orderName || 'Service order'}
                          </Link>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 md:items-end">
                        <Stars rating={rating} />
                        <span className="flex items-center gap-2 text-xs font-bold text-slate-400">
                          <CalendarDays size={14} /> {formatDate(review.completedAt || review.paidAt || review.createdAt)}
                        </span>
                      </div>
                    </div>
                    <div className="mt-5 rounded-2xl bg-slate-50 p-5">
                      <p className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <MessageSquare size={14} /> Client Review
                      </p>
                      <p className="font-medium leading-relaxed text-slate-700">{review.clientReview || 'No written review was submitted.'}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="rounded-[2rem] bg-white p-16 text-center shadow-sm">
            <h2 className="text-2xl font-black text-slate-900">No ratings yet</h2>
            <p className="mt-2 font-medium text-slate-500">Client ratings will show up here after paid orders are completed.</p>
          </div>
        )}
      </div>

      <div className="pointer-events-none fixed bottom-4 left-1/2 z-50 -translate-x-1/2">
        <div className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/95 px-3 py-2 shadow-xl backdrop-blur">
          <Button variant="outline" size="sm" disabled={!pagination?.hasPrevPage || isFetching} onClick={() => setPage((prev) => Math.max(1, prev - 1))} className="h-9 rounded-xl text-xs font-black uppercase tracking-widest">Prev</Button>
          <span className="text-xs font-black uppercase tracking-widest text-slate-600">{pagination?.page || page} / {pagination?.totalPages || 1}</span>
          <Button variant="outline" size="sm" disabled={!pagination?.hasNextPage || isFetching} onClick={() => setPage((prev) => prev + 1)} className="h-9 rounded-xl text-xs font-black uppercase tracking-widest">Next</Button>
        </div>
      </div>
    </div>
  );
}
