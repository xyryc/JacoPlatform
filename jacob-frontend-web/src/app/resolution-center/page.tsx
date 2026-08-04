'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  MessageSquare, 
  ShieldCheck, 
  ArrowLeft,
  ChevronRight,
  User,
  HelpCircle,
  XCircle,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';

const requests = [
  {
    id: 'REQ-901',
    orderId: 'ORD-12345',
    service: 'Deep Home Cleaning',
    initiatedBy: 'Client',
    reason: 'Provider did not show up on time.',
    status: 'In Review',
    date: 'Oct 24, 2024',
    counterparty: {
      name: 'Rahim Uddin',
      avatar: '',
      role: 'Provider'
    }
  },
  {
    id: 'REQ-902',
    orderId: 'ORD-67890',
    service: 'AC Maintenance',
    initiatedBy: 'Provider',
    reason: 'Client requested out-of-scope tasks.',
    status: 'Resolved',
    date: 'Oct 15, 2024',
    counterparty: {
      name: 'Sarah Khan',
      avatar: '',
      role: 'Client'
    }
  }
];

export default function ResolutionCenterPage() {
  const [selectedRequest, setSelectedRequest] = useState(requests[0]);

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        
        <div className="flex items-center gap-4 mb-8">
           <Link href="/client/orders">
              <Button variant="ghost" size="icon" className="rounded-full bg-white border border-slate-100 shadow-sm text-slate-400">
                 <ArrowLeft size={20} />
              </Button>
           </Link>
           <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Resolution Center</h1>
              <p className="text-slate-500 font-medium">Manage disputes and cancellation requests with expert mediation.</p>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
           
           {/* Sidebar: Requests List */}
           <div className="lg:col-span-1 space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-2 mb-4">Active & Recent Cases</h3>
              {requests.map((req) => (
                <button
                  key={req.id}
                  onClick={() => setSelectedRequest(req)}
                  className={`
                    w-full text-left p-6 rounded-[2rem] border transition-all duration-300 group
                    ${selectedRequest.id === req.id 
                      ? 'bg-white border-[#2286BE] shadow-xl shadow-[#2286BE]/10' 
                      : 'bg-white border-slate-100 hover:border-[#2286BE]/30 hover:shadow-lg hover:shadow-slate-200/40'}
                  `}
                >
                  <div className="flex justify-between items-start mb-4">
                    <Badge className={`
                      border-none font-black text-[9px] uppercase px-2.5 py-1 rounded-md
                      ${req.status === 'Resolved' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}
                    `}>
                      {req.status}
                    </Badge>
                    <span className="text-[10px] font-bold text-slate-400">{req.date}</span>
                  </div>
                  <h4 className={`font-black mb-1 transition-colors ${selectedRequest.id === req.id ? 'text-[#2286BE]' : 'text-slate-900'}`}>
                    {req.service}
                  </h4>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{req.orderId}</p>
                </button>
              ))}
              
              <div className="p-8 bg-[#2286BE]/5 rounded-[2.5rem] border border-[#2286BE]/10 text-center mt-10">
                 <HelpCircle size={32} className="mx-auto mb-4 text-[#2286BE]" />
                 <h4 className="font-black text-slate-900 mb-2">Need immediate help?</h4>
                 <p className="text-sm font-medium text-slate-500 mb-6">Our support team is available 24/7 to help resolve your issues.</p>
                 <Button className="w-full bg-[#2286BE] hover:bg-[#1b6da0] font-bold rounded-xl h-11">Contact Support</Button>
              </div>
           </div>

           {/* Main View: Request Details */}
           <div className="lg:col-span-2 space-y-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedRequest.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                   {/* Summary Card */}
                   <Card className="rounded-[3rem] border-none shadow-2xl shadow-slate-200/50 overflow-hidden">
                      <div className="bg-[#2286BE] p-10 text-white relative">
                        <div className="absolute top-0 right-0 p-10 opacity-10">
                          <AlertTriangle size={120} />
                        </div>
                        <div className="relative z-10">
                          <p className="text-xs font-black uppercase tracking-[0.2em] opacity-80 mb-3">Case ID: {selectedRequest.id}</p>
                          <h2 className="text-4xl font-black mb-6">{selectedRequest.service}</h2>
                          <div className="flex flex-wrap gap-4 items-center">
                            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl text-sm font-bold">
                              <User size={16} /> 
                              Initiated by {selectedRequest.initiatedBy}
                            </div>
                            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl text-sm font-bold">
                              <ShieldCheck size={16} />
                              Secure Mediation
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <CardContent className="p-10 bg-white">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                          <div>
                             <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Dispute Reason</h4>
                             <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                                <p className="text-slate-700 font-medium italic leading-relaxed">&quot;{selectedRequest.reason}&quot;</p>
                             </div>
                          </div>
                          <div>
                             <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Counterparty Info</h4>
                             <div className="flex items-center gap-4 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                                <Avatar className="h-14 w-14 border-2 border-white">
                                   <AvatarImage src={selectedRequest.counterparty.avatar} />
                                   <AvatarFallback className="font-bold">{selectedRequest.counterparty.name[0]}</AvatarFallback>
                                </Avatar>
                                <div>
                                   <p className="font-black text-slate-900">{selectedRequest.counterparty.name}</p>
                                   <p className="text-[10px] font-bold text-[#2286BE] uppercase tracking-widest">{selectedRequest.counterparty.role}</p>
                                </div>
                             </div>
                          </div>
                        </div>

                        <div className="mt-12 pt-12 border-t border-slate-50">
                           <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-8">Resolution Timeline</h4>
                           <div className="relative space-y-8 pl-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                              <div className="relative flex gap-6">
                                 <div className="absolute left-[-32px] top-1 h-6 w-6 rounded-full bg-green-500 border-4 border-white shadow-sm flex items-center justify-center">
                                    <CheckCircle2 size={12} className="text-white" />
                                 </div>
                                 <div className="flex-1">
                                    <p className="text-sm font-black text-slate-900 mb-1">Cancellation Request Opened</p>
                                    <p className="text-xs text-slate-400 font-medium">{selectedRequest.date}</p>
                                 </div>
                              </div>
                              <div className="relative flex gap-6">
                                 <div className={`absolute left-[-32px] top-1 h-6 w-6 rounded-full border-4 border-white shadow-sm flex items-center justify-center ${selectedRequest.status === 'Resolved' ? 'bg-green-500' : 'bg-amber-400 animate-pulse'}`}>
                                    {selectedRequest.status === 'Resolved' ? <CheckCircle2 size={12} className="text-white" /> : <Clock size={12} className="text-white" />}
                                 </div>
                                 <div className="flex-1">
                                    <p className="text-sm font-black text-slate-900 mb-1">Middleman Review (In Progress)</p>
                                    <p className="text-xs text-slate-500 font-medium leading-relaxed">Agent &quot;Nabil S.&quot; is reviewing the evidence and communication history between the parties.</p>
                                 </div>
                              </div>
                              {selectedRequest.status === 'Resolved' && (
                                <div className="relative flex gap-6">
                                   <div className="absolute left-[-32px] top-1 h-6 w-6 rounded-full bg-[#2286BE] border-4 border-white shadow-sm flex items-center justify-center">
                                      <ShieldCheck size={12} className="text-white" />
                                   </div>
                                   <div className="flex-1">
                                      <p className="text-sm font-black text-[#2286BE] mb-1">Final Decision Mode: Full Refund Processed</p>
                                      <p className="text-xs text-slate-400 font-medium">Oct 16, 2024</p>
                                   </div>
                                </div>
                              )}
                           </div>
                        </div>
                      </CardContent>
                   </Card>

                   {/* Discussion Section */}
                   <div className="bg-white rounded-[3rem] border border-slate-100 p-10 shadow-sm">
                      <div className="flex items-center justify-between mb-8">
                         <h3 className="text-xl font-black text-slate-900">Expert Discussion</h3>
                         <Badge className="bg-slate-50 text-slate-400 border-none font-bold">Only you and {selectedRequest.counterparty.name} can see this</Badge>
                      </div>
                      <div className="space-y-6 mb-10">
                         <div className="flex gap-4 items-start">
                            <Avatar className="h-10 w-10 shrink-0">
                               <AvatarImage src={selectedRequest.counterparty.avatar} />
                               <AvatarFallback>P</AvatarFallback>
                            </Avatar>
                            <div className="bg-slate-50 p-6 rounded-[2rem] rounded-tl-none">
                               <p className="text-sm font-medium text-slate-700 leading-relaxed">I was delayed by heavy traffic and informed the client 20 minutes before the appointment.</p>
                            </div>
                         </div>
                         <div className="flex gap-4 items-start flex-row-reverse">
                            <Avatar className="h-10 w-10 shrink-0">
                               <AvatarImage src="" />
                               <AvatarFallback>C</AvatarFallback>
                            </Avatar>
                            <div className="bg-[#2286BE]/5 p-6 rounded-[2rem] rounded-tr-none border border-[#2286BE]/10">
                               <p className="text-sm font-medium text-[#2286BE] leading-relaxed">That is true, but I had already waited for an hour after the scheduled time.</p>
                            </div>
                         </div>
                      </div>
                      
                      <div className="flex gap-4">
                         <input 
                           placeholder="Offer a resolution or add a comment..."
                           className="flex-1 h-14 px-6 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2286BE]/20 font-medium"
                         />
                         <Button className="h-14 bg-[#2286BE] hover:bg-[#1b6da0] px-8 rounded-2xl font-bold shadow-lg shadow-[#2286BE]/10">Send</Button>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Button variant="outline" className="h-16 rounded-[1.5rem] border-red-100 text-red-500 font-black hover:bg-red-50 gap-3">
                         <XCircle size={20} /> Withdraw Request
                      </Button>
                      <Button className="h-16 rounded-[1.5rem] bg-green-500 hover:bg-green-600 font-black gap-3 shadow-xl shadow-green-500/20">
                         <CheckCircle2 size={20} /> Propose Solution
                      </Button>
                   </div>
                </motion.div>
              </AnimatePresence>
           </div>

        </div>
      </div>
    </div>
  );
}
