'use client';

import React from 'react';
import { Star } from 'lucide-react';

interface ReviewFilterProps {
  selected: number;
  onChange: (rating: number) => void;
  counts: Record<number, number>;
  total: number;
}

export default function ReviewFilter({
  selected,
  onChange,
  counts,
  total,
}: ReviewFilterProps) {
  const options = [
    { value: 0, label: 'All', count: total },
    { value: 5, label: '5 Stars', count: counts[5] || 0 },
    { value: 4, label: '4 Stars', count: counts[4] || 0 },
    { value: 3, label: '3 Stars', count: counts[3] || 0 },
    { value: 2, label: '2 Stars', count: counts[2] || 0 },
    { value: 1, label: '1 Star', count: counts[1] || 0 },
  ];

  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`inline-flex items-center gap-1.5 rounded-xl border px-4 py-2 text-xs font-black uppercase tracking-widest transition-all ${
            selected === opt.value
              ? 'border-[#2286BE] bg-[#2286BE] text-white shadow-lg shadow-[#2286BE]/20'
              : 'border-slate-200 bg-white text-slate-500 hover:border-[#2286BE]/40 hover:text-[#2286BE]'
          }`}
        >
          {opt.value > 0 && (
            <span className="flex items-center gap-0.5">
              {[...Array(opt.value)].map((_, i) => (
                <Star key={i} size={10} className="fill-current" />
              ))}
            </span>
          )}
          {opt.value === 0 ? 'All' : ''}
          <span className={selected === opt.value ? 'ml-0.5 text-white/70' : 'ml-0.5 text-slate-400'}>
            ({opt.count})
          </span>
        </button>
      ))}
    </div>
  );
}
