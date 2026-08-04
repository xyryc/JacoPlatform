'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin, 
  Mail, 
  Phone, 
  MapPin, 
  Send 
} from 'lucide-react';
import { BRAND, CONTACT, SOCIAL_LINKS, APP_LINKS } from '@/lib/constants';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-950 text-white">

      {/* Main Footer Links */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 md:gap-16">
          
          {/* Brand Info */}
          <div className="col-span-1">
            <Link href="/" className="inline-flex items-center gap-2 mb-8">
              <div className="h-10 w-10 bg-[#2286BE] rounded-xl flex items-center justify-center p-2">
                 <Image src={BRAND.logo} alt={BRAND.name} width={24} height={24} className="invert" />
              </div>
              <span className="text-2xl font-black tracking-tight">{BRAND.name}</span>
            </Link>
            <p className="text-slate-400 text-[15px] font-medium leading-[1.6] mb-8">
              {BRAND.tagline} Connecting trust with neighbors since 2024.
            </p>
            <div className="flex items-center gap-4">
              <a href={SOCIAL_LINKS.facebook} aria-label="Facebook" className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:bg-[#2286BE] hover:text-white transition-all"><Facebook size={20} /></a>
              <a href={SOCIAL_LINKS.twitter} aria-label="Twitter" className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:bg-[#2286BE] hover:text-white transition-all"><Twitter size={20} /></a>
              <a href={SOCIAL_LINKS.instagram} aria-label="Instagram" className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:bg-[#2286BE] hover:text-white transition-all"><Instagram size={20} /></a>
              <a href={SOCIAL_LINKS.linkedin} aria-label="LinkedIn" className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:bg-[#2286BE] hover:text-white transition-all"><Linkedin size={20} /></a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-[13px] font-black uppercase tracking-widest text-[#2286BE] mb-8">Explore</h4>
            <ul className="space-y-4">
              <li><Link href="/services" className="text-slate-400 font-medium hover:text-white transition-colors">Find Services</Link></li>
              <li><Link href="/categories" className="text-slate-400 font-medium hover:text-white transition-colors">Categories</Link></li>
              <li><Link href="/success-stories" className="text-slate-400 font-medium hover:text-white transition-colors">Success Stories</Link></li>
              <li><Link href="/join-provider" className="text-slate-400 font-medium hover:text-white transition-colors">Join as Pro</Link></li>
              <li><Link href="/about" className="text-slate-400 font-medium hover:text-white transition-colors">Our Story</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-[13px] font-black uppercase tracking-widest text-[#2286BE] mb-8">Support</h4>
            <ul className="space-y-4">
              <li><Link href={CONTACT.supportUrl} className="text-slate-400 font-medium hover:text-white transition-colors">Help Center</Link></li>
              <li><Link href="/terms" className="text-slate-400 font-medium hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="text-slate-400 font-medium hover:text-white transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-[13px] font-black uppercase tracking-widest text-[#2286BE] mb-8">Contact</h4>
            <ul className="space-y-6">
              <li className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-[#2286BE] shrink-0" aria-hidden="true">
                   <Phone size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Call Us</p>
                  <a href={`tel:${CONTACT.phone.replace(/\s/g, '')}`} className="text-slate-200 font-black hover:text-[#2286BE] transition-colors">{CONTACT.phone}</a>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-[#2286BE] shrink-0" aria-hidden="true">
                   <Mail size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Email Us</p>
                  <a href={`mailto:${CONTACT.email}`} className="text-slate-200 font-black hover:text-[#2286BE] transition-colors">{CONTACT.email}</a>
                </div>
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/5 bg-slate-950/50">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-slate-500 text-sm font-medium">
            © {currentYear} {BRAND.name} Marketplace. All rights reserved.
          </p>
          <div className="flex items-center gap-8">
            <Link href={APP_LINKS.appStore} className="text-slate-500 hover:text-white text-[13px] font-bold transition-colors">iOS App</Link>
            <Link href={APP_LINKS.googlePlay} className="text-slate-500 hover:text-white text-[13px] font-bold transition-colors">Android App</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
