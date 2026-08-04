'use client';

import React from 'react';
import Image from 'next/image';
import { Search, Users, ShieldCheck, Mail } from 'lucide-react';
import { BRAND } from '@/lib/constants';

interface Step {
  id: number;
  icon: React.ReactNode;
  title: string;
  description: string;
}

export default function HowItWorksSection() {
  const steps: Step[] = [
    {
      id: 1,
      icon: <Search className="text-[#2286BE]" size={24} strokeWidth={2.5} />,
      title: 'Find What You Need',
      description: 'Search for home services and review ratings, skills and photos of local professionals.'
    },
    {
      id: 2,
      icon: <Users className="text-[#2286BE]" size={24} strokeWidth={2.5} />,
      title: 'Share the Saving',
      description: 'Book your service slot and save 5-10% more with automated local scheduling optimizations.'
    },
    {
      id: 3,
      icon: <ShieldCheck className="text-[#2286BE]" size={24} strokeWidth={2.5} />,
      title: 'Get it Done',
      description: 'Book instantly and pay securely after the job is completed to your satisfaction.'
    }
  ];

  return (
    <section className="relative w-full py-20 lg:py-24 bg-slate-50 overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-[#E8F4F8]/30 -skew-x-12 translate-x-1/4 pointer-events-none" aria-hidden="true" />

      <div className="relative z-10 mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">

          {/* LEFT COLUMN: Large Illustration */}
          <div className="relative order-2 lg:order-1">
             <div className="relative h-[400px] sm:h-[500px] w-full max-w-[550px] mx-auto overflow-hidden rounded-[40px] shadow-2xl shadow-slate-200">
                <Image
                  src="/howitworks.png"
                  alt={`Step-by-step guide for using ${BRAND.name} services`}
                  fill
                  priority // Above the fold in most viewports
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
             </div>
             {/* Floating Trust Badge */}
             <div className="absolute -bottom-6 -right-6 md:right-0 bg-white p-6 rounded-[24px] shadow-2xl border border-slate-50 max-w-[200px]">
                <div className="flex items-center gap-3 mb-2">
                   <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-600">
                      <ShieldCheck size={20} />
                   </div>
                   <p className="text-[12px] font-black uppercase text-slate-400">Secure</p>
                </div>
                <p className="text-[14px] font-bold text-slate-900 leading-tight">100% Satisfaction Guaranteed</p>
             </div>
          </div>

          {/* RIGHT COLUMN: Steps Content */}
          <div className="order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#2286BE]/10 mb-6">
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#2286BE]">The Process</span>
            </div>
            <h2 className="text-[38px] font-black text-slate-900 sm:text-[48px] leading-[1.1]">
              How {BRAND.name} works?
            </h2>
            <p className="mt-6 text-lg text-slate-500 font-medium leading-relaxed">
              We&apos;ve simplified home services by connecting you directly with trusted local neighbors and pros.
            </p>

            <div className="mt-12 space-y-10">
              {steps.map((step) => (
                <div key={step.id} className="group flex items-start gap-6 transition-transform hover:translate-x-2">
                  <div className="relative shrink-0 flex h-16 w-16 items-center justify-center rounded-[20px] bg-white border border-slate-100 shadow-xl shadow-slate-200/50 group-hover:bg-[#2286BE]/5 transition-colors">
                    <span className="absolute -top-2 -left-2 h-7 w-7 rounded-full bg-white border-2 border-[#2286BE] flex items-center justify-center text-[12px] font-black text-[#2286BE]">
                      0{step.id}
                    </span>
                    {step.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 group-hover:text-[#2286BE] transition-colors leading-tight">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-[15px] leading-relaxed text-slate-500 font-medium">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-14">
               <button 
                  className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-[#111827] text-white font-black text-[15px] transition-all hover:bg-slate-800 hover:scale-105 active:scale-95 shadow-xl"
                  onClick={() => window.location.href = '/join-provider'}
               >
                  Get Started Now
                  <Mail size={18} />
               </button>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
