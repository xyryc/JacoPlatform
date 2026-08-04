'use client';

import React from 'react';
import Image from 'next/image';
import { Smartphone, ChevronRight } from 'lucide-react';
import { BRAND, APP_LINKS } from '@/lib/constants';

interface AppDownloadProps {
  bgImage?: string;
  phoneImage?: string;
}

export default function AppDownloadSection({
  bgImage = '/appDownloadbg.png',
  phoneImage = '/appDownloadFront.png',
}: AppDownloadProps) {
  return (
    <section
      className="relative w-full min-h-[550px] flex items-center overflow-hidden bg-cover bg-center px-4 sm:px-6 lg:px-8 py-20 lg:py-0"
      style={{ backgroundImage: `url(${bgImage})` }}
      aria-label={`Download the ${BRAND.name} app`}
    >
      {/* Background Overlay for better text readability */}
      <div className="absolute inset-0 bg-[#E8F4F8]/40 md:hidden" aria-hidden="true" />

      <div className="relative z-10 max-w-[1200px] mx-auto w-full grid grid-cols-1 md:grid-cols-2 items-center gap-12">

        {/* LEFT COLUMN: Phone Mockup with subtle animation */}
        <div className="relative order-2 md:order-1 flex justify-center items-end self-end pt-12 md:pt-0">
          <div className="relative w-full max-w-[450px]">
             <div className="absolute -inset-4 bg-[#2286BE]/10 rounded-full blur-[60px] pointer-events-none" aria-hidden="true" />
             <Image
                src={phoneImage}
                alt={`${BRAND.name} mobile app showing home services booking interface`}
                width={450}
                height={900}
                priority
                className="relative w-full h-auto object-contain translate-y-8 md:translate-y-20 drop-shadow-[0_20px_50px_rgba(0,0,0,0.15)] group-hover:scale-105 transition-transform duration-1000"
             />
          </div>
        </div>

        {/* RIGHT COLUMN: App Download Content */}
        <div className="order-1 md:order-2 flex flex-col items-center md:items-start text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#111827]/5 mb-6">
             <Smartphone size={14} className="text-slate-900" />
             <span className="text-[10px] uppercase font-black tracking-widest text-slate-600">Mobile Experience</span>
          </div>

          <h2 className="text-[38px] md:text-[52px] font-black text-slate-900 leading-[1.05] tracking-tight max-w-lg mb-6">
             Get the app and get{' '}
             <span className="text-[#2286BE]">everything done.</span>
          </h2>

          <p className="text-slate-500 text-lg font-medium max-w-md leading-[1.4] mb-10">
             Take {BRAND.name} with you, on your phone. Find, book, and manage your home services all in one place.
          </p>

          <div className="flex flex-row flex-wrap gap-4 pt-4 justify-center md:justify-start">
             {/* App Store Button */}
             <a
                href={APP_LINKS.appStore}
                aria-label={`Download ${BRAND.name} on the App Store (coming soon)`}
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-slate-900 text-white transition-all hover:bg-slate-800 hover:scale-105 active:scale-95 shadow-xl shadow-slate-900/10"
             >
                <AppleLogo size={24} />
                <div className="flex flex-col text-left">
                   <span className="text-[9px] uppercase font-black text-slate-400 leading-none">Download on the</span>
                   <span className="text-[17px] font-black leading-tight tracking-tight">App Store</span>
                </div>
             </a>

             {/* Play Store Button */}
             <a
                href={APP_LINKS.googlePlay}
                aria-label={`Get ${BRAND.name} on Google Play (coming soon)`}
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-white text-slate-900 border-2 border-slate-100 transition-all hover:border-[#2286BE] hover:scale-105 active:scale-95 shadow-xl shadow-slate-100"
             >
                <PlayStoreLogo size={24} />
                <div className="flex flex-col text-left">
                   <span className="text-[9px] uppercase font-black text-slate-400 leading-none">GET IT ON</span>
                   <span className="text-[17px] font-black leading-tight tracking-tight">Google Play</span>
                </div>
             </a>
          </div>
          
          <div className="mt-10 flex items-center gap-3 text-slate-400 group cursor-pointer">
             <span className="text-sm font-bold border-b border-transparent group-hover:border-[#2286BE]/40 group-hover:text-[#2286BE] transition-all">Learn more about mobile features</span>
             <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

      </div>
    </section>
  );
}

// Icons for store buttons
function AppleLogo({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 384 512" fill="currentColor">
       <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
    </svg>
  );
}

function PlayStoreLogo({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" fill="currentColor">
       <path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z"/>
    </svg>
  );
}
