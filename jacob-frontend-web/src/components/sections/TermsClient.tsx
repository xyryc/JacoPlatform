'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { BRAND } from '@/lib/constants';

const sections = [
  {
    title: '1. Acceptance of Terms',
    content: `By accessing or using ${BRAND.name} ("the Platform"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree with any part of these Terms, you may not use the Platform. These Terms apply to all users including clients, providers, and visitors.`,
  },
  {
    title: '2. Description of Service',
    content: `${BRAND.name} is an online marketplace that connects clients seeking local services with independent service providers. We facilitate connections between parties but are not a party to any service agreement between clients and providers. Providers are independent contractors, not employees of ${BRAND.name}.`,
  },
  {
    title: '3. Account Registration',
    content: `To use certain features, you must create an account. You agree to provide accurate, current, and complete information during registration. You are responsible for maintaining the confidentiality of your credentials and for all activities that occur under your account. You must be at least 18 years old to create an account.`,
  },
  {
    title: '4. Provider Obligations',
    content: `Providers agree to: (a) provide services as described in their listings, (b) maintain all required legal licenses and certifications, (c) treat clients with professionalism and respect, (d) accurately represent their qualifications and experience, and (e) comply with all applicable laws and regulations.`,
  },
  {
    title: '5. Payment Terms',
    content: `All payments are processed through our secure payment system. Clients are charged upon booking confirmation. Providers receive payouts within 2–3 business days after job completion, minus the applicable platform commission. ${BRAND.name} reserves the right to withhold payments during dispute resolution.`,
  },
  {
    title: '6. Cancellation & Refund Policy',
    content: `Clients may cancel bookings free of charge up to 2 hours before the scheduled service time. Cancellations made within 2 hours are subject to a 50% charge. Late cancellations (< 30 min) or no-shows incur a 100% charge. Refunds are processed to the original payment method within 5–7 business days.`,
  },
  {
    title: '7. Prohibited Conduct',
    content: `You agree not to: (a) violate any laws or regulations, (b) harass, threaten, or harm other users, (c) post false or misleading information, (d) circumvent the platform by conducting transactions off-platform, (e) create multiple accounts to evade bans, or (f) interfere with the platform's security or functionality.`,
  },
  {
    title: '8. Intellectual Property',
    content: `All content on the Platform including text, graphics, logos, and software is the property of ${BRAND.name} and is protected by applicable intellectual property laws. You may not reproduce, distribute, or create derivative works without our express written permission.`,
  },
  {
    title: '9. Limitation of Liability',
    content: `${BRAND.name} is not liable for any indirect, incidental, special, or consequential damages arising from your use of the Platform. Our total liability for any claim arising out of these Terms shall not exceed the greater of $50 or the amount paid by you to ${BRAND.name} in the 3 months preceding the claim.`,
  },
  {
    title: '10. Changes to Terms',
    content: `We reserve the right to modify these Terms at any time. We will notify users of material changes via email or in-app notification. Continued use of the Platform after changes constitutes acceptance of the revised Terms. The date of the most recent revision appears at the top of this page.`,
  },
];

function Section({ title, content }: { title: string; content: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`rounded-[1.5rem] border transition-all ${open ? 'border-[#2286BE]/30 bg-white shadow-lg shadow-[#2286BE]/5' : 'border-slate-100 bg-white'}`}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between gap-4 p-7 text-left">
        <span className="font-black text-slate-900 text-lg">{title}</span>
        {open ? <ChevronUp size={20} className="text-[#2286BE] shrink-0" /> : <ChevronDown size={20} className="text-slate-400 shrink-0" />}
      </button>
      {open && <div className="px-7 pb-7"><p className="text-slate-600 font-medium leading-relaxed">{content}</p></div>}
    </div>
  );
}

export default function TermsClient() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">

      {/* Hero */}
      <section className="bg-slate-900 pt-24 pb-20 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#2286BE]/10 rounded-full translate-x-1/2 -translate-y-1/2 blur-[100px] pointer-events-none" aria-hidden="true" />
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-flex bg-[#2286BE]/20 text-[#2286BE] px-4 py-2 rounded-full font-black text-xs uppercase tracking-widest mb-6">Legal</span>
            <h1 className="text-5xl font-black text-white tracking-tight mb-4 mt-4">Terms of Service</h1>
            <p className="text-slate-400 font-medium">Last updated: March 28, 2026</p>
          </motion.div>
        </div>
      </section>

      {/* Intro */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-[#2286BE]/5 border border-[#2286BE]/20 rounded-[1.5rem] p-8 mb-10">
          <p className="text-[#2286BE] font-bold leading-relaxed">
            Please read these Terms of Service carefully before using {BRAND.name}. These Terms govern your use of our platform and represent a legally binding agreement between you and ${BRAND.name} Bangladesh Ltd.
          </p>
        </motion.div>

        <div className="space-y-4">
          {sections.map((sec, i) => (
            <motion.div key={sec.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Section {...sec} />
            </motion.div>
          ))}
        </div>

        <div className="mt-12 bg-white rounded-[1.5rem] border border-slate-100 p-8 text-center">
          <p className="text-slate-500 font-medium">Questions about our Terms? <a href="/contact" className="text-[#2286BE] font-black hover:underline">Contact our legal team</a></p>
        </div>
      </section>

    </div>
  );
}
