'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  CheckCircle2, Star, TrendingUp, Users, ShieldCheck,
  DollarSign, Clock, Briefcase, ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BRAND } from '@/lib/constants';

const steps = [
  { num: '01', title: 'Create Your Profile', desc: 'Sign up, add your skills, certifications, and portfolio photos to stand out to clients.' },
  { num: '02', title: 'Set Your Services', desc: 'Define your service categories, pricing, and availability — you stay in complete control.' },
  { num: '03', title: 'Get Matched', desc: 'Our algorithm connects you with clients near you looking for exactly your expertise.' },
  { num: '04', title: 'Start Earning', desc: 'Accept jobs, deliver quality work, and receive secure payouts directly to your bank.' },
];

const perks = [
  { icon: <DollarSign size={24} />, title: 'Competitive Earnings', desc: 'Earn 85% of every completed job with clear platform commission.' },
  { icon: <ShieldCheck size={24} />, title: 'Verified Badge', desc: 'Get a Verified Pro badge after a quick background check to build client trust.' },
  { icon: <Clock size={24} />, title: 'Flexible Schedule', desc: 'Work when you want, take breaks anytime. You set your own availability.' },
  { icon: <Users size={24} />, title: 'Steady Client Flow', desc: 'Access thousands of active clients in your city searching for your service.' },
  { icon: <TrendingUp size={24} />, title: 'Grow Your Business', desc: 'Analytics, job history, and client reviews to help you level up.' },
  { icon: <Briefcase size={24} />, title: 'Insurance Coverage', desc: 'We provide up to $500 in service liability coverage per job.' },
];

const faqs = [
  { q: 'Is it free to join?', a: 'Yes! Creating your provider profile is completely free. We only take a small commission on completed jobs.' },
  { q: 'How do I get paid?', a: 'Earnings are transferred to your registered bank account within 2–3 business days after job completion.' },
  { q: 'What areas do you operate in?', a: `We currently operate across all major cities in Bangladesh including Dhaka, Chattogram, Sylhet, and Rajshahi.` },
  { q: 'Can I offer multiple services?', a: `Absolutely. You can list as many services as you're qualified to offer, each with their own pricing.` },
];

export default function JoinProviderClient() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">

      {/* Hero */}
      <section className="relative overflow-hidden bg-slate-900 pt-24 pb-32">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#2286BE]/10 rounded-full translate-x-1/2 -translate-y-1/2 blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/5 rounded-full -translate-x-1/2 translate-y-1/2 blur-[80px]" />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-flex items-center gap-2 bg-[#2286BE]/20 text-[#2286BE] px-4 py-2 rounded-full mb-6 font-black text-xs uppercase tracking-widest">
              For Partners
            </span>
            <h1 className="text-5xl md:text-6xl font-black text-white tracking-tight mb-6">
              Turn Your Skills<br /> Into a Business
            </h1>
            <p className="text-slate-400 text-xl font-medium max-w-2xl mx-auto mb-10">
              Join 5,000+ professionals earning on {BRAND.name}. Set your own hours, build your client base, and get paid fast.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button className="h-16 px-12 bg-[#2286BE] hover:bg-[#1b6da0] text-white font-black text-lg rounded-2xl shadow-xl shadow-[#2286BE]/20 hover:scale-105 transition-all">
                  Start Earning Today <ArrowRight size={20} className="ml-2" />
                </Button>
              </Link>
              <button
                onClick={() => document.getElementById('simple-process')?.scrollIntoView({ behavior: 'smooth' })}
                className="h-16 px-12 border-2 border-[#2286BE]/40 text-[#2286BE] hover:bg-[#2286BE] hover:text-white hover:border-[#2286BE] font-black text-lg rounded-2xl transition-all duration-300"
              >
                See How It Works
              </button>
            </div>
          </motion.div>
          {/* Trust badges */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-16 flex flex-wrap items-center justify-center gap-10">
            {[['$ 2.4M+', 'Paid to Providers'], ['5,200+', 'Active Providers'], ['98.2%', 'Satisfaction Rate']].map(([val, label]) => (
              <div key={label} className="text-center">
                <p className="text-3xl font-black text-white">{val}</p>
                <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">{label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section id="simple-process" className="py-28 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <span className="inline-flex bg-[#2286BE]/10 text-[#2286BE] px-4 py-2 rounded-full font-black text-xs uppercase tracking-widest mb-4">Simple Process</span>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight mt-4">Get Started in 4 Steps</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <motion.div key={step.num} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8 h-full hover:shadow-xl hover:shadow-[#2286BE]/10 transition-all hover:-translate-y-1 group">
                <span className="text-4xl font-black text-[#2286BE]/20 group-hover:text-[#2286BE]/40 transition-colors">{step.num}</span>
                <h3 className="font-black text-slate-900 text-xl mt-4 mb-3">{step.title}</h3>
                <p className="text-slate-500 font-medium leading-relaxed">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Perks */}
      <section className="bg-white py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <span className="inline-flex bg-[#2286BE]/10 text-[#2286BE] px-4 py-2 rounded-full font-black text-xs uppercase tracking-widest mb-4">Why {BRAND.name}</span>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight mt-4">Built for Professionals Like You</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {perks.map((perk, i) => (
              <motion.div key={perk.title} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.08 }}
                className="flex gap-5 p-8 rounded-[2rem] border border-slate-100 hover:border-[#2286BE]/20 hover:shadow-lg transition-all">
                <div className="h-12 w-12 shrink-0 bg-[#2286BE]/5 rounded-2xl flex items-center justify-center text-[#2286BE]" aria-hidden="true">{perk.icon}</div>
                <div>
                  <h3 className="font-black text-slate-900 mb-2">{perk.title}</h3>
                  <p className="text-slate-500 font-medium text-sm leading-relaxed">{perk.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-28 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Common Questions</h2>
        </div>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="bg-white rounded-[1.5rem] border border-slate-100 p-8">
              <h3 className="font-black text-slate-900 mb-3 flex items-center gap-3">
                <CheckCircle2 size={18} className="text-[#2286BE] shrink-0" /> {faq.q}
              </h3>
              <p className="text-slate-500 font-medium leading-relaxed pl-7">{faq.a}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="pb-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-slate-900 rounded-[3rem] p-16 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#2286BE]/20 rounded-full translate-x-1/2 -translate-y-1/2 blur-[80px] pointer-events-none" aria-hidden="true" />
          <div className="relative z-10">
            <Star size={40} className="text-amber-400 fill-amber-400 mx-auto mb-6" />
            <h2 className="text-4xl font-black text-white mb-4">Ready to Start?</h2>
            <p className="text-slate-400 font-medium mb-10 max-w-lg mx-auto">Join thousands of professionals already growing their business on {BRAND.name}.</p>
            <Link href="/signup">
              <Button className="h-16 px-14 bg-[#2286BE] hover:bg-[#1b6da0] text-white font-black text-lg rounded-2xl shadow-xl shadow-[#2286BE]/20 active:scale-95 transition-all">
                Join as Provider — It&apos;s Free
              </Button>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
