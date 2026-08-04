'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { TrendingUp, Users, DollarSign, Quote, Star } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { BRAND } from '@/lib/constants';
import { useGetPublicWebsiteReviewsQuery } from '@/store/services/apiSlice';

type StoryCard = {
  id: string;
  name: string;
  role: 'Customer' | 'Provider';
  city: string;
  avatar: string;
  revenue: string;
  rating: number;
  quote: string;
  badge: string;
  color: string;
};

const formatMoney = (value = 0) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const fallbackInitial = (name: string) => name.trim().charAt(0).toUpperCase() || 'U';

const StoryGrid = ({ stories }: { stories: StoryCard[] }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
    {stories.map((story, i) => (
      <motion.div key={story.id} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
        <div className={`bg-gradient-to-b ${story.color} to-white rounded-[2.5rem] border border-slate-100 p-8 h-full flex flex-col hover:shadow-2xl hover:shadow-[#2286BE]/10 transition-all hover:-translate-y-1`}>
          <Quote size={32} className="text-[#2286BE]/20 mb-4" aria-hidden="true" />
          <p className="text-slate-600 font-medium leading-relaxed mb-8 flex-1">&quot;{story.quote}&quot;</p>
          <div className="border-t border-slate-100 pt-6">
            <div className="flex items-center gap-4 mb-4">
              <Avatar className="h-14 w-14 border-2 border-white ring-2 ring-slate-100">
                <AvatarImage src={story.avatar} alt={story.name} />
                <AvatarFallback className="font-black text-slate-400">{fallbackInitial(story.name)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-black text-slate-900">{story.name}</p>
                <p className="text-sm font-bold text-slate-400">{story.role}</p>
                <p className="text-xs font-bold text-slate-300">{story.city}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  {story.role === 'Customer' ? 'Monthly Spending' : 'Monthly Earnings'}
                </p>
                <p className="text-lg font-black text-slate-900">{story.revenue}</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 justify-end mb-1">
                  <Star size={14} className="text-amber-400 fill-amber-400" aria-hidden="true" />
                  <span className="font-black text-slate-900 text-sm" aria-label={`Website rating: ${story.rating}`}>
                    {story.rating}
                  </span>
                </div>
                {story.role === 'Provider' ? (
                  <span className="text-[10px] font-black text-[#2286BE] bg-[#2286BE]/5 px-2.5 py-1 rounded-lg uppercase">
                    {story.badge}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    ))}
  </div>
);

export default function SuccessStoriesClient() {
  const { data } = useGetPublicWebsiteReviewsQuery();
  const successStats = data?.data?.stats;
  const hasStats = Boolean(successStats);

  const stats = React.useMemo(
    () => [
      {
        icon: <DollarSign size={24} />,
        value: hasStats ? formatMoney(successStats?.totalProviderWithdrawable) : '...',
        label: 'Total Paid to Providers',
      },
      {
        icon: <Users size={24} />,
        value: hasStats ? new Intl.NumberFormat('en-US').format(Number(successStats?.activeVerifiedProviders || 0)) : '...',
        label: 'Active Professionals',
      },
      {
        icon: <TrendingUp size={24} />,
        value: hasStats
          ? `${Number(successStats?.sixMonthIncomeGrowthPercent || 0) > 0 ? '+' : ''}${Number(successStats?.sixMonthIncomeGrowthPercent || 0)}%`
          : '...',
        label: 'Avg. Income Growth in 6 Months',
      },
    ],
    [
      hasStats,
      successStats?.activeVerifiedProviders,
      successStats?.sixMonthIncomeGrowthPercent,
      successStats?.totalProviderWithdrawable,
    ]
  );

  const customerStories: StoryCard[] = React.useMemo(
    () =>
      (data?.data?.clientReviews || []).map((review, index) => ({
        id: review.id || `client-${index}`,
        name: review.reviewer?.name || 'Customer',
        role: 'Customer',
        city: review.reviewer?.location || 'Location not provided',
        avatar: review.reviewer?.avatar || '',
        revenue: `${formatMoney(review.reviewer?.monthlySpending)} / month`,
        rating: Number(review.websiteRating || 0),
        quote: review.reviewText || 'Shared a website review.',
        badge: '',
        color: 'from-blue-50',
      })),
    [data?.data?.clientReviews]
  );

  const providerStories: StoryCard[] = React.useMemo(
    () =>
      (data?.data?.providerReviews || []).map((review, index) => ({
        id: review.id || `provider-${index}`,
        name: review.reviewer?.name || 'Provider',
        role: 'Provider',
        city: review.reviewer?.location || 'Location not provided',
        avatar: review.reviewer?.avatar || '',
        revenue: `${formatMoney(review.reviewer?.monthlyIncome)} / month`,
        rating: Number(review.websiteRating || 0),
        quote: review.reviewText || 'Shared a website review.',
        badge: review.reviewer?.sellerLevel || 'New',
        color: 'from-yellow-50',
      })),
    [data?.data?.providerReviews]
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC]">

      {/* Hero + Stats combined - no negative margin clip */}
      <section className="relative bg-slate-900 pt-32 pb-24 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#2286BE]/10 rounded-full translate-x-1/2 -translate-y-1/2 blur-[100px]" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/5 rounded-full -translate-x-1/2 translate-y-1/2 blur-[80px]" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-flex bg-[#2286BE]/20 text-[#2286BE] px-4 py-2 rounded-full font-black text-xs uppercase tracking-widest mb-6">Real Providers, Real Results</span>
            <h1 className="text-5xl md:text-6xl font-black text-white tracking-tight mb-6 mt-4">Success Stories</h1>
            <p className="text-slate-400 text-xl font-medium max-w-2xl mx-auto">
              Hear from the professionals who built thriving businesses on {BRAND.name} - in their own words.
            </p>
          </motion.div>
        </div>

        {/* Stats - inside the dark hero, fully visible */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-24">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.map(stat => (
              <div key={stat.label} className="bg-white/10 backdrop-blur-md rounded-[2rem] border border-white/10 p-8 text-center">
                <div className="h-12 w-12 bg-[#2286BE]/20 rounded-2xl flex items-center justify-center text-[#2286BE] mx-auto mb-4" aria-hidden="true">{stat.icon}</div>
                <p className="text-2xl font-black text-white mb-1">{stat.value}</p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Stories */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-32 pb-28">
        <div className="mb-14">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-8">Customer Reviews</h2>
          <StoryGrid stories={customerStories} />
        </div>
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-8">Provider Reviews</h2>
          <StoryGrid stories={providerStories} />
        </div>
      </section>

      {/* CTA */}
      <section className="pb-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-slate-900 rounded-[3rem] p-16 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#2286BE]/20 rounded-full translate-x-1/2 -translate-y-1/2 blur-[80px] pointer-events-none" aria-hidden="true" />
          <div className="relative z-10">
            <h2 className="text-4xl font-black text-white mb-4">Your Success Story Starts Here</h2>
            <p className="text-slate-400 font-medium mb-10 max-w-lg mx-auto">Join thousands of providers already thriving on {BRAND.name}.</p>
            <Link href="/join-provider">
              <Button className="h-16 px-14 bg-[#2286BE] hover:bg-[#1b6da0] text-white font-black text-lg rounded-2xl shadow-xl shadow-[#2286BE]/20 active:scale-95 transition-all">
                Join as Provider - Free
              </Button>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
