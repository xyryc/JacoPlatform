'use client';

import React, { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { BRAND } from '@/lib/constants';
import { useAuth } from '@/contexts/AuthContext';
import { setAuthSession } from '@/lib/authStorage';
import { useLoginMutation, useVerifySignupOtpMutation } from '@/store/services/apiSlice';

type VerifyOtpResponse = {
  success: boolean;
  message: string;
  data?: LoginResponse['data'];
};

type LoginResponse = {
  success: boolean;
  message: string;
  data?: {
    accessToken: string;
    refreshToken: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      role: 'client' | 'provider' | 'superAdmin';
      avatar?: string;
      phone?: string;
      address?: string;
      preferredLanguage?: string;
      locationLat?: number | null;
      locationLng?: number | null;
      businessBio?: string;
      experienceLevel?: string;
      serviceCity?: string;
      serviceLocationLat?: number | null;
      serviceLocationLng?: number | null;
    };
  };
};

type ProfileResponse = {
  success: boolean;
  data?: {
    user?: LoginResponse['data'] extends { user: infer U } ? U : never;
  };
};

type PendingSignupAuth = {
  email: string;
  password: string;
  role: 'client' | 'provider';
  createdAt: number;
};

export default function SignupOtpVerifyClient() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [verifySignupOtpMutation] = useVerifySignupOtpMutation();
  const [loginMutation] = useLoginMutation();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchProfileSnapshot = async (token: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!baseUrl) return null;

    try {
      const response = await fetch(`${baseUrl}/api/profile/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) return null;
      const payload = (await response.json()) as ProfileResponse;
      return payload?.data?.user || null;
    } catch {
      return null;
    }
  };

  const email = useMemo(() => searchParams.get('email')?.trim() || '', [searchParams]);

  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;

    const next = [...otpDigits];
    next[index] = value;
    setOtpDigits(next);

    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email) {
      toast.error('Missing signup email. Please create account again.');
      router.push('/signup');
      return;
    }

    const otp = otpDigits.join('');
    if (otp.length !== 4) {
      toast.error('Please enter the 4-digit OTP.');
      return;
    }

    setIsSubmitting(true);

    try {
      const verifyRes = (await verifySignupOtpMutation({
        email,
        otp,
      }).unwrap()) as VerifyOtpResponse;

      if (!verifyRes?.success) {
        toast.error(verifyRes?.message || 'OTP verification failed.');
        return;
      }

      if (verifyRes.data) {
        const userSnapshot = verifyRes.data.user;
        const normalizedRole = userSnapshot.role === 'provider' ? 'provider' : 'client';
        setAuthSession({
          accessToken: verifyRes.data.accessToken,
          refreshToken: verifyRes.data.refreshToken,
          user: userSnapshot,
          persistent: true,
        });
        login({
          id: userSnapshot.id,
          firstName: userSnapshot.firstName,
          lastName: userSnapshot.lastName,
          email: userSnapshot.email,
          role: normalizedRole,
          avatar: userSnapshot.avatar,
          phone: userSnapshot.phone,
          address: userSnapshot.address,
          preferredLanguage: userSnapshot.preferredLanguage,
          locationLat: userSnapshot.locationLat ?? undefined,
          locationLng: userSnapshot.locationLng ?? undefined,
          businessBio: userSnapshot.businessBio,
          experienceLevel: userSnapshot.experienceLevel,
          serviceCity: userSnapshot.serviceCity,
          serviceLocationLat: userSnapshot.serviceLocationLat ?? undefined,
          serviceLocationLng: userSnapshot.serviceLocationLng ?? undefined,
        });
        sessionStorage.removeItem('pending_signup_auth');
        toast.success(`Signup completed. Welcome to ${BRAND.name}!`);
        router.replace('/');
        return;
      }

      let pendingAuth: PendingSignupAuth | null = null;
      if (typeof window !== 'undefined') {
        const raw = sessionStorage.getItem('pending_signup_auth');
        if (raw) {
          try {
            pendingAuth = JSON.parse(raw) as PendingSignupAuth;
          } catch {
            pendingAuth = null;
          }
        }
      }

      if (!pendingAuth || pendingAuth.email.toLowerCase() !== email.toLowerCase()) {
        toast.success('OTP verified. Please login with your credentials.');
        router.push('/login');
        return;
      }

      const loginRes = (await loginMutation({
        email: pendingAuth.email,
        password: pendingAuth.password,
      }).unwrap()) as LoginResponse;

      if (!loginRes?.success || !loginRes?.data) {
        toast.success('OTP verified. Please login to continue.');
        router.push('/login');
        return;
      }

      const profileSnapshot = await fetchProfileSnapshot(loginRes.data.accessToken);
      const userSnapshot = profileSnapshot || loginRes.data.user;
      const normalizedRole = userSnapshot.role === 'provider' ? 'provider' : 'client';
      setAuthSession({
        accessToken: loginRes.data.accessToken,
        refreshToken: loginRes.data.refreshToken,
        user: userSnapshot,
        persistent: true,
      });
      login({
        id: userSnapshot.id,
        firstName: userSnapshot.firstName,
        lastName: userSnapshot.lastName,
        email: userSnapshot.email,
        role: normalizedRole,
        avatar: userSnapshot.avatar,
        phone: userSnapshot.phone,
        address: userSnapshot.address,
        preferredLanguage: userSnapshot.preferredLanguage,
        locationLat: userSnapshot.locationLat ?? undefined,
        locationLng: userSnapshot.locationLng ?? undefined,
        businessBio: userSnapshot.businessBio,
        experienceLevel: userSnapshot.experienceLevel,
        serviceCity: userSnapshot.serviceCity,
        serviceLocationLat: userSnapshot.serviceLocationLat ?? undefined,
        serviceLocationLng: userSnapshot.serviceLocationLng ?? undefined,
      });

      sessionStorage.removeItem('pending_signup_auth');
      toast.success(`Signup completed. Welcome to ${BRAND.name}!`);
      router.replace('/');
    } catch {
      toast.error('Could not verify OTP right now. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 py-20 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-[#2286BE]/5 rounded-full blur-[140px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#2286BE]/5 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2 pointer-events-none" aria-hidden="true" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg relative z-10">
        <Link href="/signup" className="inline-flex items-center text-slate-400 hover:text-[#2286BE] mb-10 font-black text-xs uppercase tracking-widest transition-colors group">
          <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" aria-hidden="true" />
          Back to Signup
        </Link>

        <div className="mb-10 text-center">
          <div className="inline-flex h-20 w-20 rounded-3xl bg-[#2286BE]/10 items-center justify-center mx-auto mb-6">
            <KeyRound size={36} className="text-[#2286BE]" aria-hidden="true" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">Verify OTP</h1>
          <p className="text-slate-500 font-medium text-lg">
            Enter the 4-digit code sent to <span className="font-bold text-slate-700">{email || 'your email'}</span>.
          </p>
        </div>

        <div className="bg-white border border-slate-100 p-8 md:p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200/50">
          <form onSubmit={handleVerify} className="space-y-8" noValidate>
            <div className="flex justify-center gap-3">
              {otpDigits.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(index, e.target.value)}
                  onKeyDown={(e) => handleDigitKeyDown(index, e)}
                  className={`h-14 w-12 text-center text-2xl font-black rounded-2xl border-2 transition-all outline-none focus:ring-2 focus:ring-[#2286BE]/30 ${
                    digit ? 'border-[#2286BE] bg-[#2286BE]/5 text-[#2286BE]' : 'border-slate-200 bg-slate-50 text-slate-900'
                  }`}
                  aria-label={`OTP digit ${index + 1}`}
                  required
                />
              ))}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-16 bg-[#2286BE] hover:bg-[#1b6da0] text-white font-black text-lg rounded-2xl shadow-xl shadow-[#2286BE]/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isSubmitting ? 'Verifying...' : <>Verify & Continue <CheckCircle2 size={20} className="ml-2" aria-hidden="true" /></>}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
