'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MessageCircle, Send, CheckCircle2, Clock, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { BRAND, CONTACT } from '@/lib/constants';
import { useAuth } from '@/contexts/AuthContext';
import { getAccessToken } from '@/lib/authStorage';

const channels = [
  { icon: <MessageCircle size={24} />, color: 'bg-[#2286BE]', title: 'Live Chat', desc: 'Available 8AM-10PM BST', sub: 'Avg. wait < 3 min' },
  { icon: <Mail size={24} />, color: 'bg-emerald-500', title: 'Email', desc: CONTACT.email, sub: 'Response within 12 hrs' },
  { icon: <Phone size={24} />, color: 'bg-amber-500', title: 'Phone', desc: CONTACT.phone, sub: 'Mon-Fri, 9AM-6PM' },
];

const faqs = [
  { q: 'How quickly can I book a service?', a: 'Most clients receive a provider match within 30-60 minutes.' },
  { q: 'Is there a cancellation fee?', a: 'Free cancellation up to 2 hours before the scheduled service.' },
  { q: 'How are providers vetted?', a: 'All providers undergo identity verification, background checks, and skill assessments.' },
  { q: 'Can I request a specific provider?', a: 'Yes! You can favourite providers and request them directly for future bookings.' },
];

type ContactFormState = {
  fullName: string;
  email: string;
  subject: string;
  message: string;
};

const INITIAL_FORM: ContactFormState = {
  fullName: '',
  email: '',
  subject: '',
  message: '',
};

export default function ContactClient() {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
  const { user } = useAuth();
  const authenticatedContact = useMemo(
    () => ({
      fullName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
      email: user?.email || '',
    }),
    [user?.email, user?.firstName, user?.lastName]
  );
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<ContactFormState>(INITIAL_FORM);

  useEffect(() => {
    setForm((current) => ({
      ...current,
      fullName: authenticatedContact.fullName || current.fullName,
      email: authenticatedContact.email || current.email,
    }));
  }, [authenticatedContact.email, authenticatedContact.fullName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiBase) {
      toast.error('Support service is unavailable right now.');
      return;
    }

    setSubmitting(true);
    try {
      const token = getAccessToken();
      const response = await fetch(`${apiBase}/api/support`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(form),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || 'Failed to send support message.');
      }
      setSent(true);
      setForm({
        ...INITIAL_FORM,
        fullName: authenticatedContact.fullName,
        email: authenticatedContact.email,
      });
      toast.success("Message sent! We'll get back to you within 12 hours.");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to send support message.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <section className="relative bg-slate-900 pt-24 pb-32 overflow-hidden text-center">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#2286BE]/10 rounded-full translate-x-1/2 -translate-y-1/2 blur-[100px] pointer-events-none" aria-hidden="true" />
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-flex bg-[#2286BE]/20 text-[#2286BE] px-4 py-2 rounded-full font-black text-xs uppercase tracking-widest mb-6">Contact Us</span>
            <h1 className="text-5xl font-black text-white tracking-tight mb-4 mt-4">We&apos;d Love to Hear From You</h1>
            <p className="text-slate-400 text-lg font-medium">Questions, feedback, or just want to say hi - our team is ready.</p>
          </motion.div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 mb-20">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {channels.map((ch) => (
            <div key={ch.title} className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 p-8 text-center hover:shadow-2xl hover:shadow-[#2286BE]/10 transition-all hover:-translate-y-1">
              <div className={`h-14 w-14 ${ch.color} text-white rounded-2xl flex items-center justify-center mx-auto mb-5`}>{ch.icon}</div>
              <h3 className="font-black text-slate-900 text-xl mb-2">{ch.title}</h3>
              <p className="font-bold text-slate-700 mb-1">{ch.desc}</p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{ch.sub}</p>
            </div>
          ))}
        </motion.div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-28">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-3">
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 p-10 md:p-14">
              {sent ? (
                <div className="text-center py-16">
                  <CheckCircle2 size={64} className="text-emerald-500 mx-auto mb-6" />
                  <h3 className="text-2xl font-black text-slate-900 mb-3">Message Sent!</h3>
                  <p className="text-slate-500 font-medium">We&apos;ll get back to you at your email within 12 hours.</p>
                </div>
              ) : (
                <>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Send a Message</h2>
                  <p className="text-slate-500 font-medium mb-10">We read every message and reply within 12 hours.</p>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label htmlFor="full-name" className="text-sm font-black text-slate-900 uppercase tracking-widest block">Full Name</label>
                        <Input
                          id="full-name"
                          required
                          value={form.fullName}
                          onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
                          placeholder="Karim Ahmed"
                          className="h-14 rounded-[1.25rem] border-slate-200 focus-visible:ring-[#2286BE] font-medium"
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-black text-slate-900 uppercase tracking-widest block">Email</label>
                        <Input
                          id="email"
                          required
                          type="email"
                          value={form.email}
                          onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                          placeholder="karim@email.com"
                          className="h-14 rounded-[1.25rem] border-slate-200 focus-visible:ring-[#2286BE] font-medium"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="subject" className="text-sm font-black text-slate-900 uppercase tracking-widest block">Subject</label>
                      <Input
                        id="subject"
                        required
                        value={form.subject}
                        onChange={(event) => setForm((prev) => ({ ...prev, subject: event.target.value }))}
                        placeholder="How can we help?"
                        className="h-14 rounded-[1.25rem] border-slate-200 focus-visible:ring-[#2286BE] font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="message" className="text-sm font-black text-slate-900 uppercase tracking-widest block">Message</label>
                      <textarea
                        id="message"
                        required
                        rows={5}
                        value={form.message}
                        onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
                        placeholder="Tell us more..."
                        className="w-full border border-slate-200 rounded-[1.25rem] p-5 focus:ring-2 focus:ring-[#2286BE] focus:border-transparent outline-none transition-all resize-none font-medium text-slate-800"
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="w-full h-16 bg-[#2286BE] hover:bg-[#1b6da0] text-white font-black text-lg rounded-2xl shadow-xl shadow-[#2286BE]/20 active:scale-95 transition-all"
                    >
                      <Send size={20} className="mr-3" /> {submitting ? 'Sending...' : 'Send Message'}
                    </Button>
                  </form>
                </>
              )}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8">
              <h3 className="font-black text-slate-900 text-xl mb-6">Office Information</h3>
              <div className="space-y-5">
                {[
                  { icon: <MapPin size={18} />, label: 'Address', value: CONTACT.address },
                  { icon: <Mail size={18} />, label: 'Email', value: CONTACT.email },
                  { icon: <Phone size={18} />, label: 'Phone', value: CONTACT.phone },
                  { icon: <Clock size={18} />, label: 'Hours', value: 'Mon-Fri: 9:00 AM - 6:00 PM BST' },
                ].map((item) => (
                  <div key={item.label} className="flex gap-4">
                    <div className="h-10 w-10 bg-[#2286BE]/5 rounded-xl flex items-center justify-center text-[#2286BE] shrink-0" aria-hidden="true">{item.icon}</div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</p>
                      <p className="font-bold text-slate-700 mt-0.5">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8">
              <h3 className="font-black text-slate-900 text-xl mb-6">Quick Answers</h3>
              <div className="space-y-5">
                {faqs.map((faq) => (
                  <div key={faq.q}>
                    <p className="font-black text-slate-900 text-sm mb-1">{faq.q}</p>
                    <p className="text-slate-500 font-medium text-sm leading-relaxed">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
