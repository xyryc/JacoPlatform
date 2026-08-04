'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { DollarSign, Users, Gift, Share2, ArrowRight, CheckCircle2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BRAND } from '@/lib/constants';

const tiers = [
  { name: 'Starter', referrals: '1–5', reward: '$50', perRef: 'per referral', color: 'border-slate-200 bg-white' },
  { name: 'Growth', referrals: '6–20', reward: '$85', perRef: 'per referral', color: 'border-[#2286BE] bg-[#2286BE]/5', featured: true },
  { name: 'Elite', referrals: '21+', reward: '$120', perRef: 'per referral + 2% revenue share', color: 'border-amber-300 bg-amber-50/30' },
];

const steps = [
  { icon: <Gift size={22} />, title: 'Sign Up for Free', desc: 'Register as an affiliate partner — no fees, no minimum commitment.' },
  { icon: <Share2 size={22} />, title: 'Share Your Link', desc: 'Spread your unique referral link via social, WhatsApp, or your website.' },
  { icon: <Users size={22} />, title: 'They Join & Work', desc: 'When your referrals complete their first job, your reward is triggered.' },
  { icon: <DollarSign size={22} />, title: 'Earn Commissions', desc: 'Payouts are transferred directly to your bank every 2 weeks.' },
];

const perks = [
  'No cap on earnings — the more you refer, the more you earn',
  'Real-time dashboard to track clicks, signups, and payouts',
  'Dedicated affiliate manager for Elite tier',
  'Marketing materials provided (banners, copy, graphics)',
  'Transparent reporting with weekly email digests',
  'Stack with our referral bonus for clients too',
];

export default function AffiliateClient() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">

      {/* Hero */}
      <section className="relative bg-slate-900 pt-24 pb-32 overflow-hidden text-center">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#2286BE]/10 rounded-full translate-x-1/2 -translate-y-1/2 blur-[100px]" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-400/5 rounded-full -translate-x-1/2 translate-y-1/2 blur-[80px]" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-flex bg-amber-400/20 text-amber-400 px-4 py-2 rounded-full font-black text-xs uppercase tracking-widest mb-6">Affiliate Program</span>
            <h1 className="text-5xl md:text-6xl font-black text-white tracking-tight mb-6 mt-4">
              Refer Providers.<br />Earn Passive Income.
            </h1>
            <p className="text-slate-400 text-xl font-medium max-w-2xl mx-auto mb-10">
              Join the {BRAND.name} Affiliate Program and earn up to $120 per provider referral — plus ongoing revenue share at the Elite tier.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button className="h-16 px-12 bg-[#2286BE] hover:bg-[#1b6da0] text-white font-black text-lg rounded-2xl shadow-xl shadow-[#2286BE]/20 hover:scale-105 transition-all">
                  Join the Program <ArrowRight size={20} className="ml-2" />
                </Button>
              </Link>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="mt-16 flex flex-wrap items-center justify-center gap-12">
            {[['$ 1.2M+', 'Paid to Affiliates'], ['3,400+', 'Active Affiliates'], ['$120', 'Max Reward Per Referral']].map(([val, label]) => (
              <div key={label} className="text-center">
                <p className="text-3xl font-black text-white">{val}</p>
                <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">{label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-28">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">How It Works</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <motion.div key={step.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <div className="bg-white rounded-[2rem] border border-slate-100 p-8 h-full hover:shadow-xl hover:shadow-[#2286BE]/10 transition-all hover:-translate-y-1 group">
                <div className="h-12 w-12 bg-[#2286BE]/5 rounded-2xl flex items-center justify-center text-[#2286BE] mb-5 group-hover:scale-110 transition-transform" aria-hidden="true">
                  {step.icon}
                </div>
                <p className="text-xs font-black text-slate-300 uppercase tracking-widest mb-2">Step {String(i + 1).padStart(2, '0')}</p>
                <h3 className="font-black text-slate-900 text-xl mb-3">{step.title}</h3>
                <p className="text-slate-500 font-medium leading-relaxed">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Commission Tiers */}
      <section className="bg-white py-28">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Commission Tiers</h2>
            <p className="text-slate-500 font-medium mt-4">The more you refer, the more you earn per referral on {BRAND.name}.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {tiers.map((tier, i) => (
              <motion.div key={tier.name} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}>
                <div className={`rounded-[2rem] border-2 p-8 ${tier.color} ${tier.featured ? 'scale-[1.03] shadow-2xl shadow-[#2286BE]/10' : ''} h-full transition-all`}>
                  {tier.featured && <span className="inline-flex bg-[#2286BE] text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full mb-4">Most Popular</span>}
                  <p className="font-black text-slate-400 text-sm uppercase tracking-widest mb-1">{tier.name}</p>
                  <p className="text-4xl font-black text-slate-900 mb-1">{tier.reward}</p>
                  <p className="text-sm font-bold text-slate-500 mb-2">{tier.perRef}</p>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{tier.referrals} referrals / month</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Perks */}
      <section className="py-28 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl font-black text-slate-900 tracking-tight text-center mb-16">Why Affiliates Love Us</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {perks.map((perk, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
              className="flex items-center gap-4 bg-white rounded-2xl border border-slate-100 p-5">
              <CheckCircle2 size={20} className="text-[#2286BE] shrink-0" />
              <span className="font-medium text-slate-600">{perk}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="pb-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-slate-900 rounded-[3rem] p-16 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#2286BE]/20 rounded-full translate-x-1/2 -translate-y-1/2 blur-[80px] pointer-events-none" aria-hidden="true" />
          <div className="relative z-10">
            <Zap size={40} className="text-amber-400 mx-auto mb-6" />
            <h2 className="text-4xl font-black text-white mb-4">Start Earning Today</h2>
            <p className="text-slate-400 font-medium mb-8 max-w-lg mx-auto">No approvals needed. Sign up and get your unique referral link instantly.</p>
            <div className="flex flex-col sm:flex-row max-w-md mx-auto gap-3">
              <Input placeholder="your@email.com" className="h-14 rounded-2xl bg-white/10 border-white/20 text-white placeholder:text-slate-400 font-medium" />
              <Button className="h-14 px-8 bg-[#2286BE] hover:bg-[#1b6da0] text-white font-black rounded-2xl shrink-0 shadow-lg shadow-[#2286BE]/20">Get Started</Button>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
