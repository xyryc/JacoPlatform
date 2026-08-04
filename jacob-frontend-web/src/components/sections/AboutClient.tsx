'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Users, ArrowRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { BRAND } from '@/lib/constants';
import { 
  TEAM_MEMBERS, 
  CORE_VALUES, 
  MILESTONES, 
  STATS 
} from '@/data/about';

export default function AboutClient() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">

      {/* Hero */}
      <section className="relative bg-slate-900 pt-24 pb-40 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#2286BE]/10 rounded-full translate-x-1/2 -translate-y-1/2 blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/5 rounded-full -translate-x-1/2 translate-y-1/2 blur-[80px]" />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-flex bg-[#2286BE]/20 text-[#2286BE] px-4 py-2 rounded-full font-black text-xs uppercase tracking-widest mb-6">Our Story</span>
            <h1 className="text-5xl md:text-6xl font-black text-white tracking-tight mb-6 mt-4">
              Making Every Neighborhood<br />a Better Place to Live
            </h1>
            <p className="text-slate-400 text-xl font-medium max-w-2xl mx-auto">
              {BRAND.name} was born from a simple belief: that skilled professionals deserve fair opportunities, and every family deserves access to trusted local services.
            </p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {STATS.map(({ val, label }) => (
              <div key={label} className="bg-white/5 border border-white/10 rounded-[1.5rem] p-6 text-center">
                <p className="text-2xl font-black text-white">{val}</p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Mission */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 mb-24">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 p-12 md:p-16 text-center">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Our Mission</p>
          <blockquote className="text-2xl md:text-3xl font-black text-slate-900 leading-normal">
            &quot;To build Bangladesh&apos;s most trusted marketplace where skilled professionals prosper and every home gets the care it deserves.&quot;
          </blockquote>
        </motion.div>
      </section>

      {/* Values */}
      <section className="bg-white py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">What We Stand For</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {CORE_VALUES.map((val, i) => (
              <motion.div key={val.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                className="bg-slate-50 rounded-[2rem] p-8 hover:shadow-xl hover:shadow-[#2286BE]/10 transition-all hover:-translate-y-1">
                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${val.color} mb-5`}>{val.icon}</div>
                <h3 className="font-black text-slate-900 text-xl mb-3">{val.title}</h3>
                <p className="text-slate-500 font-medium leading-relaxed">{val.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-28 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Our Journey</h2>
        </div>
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-200 md:left-8" />
          <div className="space-y-10">
            {MILESTONES.map((m, i) => (
              <motion.div key={m.year} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                className="flex gap-6 md:gap-10 pl-12 md:pl-20 relative">
                <div className="absolute left-2 md:left-6 top-1 h-4 w-4 bg-[#2286BE] rounded-full border-4 border-white shadow ring-1 ring-[#2286BE]/30" />
                <div>
                  <p className="text-xs font-black text-[#2286BE] uppercase tracking-widest mb-2">{m.year}</p>
                  <p className="font-medium text-slate-700 leading-relaxed">{m.event}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="bg-white py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Meet the Team</h2>
            <p className="text-slate-500 font-medium mt-4">The people building {BRAND.name} every day.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {TEAM_MEMBERS.map((member, i) => (
              <motion.div key={member.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                <div className="bg-slate-50 rounded-[2rem] p-8 text-center hover:shadow-xl hover:shadow-[#2286BE]/10 transition-all hover:-translate-y-1">
                  <Avatar className="h-20 w-20 mx-auto mb-5 border-4 border-white shadow-xl">
                    <AvatarImage src={member.avatar} alt={member.name} />
                    <AvatarFallback className="font-black text-slate-400 text-lg">{member.name[0]}</AvatarFallback>
                  </Avatar>
                  <h3 className="font-black text-slate-900 text-lg">{member.name}</h3>
                  <p className="text-sm font-bold text-[#2286BE] mb-3">{member.role}</p>
                  <p className="text-slate-500 font-medium text-sm leading-relaxed">{member.bio}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-slate-900 rounded-[3rem] p-16 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#2286BE]/20 rounded-full translate-x-1/2 -translate-y-1/2 blur-[80px] pointer-events-none" />
          <div className="relative z-10">
            <Users size={40} className="text-[#2286BE] mx-auto mb-6" />
            <h2 className="text-4xl font-black text-white mb-4">Be Part of the Movement</h2>
            <p className="text-slate-400 font-medium mb-10 max-w-lg mx-auto">Whether you&apos;re a client or a provider, {BRAND.name} is your platform.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/services">
                <Button className="h-14 px-10 bg-[#2286BE] hover:bg-[#1b6da0] text-white font-black text-base rounded-2xl">Find a Service</Button>
              </Link>
              <Link href="/join-provider">
                <Button variant="outline" className="h-14 px-10 border-white/20 text-black hover:text-white hover:bg-white/10 font-black text-base rounded-2xl">Join as Provider</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
