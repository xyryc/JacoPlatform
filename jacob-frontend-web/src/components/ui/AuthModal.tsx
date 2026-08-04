'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Github, Chrome, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BRAND } from '@/lib/constants';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
}

export default function AuthModal({ isOpen, onClose, title = "Join LocallyServe", subtitle = "Sign in to save your favorite services and manage bookings." }: AuthModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" 
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.9, y: 20 }} 
            className="relative bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-3xl overflow-hidden shadow-2xl"
          >
             {/* Close Button */}
             <div className="absolute top-6 right-6">
                <button 
                  onClick={onClose} 
                  className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all border border-slate-100"
                >
                   <X size={20} />
                </button>
             </div>

             <div className="text-center mb-10">
                <div className="h-16 w-16 bg-[#2286BE]/10 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                   <ShieldCheck size={32} className="text-[#2286BE]" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">{title}</h3>
                <p className="text-slate-400 font-medium text-sm leading-relaxed">{subtitle}</p>
             </div>

             <div className="space-y-6">
                {/* Social Logins */}
                <div className="grid grid-cols-2 gap-4">
                   <Button variant="outline" className="h-14 rounded-2xl border-slate-100 font-bold flex items-center gap-2 hover:bg-slate-50">
                      <Chrome size={20} /> Google
                   </Button>
                   <Button variant="outline" className="h-14 rounded-2xl border-slate-100 font-bold flex items-center gap-2 hover:bg-slate-50">
                      <Github size={20} /> Github
                   </Button>
                </div>

                <div className="relative">
                   <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                   <span className="relative bg-white px-4 text-[10px] font-black uppercase tracking-widest text-slate-300 mx-auto block w-fit">Or logic with email</span>
                </div>

                <div className="space-y-4">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                      <Input placeholder="name@example.com" className="h-14 rounded-2xl border-slate-100 bg-slate-50 focus-visible:ring-[#2286BE] font-bold" />
                   </div>
                   <Button className="w-full h-14 rounded-2xl bg-[#2286BE] hover:bg-[#1b6da0] text-white font-black text-lg shadow-xl shadow-[#2286BE]/20 active:scale-95 transition-all">
                      Continue <Mail size={18} className="ml-2" />
                   </Button>
                </div>
             </div>

             <p className="mt-8 text-center text-[11px] font-medium text-slate-400 px-4">
                By continuing, you agree to {BRAND.name}&apos;s <span className="underline cursor-pointer">Terms of Service</span> and <span className="underline cursor-pointer">Privacy Policy</span>.
             </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
