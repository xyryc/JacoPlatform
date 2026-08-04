'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Star, Quote } from 'lucide-react';

interface Review {
  id: number;
  name: string;
  role: string;
  location: string;
  rating: number;
  review: string;
  avatar: string;
}

export default function ReviewsSection() {
  const [activeIndex, setActiveIndex] = useState(0);

  const reviews: Review[] = [
    {
      id: 1,
      name: 'Michael Chen',
      role: 'Homeowner',
      location: 'Glenview, IL',
      rating: 5,
      review: "Absolutely game-changing! The platform's efficiency saved me 15% on window washing, and the professional was stellar. Highly recommended for any homeowner looking to save time.",
      avatar: '/avatar-michael.png'
    },
    {
      id: 2,
      name: 'Sarah Johnson',
      role: 'Interior Designer',
      location: 'Oak Park, IL',
      rating: 5,
      review: "I've used several house cleaning services, but the quality of pros on this platform is unmatched. Detailed, punctual, and very easy to communicate with via the app.",
      avatar: '/avatar-sarah.png'
    },
    {
      id: 3,
      name: 'David Wilson',
      role: 'Tech Consultant',
      location: 'Evanston, IL',
      rating: 4,
      review: "The appliance repair technician arrived within 2 hours of my request. Very professional service and the pricing was прозрачный. Great addition to our neighborhood.",
      avatar: '/avatar-david.png'
    }
  ];

  const nextReview = () => setActiveIndex((prev) => (prev + 1) % reviews.length);
  const prevReview = () => setActiveIndex((prev) => (prev - 1 + reviews.length) % reviews.length);

  return (
    <section className="relative w-full py-20 lg:py-24 overflow-hidden bg-white">
      {/* Background Texture — Using subtle color blob */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-96 h-96 bg-[#2286BE]/5 blur-[120px] pointer-events-none" aria-hidden="true" />

      <div className="relative z-10 mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 md:mb-20">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FBBC05]/10 border border-[#FBBC05]/20 mb-4">
              <Star size={12} className="text-[#FBBC05] fill-[#FBBC05]" />
              <span className="text-[10px] uppercase font-black tracking-widest text-slate-700">4.9/5 Average Rating</span>
            </div>
            <h2 className="text-[38px] font-black text-slate-900 sm:text-[48px] leading-[1.1] tracking-tight">
              What neighbors are saying about our professionals.
            </h2>
          </div>
          
          {/* Navigation Controls */}
          <div className="flex items-center gap-4">
            <button
              onClick={prevReview}
              className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-slate-100 bg-white text-slate-400 hover:border-[#2286BE] hover:text-[#2286BE] hover:shadow-xl hover:shadow-[#2286BE]/10 transition-all active:scale-90"
              aria-label="Previous review"
            >
              <ChevronLeft size={24} strokeWidth={3} />
            </button>
            <button
              onClick={nextReview}
              className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white hover:bg-[#2286BE] hover:shadow-xl transition-all active:scale-90"
              aria-label="Next review"
            >
              <ChevronRight size={24} strokeWidth={3} />
            </button>
          </div>
        </div>

        {/* Carousel Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Image Panel */}
          <div className="lg:col-span-5 relative">
            <div className="relative h-[350px] sm:h-[450px] w-full rounded-[40px] overflow-hidden shadow-2xl shadow-slate-200">
              <Image
                src={reviews[activeIndex].avatar}
                alt={`${reviews[activeIndex].name} - Verified User`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 40vw"
              />
              <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/60 to-transparent flex items-end p-8">
                 <div>
                    <p className="text-white font-black text-xl leading-none">{reviews[activeIndex].name}</p>
                    <p className="text-white font-bold mt-1.5 uppercase tracking-widest text-[11px] opacity-90">{reviews[activeIndex].role}</p>
                 </div>
              </div>
            </div>
            {/* Visual Quote Decoration */}
            <div className="absolute -top-6 -right-6 h-20 w-20 rounded-full bg-[#2286BE] flex items-center justify-center text-white shadow-xl shadow-[#2286BE]/30" aria-hidden="true">
               <Quote size={32} strokeWidth={3} />
            </div>
          </div>

          {/* Testimonial Panel */}
          <div className="lg:col-span-7">
            <div className="space-y-8">
               {/* Rating Stars */}
               <div className="flex items-center gap-1.5" aria-label={`Rating: ${reviews[activeIndex].rating} out of 5 stars`}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star 
                      key={i} 
                      size={20} 
                      className={i < reviews[activeIndex].rating ? "text-[#FBBC05] fill-[#FBBC05]" : "text-slate-200"} 
                      aria-hidden="true"
                    />
                  ))}
               </div>

               {/* Feedback Text */}
               <blockquote className="text-[22px] md:text-[28px] font-bold text-slate-800 leading-[1.4] tracking-tight">
                  &quot;{reviews[activeIndex].review}&quot;
               </blockquote>

               {/* Location Detail */}
               <div className="flex items-center gap-4 pt-6 border-t border-slate-100">
                  <div className="h-10 w-10 border border-slate-100 rounded-xl flex items-center justify-center bg-slate-50 text-[#2286BE]" aria-hidden="true">
                     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                  </div>
                  <div>
                     <p className="text-[11px] font-black uppercase text-slate-500 tracking-widest mb-0.5">Location</p>
                     <p className="text-[15px] font-black text-slate-900">{reviews[activeIndex].location}</p>
                  </div>
               </div>
            </div>

            {/* Pagination Indicators */}
            <div className="mt-12 flex items-center gap-3">
               {reviews.map((_, i) => (
                 <button
                   key={i}
                   onClick={() => setActiveIndex(i)}
                   className="group p-2 -m-2 outline-none"
                   aria-label={`Go to review ${i + 1}`}
                   aria-pressed={i === activeIndex}
                 >
                   <div className={`h-2.5 rounded-full transition-all duration-300 ${i === activeIndex ? 'w-10 bg-[#1b6da0]' : 'w-2.5 bg-slate-300 group-hover:bg-slate-400'}`} />
                 </button>
               ))}
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
