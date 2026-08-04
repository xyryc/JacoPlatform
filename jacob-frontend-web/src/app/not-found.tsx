'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home, ArrowRight, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BRAND } from '@/lib/constants';

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-20 bg-white">
      <div className="max-w-xl w-full text-center relative">
        {/* Abstract Background Decoration */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#2286BE]/5 rounded-full blur-[100px] pointer-events-none" aria-hidden="true" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative z-10"
        >
          {/* Large 404 Indicator */}
          <div className="mb-8">
            <span className="text-[120px] sm:text-[180px] font-black leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-slate-900 to-slate-400 opacity-20 select-none">
              404
            </span>
          </div>

          {/* Icon Cluster */}
          <div className="mb-10 flex justify-center">
            <div className="relative h-24 w-24 bg-white rounded-3xl shadow-2xl shadow-slate-200 border border-slate-100 flex items-center justify-center animate-bounce">
              <Search size={40} className="text-[#2286BE]" strokeWidth={2.5} />
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-6">
            Lost in the Neighborhood?
          </h1>
          
          <p className="text-slate-500 font-medium text-lg mb-10 max-w-md mx-auto leading-relaxed">
            The page you&apos;re looking for has moved or doesn&apos;t exist. Don&apos;t worry, {BRAND.name} is here to help you get back on track.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/">
              <Button className="h-14 px-10 bg-[#2286BE] hover:bg-[#1b6da0] text-white font-black text-base rounded-2xl shadow-xl shadow-[#2286BE]/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
                <Home size={18} className="mr-2" /> Back to Home
              </Button>
            </Link>
            
            <Link href="/services">
              <Button variant="outline" className="h-14 px-10 border-slate-200 text-slate-600 hover:text-[#2286BE] hover:border-[#2286BE] font-black text-base rounded-2xl transition-all">
                Browse Services <ArrowRight size={18} className="ml-2" />
              </Button>
            </Link>
          </div>

          {/* Support Link */}
          <div className="mt-16 pt-8 border-t border-slate-100">
            <p className="text-slate-400 font-bold text-sm">
              Need immediate help? <Link href="/contact" className="text-[#2286BE] hover:underline hover:text-[#1b6da0]">Contact our support team</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
