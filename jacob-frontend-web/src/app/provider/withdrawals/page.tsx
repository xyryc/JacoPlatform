'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, DollarSign, Clock, CheckCircle2, AlertCircle, History, Wallet, ArrowUpRight, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useGetMyWithdrawalsQuery, useRequestWithdrawalMutation } from '@/store/services/apiSlice';
import { useSocketNotifications } from '@/contexts/SocketContext';

type WithdrawalItem = {
  id: string;
  requestedAt?: string | null;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  note?: string;
};

export default function ProviderWithdrawalsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [page, setPage] = useState(1);
  const limit = 8;
  const { notifications } = useSocketNotifications();

  const { data, isLoading, refetch } = useGetMyWithdrawalsQuery({ page, limit, status: 'all' });
  const [requestWithdrawal, { isLoading: isRequesting }] = useRequestWithdrawalMutation();

  const balance = data?.data?.balance;
  const withdrawals = useMemo(() => ((data?.data?.withdrawals || []) as WithdrawalItem[]).filter(Boolean), [data]);
  const pagination = data?.data?.pagination || {
    page: 1,
    limit,
    totalItems: 0,
    totalPages: 1,
    hasPrevPage: false,
    hasNextPage: false,
  };

  const availableBalance = Number(balance?.availableBalance || 0);
  const pendingWithdrawalAmount = Number(balance?.pendingWithdrawalAmount || 0);
  const totalEarnings = Number(balance?.totalEarnings || 0);
  const totalWithdrawn = Number(balance?.totalWithdrawn || 0);

  const latestWithdrawalNotification = useMemo(() => {
    return notifications.find((notification) => {
      const notificationType = String(notification.data?.notificationType || '');
      return (
        notificationType === 'withdrawal_request_created' ||
        notificationType === 'withdrawal_request_approved' ||
        notificationType === 'withdrawal_request_rejected' ||
        notificationType === 'withdrawal_paid'
      );
    });
  }, [notifications]);

  useEffect(() => {
    if (!latestWithdrawalNotification) return;
    void refetch();
  }, [latestWithdrawalNotification, refetch]);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount);

    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount.');
      return;
    }

    if (amount > availableBalance) {
      toast.error('Insufficient balance.');
      return;
    }

    try {
      await requestWithdrawal({ amount }).unwrap();
      setIsModalOpen(false);
      setWithdrawAmount('');
      toast.success('Withdrawal request submitted! Admin will review it shortly.');
      setPage(1);
      await refetch();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to submit withdrawal request.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/provider/dashboard" className="inline-flex items-center text-sm font-bold text-slate-400 hover:text-[#2286BE] mb-8 transition-colors group">
          <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Earnings & Withdrawals</h1>
            <p className="text-slate-500 mt-2 text-lg font-medium">Manage your payouts and financial history.</p>
          </div>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="h-14 px-8 bg-[#2286BE] hover:bg-[#1b6da0] text-white font-black rounded-2xl shadow-xl shadow-[#2286BE]/20 transition-all hover:scale-105"
          >
            <Wallet size={20} className="mr-2" /> Request Withdrawal
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="border-none shadow-xl shadow-slate-200/50 bg-white rounded-[2rem] overflow-hidden">
            <CardContent className="p-8">
              <div className="h-12 w-12 bg-[#2286BE]/10 rounded-2xl flex items-center justify-center text-[#2286BE] mb-6">
                <DollarSign size={24} />
              </div>
              <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-1">Available Balance</p>
              <h3 className="text-4xl font-black text-slate-900 tracking-tight">${availableBalance.toFixed(2)}</h3>
              <div className="mt-4 flex items-center text-xs font-bold text-green-500">
                <TrendingUp size={14} className="mr-1" /> Ready for checkout
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl shadow-slate-200/50 bg-white rounded-[2rem] overflow-hidden">
            <CardContent className="p-8">
              <div className="h-12 w-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 mb-6">
                <Clock size={24} />
              </div>
              <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-1">Pending Payouts</p>
              <h3 className="text-4xl font-black text-slate-900 tracking-tight">${pendingWithdrawalAmount.toFixed(2)}</h3>
              <div className="mt-4 flex items-center text-xs font-bold text-slate-400">Requests awaiting admin review</div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl shadow-slate-200/50 bg-white rounded-[2rem] overflow-hidden">
            <CardContent className="p-8">
              <div className="h-12 w-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-6">
                <CheckCircle2 size={24} />
              </div>
              <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-1">Total Withdrawn</p>
              <h3 className="text-4xl font-black text-slate-900 tracking-tight">${totalWithdrawn.toFixed(2)}</h3>
              <div className="mt-4 flex items-center text-xs font-bold text-slate-400">Earned ${totalEarnings.toFixed(2)} overall</div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-none shadow-xl shadow-slate-200/50 bg-white rounded-[2.5rem] overflow-hidden">
          <CardHeader className="p-10 pb-6 border-b border-slate-50">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                <History size={20} />
              </div>
              <div>
                <CardTitle className="text-2xl font-black text-slate-900">Withdrawal History</CardTitle>
                <CardDescription className="font-bold">Latest payout requests</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-10 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Transaction ID</th>
                    <th className="px-10 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Date</th>
                    <th className="px-10 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Amount</th>
                    <th className="px-10 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {isLoading ? (
                    <tr>
                      <td className="px-10 py-8 text-slate-500 font-bold" colSpan={4}>
                        Loading withdrawals...
                      </td>
                    </tr>
                  ) : withdrawals.length ? (
                    withdrawals.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-10 py-6">
                          <span className="font-black text-slate-900">{tx.id}</span>
                        </td>
                        <td className="px-10 py-6">
                          <span className="font-bold text-slate-500">{tx.requestedAt ? new Date(tx.requestedAt).toLocaleDateString() : 'N/A'}</span>
                        </td>
                        <td className="px-10 py-6">
                          <span className="text-lg font-black text-slate-900">${Number(tx.amount || 0).toFixed(2)}</span>
                        </td>
                        <td className="px-10 py-6 text-right">
                          <Badge
                            className={`rounded-xl px-4 py-1.5 font-black text-[10px] uppercase border-none tracking-widest ${
                              tx.status === 'paid'
                                ? 'bg-green-50 text-green-600'
                                : tx.status === 'rejected'
                                  ? 'bg-red-50 text-red-600'
                                  : tx.status === 'approved'
                                    ? 'bg-blue-50 text-blue-600'
                                    : 'bg-amber-50 text-amber-600'
                            }`}
                          >
                            {tx.status === 'approved' ? 'approved' : tx.status}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="px-10 py-8 text-slate-500 font-bold" colSpan={4}>
                        No withdrawal requests yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="h-28" />

        <div className="fixed bottom-8 left-1/2 z-40 -translate-x-1/2">
          <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white/95 px-3 py-2 shadow-lg backdrop-blur">
            <Button
              variant="outline"
              disabled={!pagination.hasPrevPage}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className="rounded-xl"
            >
              Previous
            </Button>
            <div className="rounded-xl bg-white px-4 py-2 text-sm font-black text-slate-700 border border-slate-200">
              {pagination.page}/{pagination.totalPages}
            </div>
            <Button
              variant="outline"
              disabled={!pagination.hasNextPage}
              onClick={() => setPage((prev) => prev + 1)}
              className="rounded-xl"
            >
              Next
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsModalOpen(false)}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-lg bg-white rounded-[3rem] shadow-2xl p-10 overflow-hidden"
              >
                <div className="text-center mb-8">
                  <div className="h-20 w-20 bg-[#2286BE]/10 rounded-[2rem] flex items-center justify-center text-[#2286BE] mx-auto mb-6">
                    <ArrowUpRight size={32} />
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 mb-2">Withdraw Funds</h2>
                  <p className="text-slate-500 font-bold">Initiate a transfer to your bank account.</p>
                </div>

                <form onSubmit={handleRequest} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Amount to Withdraw</label>
                    <div className="relative">
                      <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-400 group-focus-within:text-[#2286BE] transition-colors">$</span>
                      <Input
                        type="number"
                        step="0.01"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        placeholder="0.00"
                        className="h-20 pl-14 pr-8 rounded-[1.5rem] border-slate-100 bg-slate-50/50 focus-visible:ring-[#2286BE] font-black text-3xl placeholder:text-slate-200"
                        autoFocus
                      />
                    </div>
                    <div className="flex justify-between items-center px-1">
                      <span className="text-xs font-bold text-slate-400">Available: ${availableBalance.toFixed(2)}</span>
                      <button
                        type="button"
                        onClick={() => setWithdrawAmount(String(availableBalance.toFixed(2)))}
                        className="text-xs font-black text-[#2286BE] hover:underline"
                      >
                        Withdraw Max
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-4 flex gap-4">
                    <div className="h-10 w-10 border border-slate-200 bg-white rounded-xl flex items-center justify-center text-slate-400 shrink-0">
                      <AlertCircle size={18} />
                    </div>
                    <p className="text-xs font-bold text-slate-500 leading-relaxed">
                      Withdrawal requests are reviewed by admin. Your available balance is reduced by pending requests.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 pt-4">
                    <Button
                      type="submit"
                      disabled={isRequesting}
                      className="h-16 rounded-2xl bg-[#2286BE] hover:bg-[#1b6da0] text-white font-black text-lg shadow-xl shadow-[#2286BE]/20 transition-all active:scale-95"
                    >
                      {isRequesting ? 'Submitting Withdrawal...' : 'Confirm Withdrawal'}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setIsModalOpen(false)}
                      className="h-14 rounded-2xl text-slate-400 hover:text-slate-600 font-black"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>

                <div className="absolute top-0 right-0 w-32 h-32 bg-[#2286BE]/5 rounded-full translate-x-1/2 -translate-y-1/2 blur-2xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/5 rounded-full -translate-x-1/2 translate-y-1/2 blur-2xl pointer-events-none" />
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
