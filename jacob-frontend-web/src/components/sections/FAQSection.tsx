'use client';

import React, { useMemo, useState } from 'react';
import { Plus, Minus, MessageCircle, ArrowRight } from 'lucide-react';
import { BRAND } from '@/lib/constants';
import { useGetFaqsQuery } from '@/store/services/apiSlice';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export default function FAQSection() {
  const { data } = useGetFaqsQuery(undefined, {
    pollingInterval: 5000,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });
  const faqs = useMemo(
    () =>
      (((data?.data || []) as FAQItem[]).filter((item) => item?.question && item?.answer).map((item, index) => ({
        id: String(item.id || index + 1),
        question: item.question,
        answer: item.answer,
      })) as FAQItem[]),
    [data]
  );
  const [openId, setOpenId] = useState<string | null>(null);

  const fallbackFaqs: FAQItem[] = [
    {
      id: '1',
      question: `What makes ${BRAND.name} different from other apps?`,
      answer: "We focus on high-quality local results. Our platform allows you to save by booking optimized time slots and choosing high-rated local professionals in your area.",
    },
    {
      id: '2',
      question: "Are the service professionals verified?",
      answer: "Yes, every professional on our platform undergoes a rigorous 5-step verification process, including background checks, skill assessments, and reference verification from previous clients.",
    },
    {
      id: '3',
      question: "How do I save on costs?",
      answer: "When you book a service, you can choose optimized time slots. Neighbors within your zip code who book at similar times help professionals save on travel, and those savings are passed to you.",
    },
    {
      id: '4',
      question: "What if I'm not satisfied with the service?",
      answer: "We offer a 100% Satisfaction Guarantee. Payment is held in secure escrow and only released to the professional once you confirm the job is done right. If there's an issue, our support team steps in immediately.",
    },
  ];

  const faqItems = faqs.length > 0 ? faqs : fallbackFaqs;

  React.useEffect(() => {
    if (!faqItems.length) {
      setOpenId(null);
      return;
    }
    setOpenId((prev) => (prev && faqItems.some((faq) => faq.id === prev) ? prev : faqItems[0].id));
  }, [faqItems]);

  const toggleAccordion = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <section className="relative w-full py-20 lg:py-24 bg-white overflow-hidden">
      {/* Background Shapes */}
      <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#2286BE]/5 rounded-full blur-[100px] pointer-events-none" aria-hidden="true" />

      <div className="relative z-10 mx-auto max-w-[900px] px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#2286BE]/10 mb-6">
             <MessageCircle size={14} className="text-[#2286BE]" />
             <span className="text-[11px] font-black uppercase text-[#2286BE] tracking-widest">Questions & Answers</span>
          </div>
          <h2 className="text-[38px] font-black text-slate-900 sm:text-[48px] leading-[1.1] tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="mt-4 text-slate-500 font-medium text-lg">
            Everything you need to know about getting the best out of {BRAND.name}.
          </p>
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-4">
          {faqItems.map((faq) => (
            <div
              key={faq.id}
              className={`rounded-[24px] border-2 transition-all duration-300 ${
                openId === faq.id 
                ? 'border-[#2286BE] bg-[#2286BE]/[0.02] shadow-xl shadow-[#2286BE]/5' 
                : 'border-slate-100 bg-white hover:border-slate-200'
              }`}
            >
              <button
                onClick={() => toggleAccordion(faq.id)}
                className="flex w-full items-center justify-between p-6 text-left"
                aria-expanded={openId === faq.id}
                aria-controls={`faq-answer-${faq.id}`}
              >
                <span className={`text-lg font-bold leading-snug tracking-tight ${openId === faq.id ? 'text-[#2286BE]' : 'text-slate-900'}`}>
                  {faq.question}
                </span>
                <div className={`shrink-0 flex h-10 w-10 items-center justify-center rounded-xl transition-all ${openId === faq.id ? 'bg-[#2286BE] text-white rotate-180' : 'bg-slate-50 text-slate-400'}`}>
                  {openId === faq.id ? <Minus size={20} strokeWidth={3} /> : <Plus size={20} strokeWidth={3} />}
                </div>
              </button>
              
              <div
                id={`faq-answer-${faq.id}`}
                className={`overflow-hidden transition-all duration-300 ease-in-out ${openId === faq.id ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0'}`}
              >
                <div className="p-6 pt-0 text-slate-500 font-medium leading-relaxed border-t border-[#2286BE]/5">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Still Have Questions CTA */}
        <div className="mt-16 p-8 rounded-[32px] bg-slate-900 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl shadow-slate-300">
           <div className="text-center md:text-left">
              <h3 className="text-[22px] font-black mb-2">Still have questions?</h3>
              <p className="text-slate-400 font-medium">We&apos;re here to help you 24/7 with any inquiries.</p>
           </div>
           <button 
              className="group inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-[#2286BE] font-black text-[15px] transition-all hover:bg-[#1b6da0] hover:scale-105 active:scale-95"
              onClick={() => window.location.href = '/contact'}
           >
              Get Help Now
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
           </button>
        </div>

      </div>
    </section>
  );
}
