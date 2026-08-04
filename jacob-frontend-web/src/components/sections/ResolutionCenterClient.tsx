'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, MessageSquare, Clock, CheckCircle2, ChevronRight,
  ArrowLeft, Send, FileText, Shield, Plus, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { BRAND } from '@/lib/constants';

const MOCK_CASES = [
  {
    id: 'CASE-001',
    orderId: 'ORD-2026-001',
    service: 'Expert Plumbing & Pipe Repair',
    provider: 'QuickFix Team',
    providerAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=64',
    status: 'open',
    reason: 'Service not completed as agreed',
    created: 'Mar 28, 2026',
    lastUpdate: '2 hours ago',
    messages: [
      { id: 1, from: 'support', name: 'LocallyServe Support', text: 'Thank you for opening this case. We have notified the provider and will mediate to reach a fair resolution. Please provide any supporting evidence below.', time: '10:00 AM' },
      { id: 2, from: 'me', name: 'You', text: 'The pipe was still leaking after the job. I have photos to prove it.', time: '10:15 AM' },
      { id: 3, from: 'support', name: 'LocallyServe Support', text: 'Noted. We have contacted the provider. Expect a response within 24 hours. You can upload photos using the attachment option.', time: '10:20 AM' },
    ],
  },
  {
    id: 'CASE-002',
    orderId: 'ORD-2026-002',
    service: 'Professional Deep House Cleaning',
    provider: 'Rahim Uddin',
    providerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=64',
    status: 'resolved',
    reason: 'Refund request - incomplete service',
    created: 'Mar 10, 2026',
    lastUpdate: '5 days ago',
    messages: [
      { id: 1, from: 'support', name: 'LocallyServe Support', text: 'Case resolved. A 50% refund has been issued to your original payment method. It will appear within 3-5 business days.', time: '03:00 PM' },
    ],
  },
];

const REASONS = [
  'Service not completed as agreed',
  'Provider did not show up',
  'Quality was below standard',
  'Overcharged / wrong amount',
  'Property was damaged',
  'Other issue',
];

export default function ResolutionCenterClient({ role }: { role: 'client' | 'provider' }) {
  const [selectedCase, setSelectedCase] = useState(MOCK_CASES[0]);
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [newMsg, setNewMsg] = useState('');
  const [messages, setMessages] = useState(selectedCase.messages);
  const [selectedReason, setSelectedReason] = useState('');

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim()) return;
    setMessages([...messages, {
      id: messages.length + 1,
      from: 'me',
      name: 'You',
      text: newMsg,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }]);
    setNewMsg('');
  };

  const statusColor: Record<string, string> = {
    open: 'bg-amber-50 text-amber-700',
    resolved: 'bg-green-50 text-green-700',
    pending: 'bg-blue-50 text-blue-700',
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <Link href={role === 'client' ? '/client/dashboard' : '/provider/dashboard'}
            className="inline-flex items-center gap-2 text-slate-400 hover:text-[#2286BE] font-black text-xs uppercase tracking-widest mb-6 transition-colors group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Dashboard
          </Link>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-2xl bg-red-50 flex items-center justify-center text-red-500">
                  <Shield size={20} />
                </div>
                <span className="text-xs font-black uppercase tracking-widest text-red-500">{BRAND.name} Resolution Center</span>
              </div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">Cancellations & Disputes</h1>
              <p className="text-slate-500 font-medium mt-2">We act as a neutral mediator — just like Fiverr — to resolve any order issues fairly.</p>
            </div>
            <Button onClick={() => setIsNewOpen(true)}
              className="bg-[#2286BE] hover:bg-[#1b6da0] text-white font-black px-8 h-12 rounded-2xl shadow-lg shadow-[#2286BE]/20 flex items-center gap-2">
              <Plus size={18} /> Open New Case
            </Button>
          </div>
        </motion.div>

        {/* How it works banner */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-slate-900 rounded-[2rem] p-6 md:p-8 mb-10 flex flex-col md:flex-row gap-6 md:items-center">
          <div className="text-white flex-1">
            <p className="font-black text-lg mb-1">How {BRAND.name} Mediation Works</p>
            <p className="text-slate-400 font-medium text-sm">We review evidence from both sides and make a binding decision within 72 hours.</p>
          </div>
          <div className="flex gap-6 text-center">
            {[['01', 'Open Case', 'Describe your issue'], ['02', 'Mediation', 'We review both sides'], ['03', 'Resolution', 'Fair binding decision']].map(([n, t, d]) => (
              <div key={n}>
                <p className="text-3xl font-black text-[#2286BE]/50 mb-1">{n}</p>
                <p className="text-white font-black text-sm">{t}</p>
                <p className="text-slate-500 text-xs font-medium">{d}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Cases sidebar */}
          <div className="space-y-3">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Your Cases</h2>
            {MOCK_CASES.map((c) => (
              <motion.button key={c.id} whileHover={{ x: 4 }} onClick={() => { setSelectedCase(c); setMessages(c.messages); }}
                className={`w-full text-left bg-white rounded-2xl border p-5 transition-all duration-200 ${selectedCase.id === c.id ? 'border-[#2286BE]/40 shadow-lg shadow-[#2286BE]/10' : 'border-slate-100 shadow-sm hover:shadow-md'}`}>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{c.id}</span>
                  <Badge className={`${statusColor[c.status]} border-none font-black text-[10px] uppercase px-2.5`}>{c.status}</Badge>
                </div>
                <p className="font-bold text-slate-900 text-sm line-clamp-2 mb-2">{c.service}</p>
                <div className="flex items-center gap-2">
                  <Avatar className="h-5 w-5"><AvatarImage src={c.providerAvatar} /><AvatarFallback className="text-[8px]">P</AvatarFallback></Avatar>
                  <span className="text-xs text-slate-400 font-medium">{c.provider}</span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium mt-2 flex items-center gap-1"><Clock size={10} /> {c.lastUpdate}</p>
              </motion.button>
            ))}
          </div>

          {/* Case chat + details */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[600px]">
              {/* Case header */}
              <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{selectedCase.id}</span>
                    <Badge className={`${statusColor[selectedCase.status]} border-none font-black text-[10px] uppercase`}>{selectedCase.status}</Badge>
                  </div>
                  <h3 className="font-black text-slate-900 text-lg">{selectedCase.service}</h3>
                  <p className="text-sm text-slate-500 font-medium mt-0.5">{selectedCase.reason}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Order</p>
                  <Link href={`/${role}/orders/${selectedCase.orderId}`} className="text-[#2286BE] font-black text-sm hover:underline flex items-center gap-1">
                    {selectedCase.orderId} <ChevronRight size={14} />
                  </Link>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex gap-3 ${msg.from === 'me' ? 'flex-row-reverse' : ''}`}>
                    <div className={`h-8 w-8 rounded-xl flex-shrink-0 flex items-center justify-center ${msg.from === 'support' ? 'bg-[#2286BE] text-white' : 'bg-slate-100 text-slate-500'}`}>
                      {msg.from === 'support' ? <Shield size={14} /> : <MessageSquare size={14} />}
                    </div>
                    <div className={`max-w-[70%] ${msg.from === 'me' ? 'items-end' : 'items-start'} flex flex-col`}>
                      <span className={`text-[10px] font-black uppercase tracking-widest mb-1 ${msg.from === 'support' ? 'text-[#2286BE]' : 'text-slate-400'}`}>{msg.name}</span>
                      <div className={`px-4 py-3 rounded-2xl text-sm font-medium leading-relaxed ${msg.from === 'me' ? 'bg-[#2286BE] text-white rounded-tr-sm' : 'bg-slate-50 text-slate-700 rounded-tl-sm'}`}>
                        {msg.text}
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium mt-1">{msg.time}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message input */}
              {selectedCase.status === 'open' && (
                <form onSubmit={sendMessage} className="p-4 border-t border-slate-100 flex gap-3">
                  <Input value={newMsg} onChange={(e) => setNewMsg(e.target.value)}
                    placeholder="Add more details or evidence..." className="flex-1 h-12 rounded-2xl border-slate-100 bg-slate-50 font-medium focus-visible:ring-[#2286BE]" />
                  <Button type="submit" className="h-12 px-5 bg-[#2286BE] hover:bg-[#1b6da0] text-white rounded-2xl">
                    <Send size={18} />
                  </Button>
                </form>
              )}
              {selectedCase.status === 'resolved' && (
                <div className="p-4 border-t border-slate-100 flex items-center gap-2 bg-green-50">
                  <CheckCircle2 size={18} className="text-green-600" />
                  <span className="text-sm font-bold text-green-700">This case has been resolved. No further action needed.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* New Case Modal */}
      <AnimatePresence>
        {isNewOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">Open a New Case</h2>
                  <p className="text-slate-500 font-medium text-sm mt-1">Tell us what happened. We&apos;ll mediate fairly.</p>
                </div>
                <button onClick={() => setIsNewOpen(false)} className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors"><X size={20} /></button>
              </div>

              <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); setIsNewOpen(false); }}>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Order ID</label>
                  <Input placeholder="e.g. ORD-2026-003" className="h-12 rounded-2xl border-slate-100 bg-slate-50 font-bold focus-visible:ring-[#2286BE]" required />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Reason</label>
                  <div className="grid grid-cols-2 gap-2">
                    {REASONS.map((r) => (
                      <button key={r} type="button" onClick={() => setSelectedReason(r)}
                        className={`text-left px-3 py-2.5 rounded-xl border text-xs font-bold transition-all ${selectedReason === r ? 'border-[#2286BE] bg-[#2286BE]/5 text-[#2286BE]' : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-200'}`}>
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Description</label>
                  <textarea rows={3} required placeholder="Describe the issue in detail..."
                    className="w-full rounded-2xl border border-slate-100 bg-slate-50 font-medium text-sm p-4 focus:outline-none focus:ring-2 focus:ring-[#2286BE]/30 resize-none text-slate-900" />
                </div>

                <Button type="submit" className="w-full h-14 bg-[#2286BE] hover:bg-[#1b6da0] text-white font-black text-base rounded-2xl shadow-lg shadow-[#2286BE]/20 flex items-center justify-center gap-2">
                  <FileText size={18} /> Submit Case
                </Button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
