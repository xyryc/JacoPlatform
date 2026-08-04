'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Star, 
  ShieldCheck, 
  MapPin, 
  Calendar, 
  MessageSquare, 
  Share2, 
  MoreHorizontal,
  History,
  ShoppingBag,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import ReviewFilter from '@/components/ui/ReviewFilter';

export default function ClientPublicProfile() {
  const { id } = useParams();
  const [reviewFilter, setReviewFilter] = useState(0);
  
  const decodedName = typeof id === 'string' ? decodeURIComponent(id).replace(/-/g, ' ') : 'Ahmed Rashid';

  // Mock client data (in a real app, this would be a separate API call)
  const client = {
    id: id,
    name: decodedName,
    avatar: '',
    location: 'Dhaka, BD',
    joined: 'October 2023',
    rating: 4.9,
    reviewsCount: 8,
    ordersCount: 15,
    spent: '$450',
    bio: 'Dedicated homeowner looking for high-quality maintenance and cleaning services. I value punctuality and professional results.'
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Header Profile Section */}
      <div className="bg-white border-b border-slate-100 pt-16 pb-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-10 items-center md:items-start text-center md:text-left">
            
            {/* Left: Avatar */}
            <div className="relative">
              <Avatar className="h-44 w-44 border-8 border-white shadow-2xl shadow-slate-200/50 ring-1 ring-slate-100">
                <AvatarImage src={client.avatar} />
                <AvatarFallback className="text-4xl font-black">{client.name[0]}</AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-2 -right-2 bg-[#2286BE] text-white p-2.5 rounded-2xl shadow-lg border-4 border-white">
                <ShieldCheck size={24} fill="currentColor" />
              </div>
            </div>

            {/* Right: Info & Stats */}
            <div className="flex-1 w-full">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
                <div>
                  <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">{client.name}</h1>
                  <div className="flex flex-wrap justify-center md:justify-start gap-4 items-center text-sm font-bold text-slate-500">
                    <div className="flex items-center gap-1.5"><MapPin size={18} className="text-slate-400" /> {client.location}</div>
                    <div className="flex items-center gap-1.5"><Calendar size={18} className="text-slate-400" /> Member since {client.joined}</div>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Link href={`/messages?user=${client.id}`}>
                    <Button className="h-12 bg-[#2286BE] hover:bg-[#1b6da0] rounded-xl font-bold px-8 shadow-lg shadow-[#2286BE]/20 gap-2">
                       <MessageSquare size={18} /> Message
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                {[
                  { label: 'Orders', value: client.ordersCount, icon: <ShoppingBag size={16} className="text-[#2286BE]" /> },
                  { label: 'Rating', value: `${client.rating}/5.0`, icon: <Star size={16} className="text-amber-400" /> },
                  { label: 'Spent', value: client.spent, icon: <History size={16} className="text-purple-500" /> },
                  { label: 'Reviews', value: client.reviewsCount, icon: <MessageSquare size={16} className="text-green-500" /> },
                ].map((stat, i) => (
                  <Card key={i} className="border-none bg-slate-50 shadow-none rounded-2xl">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-1">
                        {stat.icon}
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</span>
                      </div>
                      <p className="text-xl font-black text-slate-900">{stat.value}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* About Section */}
        <div className="lg:col-span-2 space-y-8">
           <div className="bg-white rounded-[2.5rem] border border-slate-100 p-10 shadow-sm">
             <h2 className="text-2xl font-black text-slate-900 mb-6">Introduction</h2>
             <p className="text-slate-600 font-medium text-lg leading-relaxed">{client.bio}</p>
           </div>
           
           <div className="bg-white rounded-[2.5rem] border border-slate-100 p-10 shadow-sm mt-8">
             <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
               Reviews From Professionals
               <Badge className="bg-[#2286BE]/5 text-[#2286BE] border-none font-black text-xs px-3 py-1">{client.reviewsCount}</Badge>
             </h2>
             {(() => {
               const allReviews = [
                 { name: 'QuickFix Team', role: 'Provider', rating: 5, date: 'Jan 20, 2024', text: 'Clear communication and provided easy access to the workspace. Highly recommended.', avatar: '' },
                 { name: 'Sarah Khan', role: 'Lead Cleaner', rating: 5, date: 'Dec 15, 2023', text: 'Very polite and helpful. The instructions were precise, making the job much smoother.', avatar: '' },
                 { name: 'Rafi Hasan', role: 'Handyman', rating: 4, date: 'Nov 10, 2023', text: 'Great client, very accommodating. Provided all necessary access without any hassle.', avatar: '' },
               ];
               const counts = allReviews.reduce((acc, r) => { acc[r.rating] = (acc[r.rating] || 0) + 1; return acc; }, {} as Record<number, number>);
               const filtered = reviewFilter === 0 ? allReviews : allReviews.filter(r => r.rating === reviewFilter);
               return (
                 <>
                   <ReviewFilter selected={reviewFilter} onChange={setReviewFilter} counts={counts} total={allReviews.length} />
                   {filtered.length === 0 ? (
                     <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                       <Star size={28} className="text-slate-200 mx-auto mb-3" />
                       <p className="text-slate-400 font-bold">No reviews for this rating.</p>
                     </div>
                   ) : (
                     <div className="space-y-8">
                       {filtered.map((review, i) => (
                         <div key={i} className="border-b border-slate-50 last:border-0 pb-8 last:pb-0">
                           <div className="flex items-center justify-between mb-4">
                             <div className="flex items-center gap-3">
                               <Avatar className="h-12 w-12 border border-slate-100 shadow-sm">
                                 <AvatarImage src={review.avatar} />
                                 <AvatarFallback className="font-bold">{review.name[0]}</AvatarFallback>
                               </Avatar>
                               <div>
                                 <p className="font-black text-slate-900">{review.name}</p>
                                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{review.role} • {review.date}</p>
                               </div>
                             </div>
                             <div className="flex items-center gap-1">
                               {[...Array(review.rating)].map((_, j) => <Star key={j} size={14} className="text-amber-400 fill-amber-400" />)}
                             </div>
                           </div>
                           <p className="text-slate-600 font-medium leading-relaxed">{review.text}</p>
                         </div>
                       ))}
                     </div>
                   )}
                 </>
               );
             })()}
           </div>
        </div>

        {/* Sidebar Activity */}
        <div className="space-y-8">
           <Card className="rounded-[2.5rem] border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden">
              <div className="bg-[#2286BE] p-6 text-center text-white">
                <Clock size={32} className="mx-auto mb-3 opacity-80" />
                <h3 className="font-black text-xl">Client Verification</h3>
              </div>
              <CardContent className="p-8 space-y-4">
                <div className="flex items-center gap-3">
                   <div className="h-8 w-8 rounded-full bg-green-50 text-green-500 flex items-center justify-center shrink-0">
                      <ShieldCheck size={16} />
                   </div>
                   <span className="text-sm font-bold text-slate-600">Identity Verified</span>
                </div>
                <div className="flex items-center gap-3">
                   <div className="h-8 w-8 rounded-full bg-green-50 text-green-500 flex items-center justify-center shrink-0">
                      <ShieldCheck size={16} />
                   </div>
                   <span className="text-sm font-bold text-slate-600">Payment Method Verified</span>
                </div>
                <div className="flex items-center gap-3 text-slate-300">
                   <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0">
                      <ShieldCheck size={16} />
                   </div>
                   <span className="text-sm font-bold">Email Verified</span>
                </div>
              </CardContent>
           </Card>

           <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
             <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Language</h3>
             <div className="flex flex-wrap gap-2">
                {['English (Fluent)', 'Bengali (Native)'].map(lang => (
                  <Badge key={lang} className="bg-slate-50 text-slate-600 border-none px-4 py-2 rounded-xl font-bold">{lang}</Badge>
                ))}
             </div>
           </div>
        </div>

      </div>
    </div>
  );
}
