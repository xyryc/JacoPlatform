'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, Lock, UserCircle, Briefcase, Info, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { BRAND } from '@/lib/constants';
import { useRouter } from 'next/navigation';
import { useSignupMutation } from '@/store/services/apiSlice';

type SignupForm = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type SignupResponse = {
  success: boolean;
  message: string;
  data?: {
    email: string;
    otpExpiresInMinutes: number;
  };
};

export default function SignupClient() {
  const router = useRouter();
  const [signupMutation] = useSignupMutation();
  const [role, setRole] = useState<'client' | 'provider'>('client');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState<SignupForm>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (field: keyof SignupForm, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const resolveSignupErrorMessage = (error: unknown) => {
    const apiMessage =
      typeof error === 'object' && error !== null && 'data' in error
        ? (error as { data?: { message?: string } }).data?.message
        : '';

    if (typeof apiMessage === 'string' && apiMessage.toLowerCase().includes('email already')) {
      return 'Email already in use';
    }

    return 'Registration failed. Please try again or contact support.';
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const payload = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim(),
      password: formData.password,
      role,
    };

    if (!payload.firstName || !payload.lastName || !payload.email || !payload.password || !formData.confirmPassword) {
      toast.error('Please fill in all required fields.');
      return;
    }

    if (payload.password.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }

    if (!/[^\w\s]/.test(payload.password)) {
      toast.error('Password must include at least 1 special character.');
      return;
    }

    if (payload.password !== formData.confirmPassword) {
      toast.error('Password and confirm password do not match.');
      return;
    }

    if (!process.env.NEXT_PUBLIC_API_URL) {
      toast.error('Missing NEXT_PUBLIC_API_URL. Set frontend API base URL first.');
      return;
    }

    setIsLoading(true);

    try {
      const data = (await signupMutation(payload).unwrap()) as SignupResponse;
      if (!data?.success) {
        toast.error(data?.message || 'Registration failed. Please try again.');
        return;
      }

      setFormData({
        firstName: '',
        lastName: '',
        email: payload.email,
        password: '',
        confirmPassword: '',
      });

      const expiresIn = data.data?.otpExpiresInMinutes;
      toast.success(
        expiresIn
          ? `OTP sent to ${payload.email}. It expires in ${expiresIn} minutes.`
          : `OTP sent to ${payload.email}.`
      );

      if (typeof window !== 'undefined') {
        sessionStorage.setItem(
          'pending_signup_auth',
          JSON.stringify({
            email: payload.email,
            password: payload.password,
            role,
            createdAt: Date.now(),
          })
        );
      }

      router.push(`/signup/verify-otp?email=${encodeURIComponent(payload.email)}`);
    } catch (error) {
      toast.error(resolveSignupErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 py-20 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-[#2286BE]/5 rounded-full blur-[140px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#2286BE]/5 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2 pointer-events-none" aria-hidden="true" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg relative z-10"
      >
        <Link href="/" className="inline-flex items-center text-slate-400 hover:text-[#2286BE] mb-10 font-black text-xs uppercase tracking-widest transition-colors group">
          <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" aria-hidden="true" /> Home
        </Link>

        <div className="mb-10 text-center">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">Create Account</h1>
          <p className="text-slate-500 font-medium text-lg">Join {BRAND.name} and start your journey today.</p>
        </div>

        <div className="flex p-1.5 bg-slate-100 rounded-2xl mb-10" role="group" aria-label="Account type selection">
          <button
            type="button"
            onClick={() => setRole('client')}
            aria-pressed={role === 'client'}
            className={`flex-1 flex items-center justify-center gap-2 h-14 rounded-xl font-black transition-all ${role === 'client' ? 'bg-white text-[#2286BE] shadow-xl' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <UserCircle size={20} aria-hidden="true" /> I&apos;m a Client
          </button>
          <button
            type="button"
            onClick={() => setRole('provider')}
            aria-pressed={role === 'provider'}
            className={`flex-1 flex items-center justify-center gap-2 h-14 rounded-xl font-black transition-all ${role === 'provider' ? 'bg-[#2286BE] text-white shadow-xl' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Briefcase size={20} aria-hidden="true" /> I&apos;m a Provider
          </button>
        </div>

        <div className="bg-white border border-slate-100 p-8 md:p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200/50">
          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="signup-firstname" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">
                  First Name
                </label>
                <Input
                  id="signup-firstname"
                  name="firstName"
                  autoComplete="given-name"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  className="h-14 rounded-2xl border border-slate-100 bg-slate-50/50 focus-visible:ring-[#2286BE] font-bold"
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="signup-lastname" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">
                  Last Name
                </label>
                <Input
                  id="signup-lastname"
                  name="lastName"
                  autoComplete="family-name"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  className="h-14 rounded-2xl border border-slate-100 bg-slate-50/50 focus-visible:ring-[#2286BE] font-bold"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="signup-email" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">
                Email Address
              </label>
              <div className="relative group">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#2286BE] transition-colors" aria-hidden="true" />
                <Input
                  id="signup-email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="h-14 pl-12 rounded-2xl border-slate-100 bg-slate-50/50 focus-visible:ring-[#2286BE] font-bold"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="signup-password" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">
                Password
              </label>
              <div className="relative group">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#2286BE] transition-colors" aria-hidden="true" />
                <Input
                  id="signup-password"
                  name="password"
                  autoComplete="new-password"
                  placeholder="Min. 8 characters + symbol"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  type={showPassword ? 'text' : 'password'}
                  className="h-14 pl-12 pr-12 rounded-2xl border-slate-100 bg-slate-50/50 focus-visible:ring-[#2286BE] font-bold"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-[#2286BE]"
                >
                  {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="signup-confirm-password" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">
                Confirm Password
              </label>
              <div className="relative group">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#2286BE] transition-colors" aria-hidden="true" />
                <Input
                  id="signup-confirm-password"
                  name="confirmPassword"
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="h-14 pl-12 pr-12 rounded-2xl border-slate-100 bg-slate-50/50 focus-visible:ring-[#2286BE] font-bold"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-[#2286BE]"
                >
                  {showConfirmPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                </button>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <div className="mt-1">
                <Info size={16} className="text-[#2286BE]" aria-hidden="true" />
              </div>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                By creating an account, you agree to our{' '}
                <Link href="/terms" className="text-[#2286BE] font-bold hover:underline">Terms of Service</Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-[#2286BE] font-bold hover:underline">Privacy Policy</Link>.
              </p>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              aria-busy={isLoading}
              className="w-full h-16 bg-[#2286BE] hover:bg-[#1b6da0] text-white font-black text-lg rounded-2xl shadow-xl shadow-[#2286BE]/20 mt-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isLoading ? 'Creating account...' : <>Create Account <CheckCircle2 size={20} className="ml-2" aria-hidden="true" /></>}
            </Button>
          </form>
        </div>

        <p className="text-center mt-10 text-slate-500 font-bold">
          Already have an account?{' '}
          <Link href="/login" className="text-[#2286BE] hover:underline">Log In</Link>
        </p>
      </motion.div>
    </div>
  );
}
