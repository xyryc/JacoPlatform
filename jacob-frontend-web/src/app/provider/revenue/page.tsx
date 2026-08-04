'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CalendarDays, DollarSign, Receipt } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useGetProviderRevenueHistoryQuery } from '@/store/services/apiSlice';

type RevenueOrder = {
  id: string;
  orderNumber?: string;
  orderName?: string;
  categoryName?: string;
  providerEarningsAmount?: number;
  platformFeeAmount?: number;
  paymentAmount?: number;
  paidAt?: string | null;
  completedAt?: string | null;
  createdAt?: string | null;
  client?: {
    name?: string;
    avatar?: string;
  };
};

const formatDate = (value?: string | null) => {
  if (!value) return 'Date unavailable';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function ProviderRevenuePage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching } = useGetProviderRevenueHistoryQuery({ page, limit: 8 });
  const orders = useMemo(() => ((data?.data?.items || []) as RevenueOrder[]).filter(Boolean), [data]);
  const pagination = data?.data?.pagination;
  const summary = data?.data?.summary;

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12 pb-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <Link href="/provider/dashboard" className="mb-4 inline-flex items-center text-sm font-black text-[#2286BE]">
              <ArrowLeft size={16} className="mr-2" /> Back to Dashboard
            </Link>
            <h1 className="text-4xl font-black tracking-tight text-slate-900">Revenue History</h1>
            <p className="mt-2 text-lg font-medium text-slate-500">Every paid order and how much you earned from it.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-white px-5 py-4 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Earnings</p>
              <p className="text-2xl font-black text-slate-900">${Number(summary?.totalEarnings || 0).toFixed(2)}</p>
            </div>
            <div className="rounded-2xl bg-white px-5 py-4 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Paid Orders</p>
              <p className="text-2xl font-black text-slate-900">{Number(summary?.paidOrders || 0)}</p>
            </div>
            <div className="rounded-2xl bg-white px-5 py-4 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fees</p>
              <p className="text-2xl font-black text-slate-900">${Number(summary?.totalPlatformFees || 0).toFixed(2)}</p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="rounded-[2rem] bg-white p-16 text-center font-bold text-slate-500 shadow-sm">Loading revenue...</div>
        ) : orders.length ? (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="border-none bg-white shadow-sm">
                <CardContent className="flex flex-col gap-5 p-6 md:flex-row md:items-center md:justify-between">
                  <div className="flex min-w-0 items-center gap-4">
                    <Avatar className="h-12 w-12 border border-slate-100">
                      {order.client?.avatar ? <AvatarImage src={order.client.avatar} alt={order.client.name || 'Client'} /> : null}
                      <AvatarFallback className="bg-slate-100 font-black text-slate-500">{order.client?.name?.[0] || 'C'}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <Link href={`/provider/orders/${order.id}`} className="font-black text-slate-900 hover:text-[#2286BE]">
                        {order.orderName || 'Service order'}
                      </Link>
                      <p className="mt-1 text-xs font-black uppercase tracking-widest text-slate-400">
                        {order.orderNumber || order.id} - {order.categoryName || 'General'}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3 text-sm font-bold text-slate-500 sm:grid-cols-3 md:min-w-[460px]">
                    <span className="flex items-center gap-2"><CalendarDays size={16} /> {formatDate(order.paidAt || order.completedAt || order.createdAt)}</span>
                    <span className="flex items-center gap-2"><Receipt size={16} /> Paid ${Number(order.paymentAmount || 0).toFixed(2)}</span>
                    <span className="flex items-center gap-2 text-[#2286BE]"><DollarSign size={16} /> Earned ${Number(order.providerEarningsAmount || 0).toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="rounded-[2rem] bg-white p-16 text-center shadow-sm">
            <h2 className="text-2xl font-black text-slate-900">No revenue yet</h2>
            <p className="mt-2 font-medium text-slate-500">Paid completed orders will show up here.</p>
          </div>
        )}
      </div>

      <div className="pointer-events-none fixed bottom-4 left-1/2 z-50 -translate-x-1/2">
        <div className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/95 px-3 py-2 shadow-xl backdrop-blur">
          <Button variant="outline" size="sm" disabled={!pagination?.hasPrevPage || isFetching} onClick={() => setPage((prev) => Math.max(1, prev - 1))} className="h-9 rounded-xl text-xs font-black uppercase tracking-widest">Prev</Button>
          <span className="text-xs font-black uppercase tracking-widest text-slate-600">{pagination?.page || page} / {pagination?.totalPages || 1}</span>
          <Button variant="outline" size="sm" disabled={!pagination?.hasNextPage || isFetching} onClick={() => setPage((prev) => prev + 1)} className="h-9 rounded-xl text-xs font-black uppercase tracking-widest">Next</Button>
        </div>
      </div>
    </div>
  );
}
