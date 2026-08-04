'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  BookOpen, LifeBuoy, MessageCircle, ChevronDown, ChevronUp,
  Search, ArrowRight, CheckCircle2, Phone, Mail, Clock
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const sections = [
  {
    icon: <BookOpen size={22} />,
    title: 'Getting Started',
    color: 'bg-blue-50 text-blue-500',
    articles: ['How to create your provider profile', 'Setting up your first service listing', 'Understanding the verification process', 'Setting availability and working hours'],
  },
  {
    icon: <MessageCircle size={22} />,
    title: 'Managing Orders',
    color: 'bg-green-50 text-green-500',
    articles: ['How to accept or decline an order', 'Communicating with clients', 'Handling order changes and cancellations', 'Completing an order and requesting review'],
  },
  {
    icon: <LifeBuoy size={22} />,
    title: 'Payments & Earnings',
    color: 'bg-amber-50 text-amber-500',
    articles: ['How earnings are calculated', 'Payout schedule and methods', 'Invoices and tax documents', 'Disputing a payment issue'],
  },
  {
    icon: <CheckCircle2 size={22} />,
    title: 'Rules & Policies',
    color: 'bg-purple-50 text-purple-500',
    articles: ['Community standards for providers', 'What can get your account suspended', 'Insurance and liability coverage', 'Platform fee structure'],
  },
];

const faqs = [
  { q: 'How long does profile verification take?', a: 'Verification typically takes 24–48 hours. You will receive a notification via email and in-app once your badge is approved.' },
  { q: 'Can I pause my availability temporarily?', a: 'Yes. Go to Profile → Settings → Availability and toggle off your active status. You can resume anytime.' },
  { q: 'What happens if a client disputes a job?', a: 'Our support team will review both sides within 5 business days. If evidence supports your case, you keep your full payment.' },
  { q: 'How do I increase my visibility on search results?', a: 'Maintain a high response rate (>90%), keep your profile complete, collect more 5-star reviews, and stay active on the platform.' },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`bg-white rounded-[1.5rem] border transition-all ${open ? 'border-[#2286BE]/30 shadow-lg shadow-[#2286BE]/5' : 'border-slate-100'}`}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between gap-4 p-7 text-left">
        <span className="font-black text-slate-900">{q}</span>
        {open ? <ChevronUp size={20} className="text-[#2286BE] shrink-0" /> : <ChevronDown size={20} className="text-slate-400 shrink-0" />}
      </button>
      {open && <div className="px-7 pb-7"><p className="text-slate-500 font-medium leading-relaxed">{a}</p></div>}
    </div>
  );
}

export default function ProviderHelpPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">

      {/* Hero */}
      <section className="bg-slate-900 pt-24 pb-32 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#2286BE]/10 rounded-full translate-x-1/2 -translate-y-1/2 blur-[100px] pointer-events-none" />
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-flex bg-[#2286BE]/20 text-[#2286BE] px-4 py-2 rounded-full font-black text-xs uppercase tracking-widest mb-6">Provider Help Center</span>
            <h1 className="text-5xl font-black text-white tracking-tight mb-6 mt-4">How can we help?</h1>
            <div className="relative max-w-xl mx-auto">
              <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <Input placeholder="Search help articles..." className="h-16 pl-14 rounded-2xl bg-white/10 border-white/20 text-white placeholder:text-slate-400 font-medium focus-visible:ring-[#2286BE]" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Article Sections */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 mb-24">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {sections.map(sec => (
            <div key={sec.title} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8 hover:shadow-xl hover:shadow-[#2286BE]/10 hover:-translate-y-1 transition-all group cursor-pointer">
              <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${sec.color} mb-5 group-hover:scale-110 transition-transform`}>{sec.icon}</div>
              <h3 className="font-black text-slate-900 text-lg mb-5">{sec.title}</h3>
              <ul className="space-y-3">
                {sec.articles.map(article => (
                  <li key={article} className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-[#2286BE] cursor-pointer transition-colors">
                    <ArrowRight size={14} className="shrink-0" /> {article}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </motion.div>
      </section>

      {/* FAQs */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Frequently Asked Questions</h2>
        </div>
        <div className="space-y-4">
          {faqs.map((faq, i) => <FAQItem key={i} {...faq} />)}
        </div>
      </section>

      {/* Contact Support */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-28">
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 p-12 text-center">
          <h2 className="text-3xl font-black text-slate-900 mb-4">Still need help?</h2>
          <p className="text-slate-500 font-medium mb-10">Our provider support team is available 7 days a week to assist you.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: <MessageCircle size={22} />, label: 'Live Chat', desc: 'Avg. wait < 3 min', action: 'Start Chat', color: 'bg-[#2286BE]' },
              { icon: <Mail size={22} />, label: 'Email Support', desc: 'support@locallyserve.com', action: 'Send Email', color: 'bg-slate-900' },
              { icon: <Phone size={22} />, label: 'Call Us', desc: '+880 1700-000000', action: 'Call Now', color: 'bg-emerald-600' },
            ].map(ch => (
              <div key={ch.label} className="bg-slate-50 rounded-[1.5rem] p-7 flex flex-col items-center text-center">
                <div className={`h-12 w-12 ${ch.color} text-white rounded-2xl flex items-center justify-center mb-4`}>{ch.icon}</div>
                <p className="font-black text-slate-900 mb-1">{ch.label}</p>
                <p className="text-sm font-medium text-slate-400 mb-5">{ch.desc}</p>
                <Button className={`${ch.color} hover:opacity-90 text-white font-bold rounded-xl h-11 px-6 w-full`}>{ch.action}</Button>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-2 mt-8 text-sm font-bold text-slate-400">
            <Clock size={16} /> Support hours: 8:00 AM – 10:00 PM (BST)
          </div>
        </div>
      </section>

    </div>
  );
}
