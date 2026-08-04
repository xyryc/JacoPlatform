'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useSocketNotifications } from '@/contexts/SocketContext';
import {
  useLazyGetWebsiteReviewPromptQuery,
  useRemindWebsiteReviewLaterMutation,
  useSubmitWebsiteReviewMutation,
} from '@/store/services/apiSlice';
import { toast } from 'sonner';

const getTriggerType = (role: 'client' | 'provider') =>
  role === 'provider' ? 'order_paid' : 'order_payment_completed';

export default function WebsiteReviewPrompt() {
  const { isAuthenticated, role } = useAuth();
  const { notifications } = useSocketNotifications();
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const lastHandledIdRef = useRef<string | null>(null);
  const [loadPrompt] = useLazyGetWebsiteReviewPromptQuery();
  const [submitWebsiteReview] = useSubmitWebsiteReviewMutation();
  const [remindLater] = useRemindWebsiteReviewLaterMutation();

  const promptContext = useMemo(() => (role === 'provider' ? 'provider' : 'client'), [role]);

  const checkPrompt = async () => {
    if (!isAuthenticated) return;
    try {
      const payload = await loadPrompt(promptContext, true).unwrap();
      if (payload.data?.shouldPrompt) {
        setOpen(true);
      }
    } catch {
      // keep silent for passive prompt checks
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setOpen(false);
      return;
    }
    void checkPrompt();
  }, [isAuthenticated, promptContext]);

  useEffect(() => {
    if (!notifications.length || !isAuthenticated) return;
    const latest = notifications[0] as { id?: string; data?: { notificationType?: string } };
    if (!latest?.id || latest.id === lastHandledIdRef.current) return;

    if (latest.data?.notificationType === getTriggerType(promptContext)) {
      lastHandledIdRef.current = latest.id;
      void checkPrompt();
    }
  }, [isAuthenticated, notifications, promptContext]);

  const resetForm = () => {
    setRating(0);
    setReviewText('');
  };

  const closeModal = () => {
    setOpen(false);
    resetForm();
  };

  const handleSubmit = async () => {
    if (rating < 1) {
      toast.error('Please add a rating first.');
      return;
    }

    setLoading(true);
    try {
      await submitWebsiteReview({
        context: promptContext,
        rating,
        reviewText,
      }).unwrap();
      toast.success('Thanks for reviewing the website.');
      closeModal();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Could not submit your website review.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemindLater = async () => {
    setLoading(true);
    try {
      await remindLater({ context: promptContext }).unwrap();
      toast.success('We will remind you again after your next completed order.');
      closeModal();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Could not save your reminder preference.');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[2rem] bg-white p-8 shadow-2xl">
        <div className="mb-6">
          <div className="text-[11px] font-black uppercase tracking-[0.24em] text-[#2286BE]">
            Website Review
          </div>
          <h2 className="mt-3 text-3xl font-black text-slate-900">
            How is your experience with the website?
          </h2>
          <p className="mt-3 text-sm font-medium leading-6 text-slate-500">
            Rate the platform and leave a short review. Your feedback may appear on the success stories page.
          </p>
        </div>

        <div className="mb-6 flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              className="rounded-full p-2 transition hover:bg-amber-50"
            >
              <Star
                size={28}
                className={value <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
              />
            </button>
          ))}
        </div>

        <textarea
          value={reviewText}
          onChange={(event) => setReviewText(event.target.value)}
          placeholder="Write a short review about the website..."
          className="min-h-[140px] w-full rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-medium text-slate-900 outline-none transition focus:border-[#2286BE] focus:bg-white"
        />

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={handleRemindLater}
            className="h-14 rounded-2xl border-slate-200 font-black text-slate-600"
          >
            Remind Me Later
          </Button>
          <Button
            type="button"
            disabled={loading}
            onClick={handleSubmit}
            className="h-14 rounded-2xl bg-[#2286BE] font-black text-white hover:bg-[#1b6da0]"
          >
            {loading ? 'Submitting...' : 'Submit Review'}
          </Button>
        </div>
      </div>
    </div>
  );
}
