'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShieldCheck, UserCheck, Zap, ArrowRight, ArrowUpRight } from 'lucide-react';

interface ProfessionalProps {
  image?: string;
}

export default function ProfessionalsSection({
  image = '/professionalSection.png'
}: ProfessionalProps) {
  return (
    <section className="relative w-full py-20 lg:py-24 bg-white overflow-hidden">
      <div className="relative z-10 mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        
        {/* Background Card Wrapper for Premium Feel */}
        <div className="relative rounded-[40px] bg-slate-50 border border-slate-100 p-8 md:p-16 overflow-hidden">
           {/* Abstract Decoration */}
           <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#2286BE]/5 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
           
           <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">

             {/* LEFT COLUMN: Large Illustration */}
             <div className="relative">
                <div className="relative h-[400px] sm:h-[500px] w-full max-w-[500px] mx-auto overflow-hidden rounded-[32px] shadow-2xl shadow-slate-300">
                   <Image
                      src={image}
                      alt="Professional service provider at work"
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 40vw"
                   />
                </div>
                {/* Floating Metric Badge */}
                <div className="absolute -bottom-6 -left-6 bg-[#2286BE] p-6 rounded-[24px] shadow-2xl shadow-[#2286BE]/30 text-white min-w-[180px]">
                   <p className="text-[28px] font-black leading-none mb-1">500+</p>
                   <p className="text-[12px] font-black uppercase tracking-widest opacity-80">Verified Pros Joined</p>
                </div>
             </div>

             {/* RIGHT COLUMN: Value Proposition */}
             <div className="flex flex-col">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#2286BE]/10 mb-8 w-fit">
                   <UserCheck size={14} className="text-[#2286BE]" />
                   <span className="text-[10px] uppercase font-black tracking-widest text-[#2286BE]">Join our professional network</span>
                </div>

                <h2 className="text-[38px] font-black text-slate-900 sm:text-[52px] leading-[1.05] tracking-tight mb-8">
                   Are you a service <span className="text-[#2286BE]">professional?</span>
                </h2>

                <div className="space-y-8 mb-12">
                   <div className="flex items-start gap-4">
                      <div className="h-12 w-12 shrink-0 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-[#2286BE] shadow-xl shadow-slate-200/50">
                         <Zap size={22} fill="#2286BE" strokeWidth={1} />
                      </div>
                      <div>
                         <h3 className="text-xl font-black text-slate-900 leading-none mb-2">Instant Leads</h3>
                         <p className="text-[15px] font-medium text-slate-500 leading-relaxed">Receive instant notifications for service requests and local business opportunities in your area.</p>
                      </div>
                   </div>

                   <div className="flex items-start gap-4">
                      <div className="h-12 w-12 shrink-0 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-[#2286BE] shadow-xl shadow-slate-200/50">
                         <ShieldCheck size={22} fill="#2286BE" strokeWidth={1} />
                      </div>
                      <div>
                         <h3 className="text-xl font-black text-slate-900 leading-none mb-2">Secure Payments</h3>
                         <p className="text-[15px] font-medium text-slate-500 leading-relaxed">No more chasing invoices. Payments are secured in escrow and released directly to your bank account.</p>
                      </div>
                   </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                   <Link href="/join-provider" className="group inline-flex items-center justify-center gap-3 px-10 py-5 rounded-[20px] bg-[#2286BE] text-white font-black text-base transition-all hover:bg-[#1b6da0] hover:scale-105 active:scale-95 shadow-2xl shadow-[#2286BE]/20">
                      Sign Up as a Professional
                      <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                   </Link>
                   <Link href="/provider-help" className="inline-flex items-center justify-center gap-2 px-10 py-5 rounded-[20px] bg-white text-slate-900 font-bold text-base transition-all hover:border-[#2286BE] hover:text-[#2286BE] border-2 border-slate-100">
                      How it works
                      <ArrowUpRight size={18} />
                   </Link>
                </div>
             </div>

           </div>
        </div>

      </div>
    </section>
  );
}
