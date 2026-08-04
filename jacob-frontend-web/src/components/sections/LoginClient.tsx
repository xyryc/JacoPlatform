'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Mail, Lock, ChevronRight, Eye, EyeOff, CheckCircle2, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { BRAND } from '@/lib/constants';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { setAuthSession } from '@/lib/authStorage';
import {
  useLoginMutation,
  useLoginWithGoogleMutation,
  useRequestForgotPasswordOtpMutation,
  useResetForgotPasswordMutation,
  useVerifyForgotPasswordOtpMutation,
} from '@/store/services/apiSlice';

type LoginView = 'login' | 'forgot-email' | 'forgot-otp' | 'new-password' | 'success';
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
      payoutVerificationStatus?: 'unverified' | 'pending' | 'verified' | 'rejected';
      payoutInfo?: {
        accountHolderName?: string;
        bankAccountNumber?: string;
        routingNumber?: string;
        bankName?: string;
        accountType?: 'checking' | 'savings' | '';
        nidFrontImageUrl?: string;
        nidBackImageUrl?: string;
        submittedAt?: string | null;
        reviewedAt?: string | null;
        rejectionReason?: string;
      };
    };
  };
};

type GoogleCredentialResponse = {
  credential?: string;
};

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: { client_id: string; callback: (response: GoogleCredentialResponse) => void }) => void;
          renderButton: (
            parent: HTMLElement,
            options: { theme?: string; size?: string; shape?: string; width?: number; text?: string }
          ) => void;
        };
      };
    };
  }
}

type ProfileResponse = {
  success: boolean;
  data?: {
    user?: LoginResponse['data'] extends { user: infer U } ? U : never;
  };
};

const extractErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === 'object' && 'data' in error) {
    const payload = (error as { data?: { message?: string } }).data;
    if (payload?.message) return payload.message;
  }
  return fallback;
};

export default function LoginClient() {
  const { login } = useAuth();
  const router = useRouter();
  const [loginMutation] = useLoginMutation();
  const [loginWithGoogleMutation] = useLoginWithGoogleMutation();
  const [requestForgotPasswordOtp] = useRequestForgotPasswordOtpMutation();
  const [verifyForgotPasswordOtp] = useVerifyForgotPasswordOtpMutation();
  const [resetForgotPassword] = useResetForgotPasswordMutation();

  const [view, setView] = useState<LoginView>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [otpValues, setOtpValues] = useState(['', '', '', '']);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const googleButtonRef = useRef<HTMLDivElement | null>(null);

  const resetForgotPasswordState = () => {
    setOtpValues(['', '', '', '']);
    setForgotEmail('');
    setNewPassword('');
    setConfirmPassword('');
    setResetToken('');
    setShowNewPass(false);
    setShowConfirmPass(false);
  };

  const fetchProfileSnapshot = async (token: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/$/, '');
    if (!baseUrl) return null;

    try {
      const response = await fetch(`${baseUrl}/api/profile/me`, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
        },
      });
      if (!response.ok) return null;
      const payload = (await response.json()) as ProfileResponse;
      return payload?.data?.user || null;
    } catch {
      return null;
    }
  };

  const storeLoginSession = useCallback(
    async (data: LoginResponse['data'], persistent: boolean) => {
      if (!data) return;
      const profileSnapshot = await fetchProfileSnapshot(data.accessToken);
      const userSnapshot = profileSnapshot || data.user;
      const normalizedRole = userSnapshot.role === 'provider' ? 'provider' : 'client';

      setAuthSession({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: userSnapshot,
        persistent,
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
        payoutVerificationStatus: userSnapshot.payoutVerificationStatus || 'unverified',
        payoutInfo: userSnapshot.payoutInfo,
      });
    },
    [login]
  );

  const handleGoogleCredential = useCallback(
    async (response: GoogleCredentialResponse) => {
      if (!response.credential) {
        toast.error('Google did not return a login token.');
        return;
      }

      if (!process.env.NEXT_PUBLIC_API_URL) {
        toast.error('Missing NEXT_PUBLIC_API_URL. Set frontend API base URL first.');
        return;
      }

      setIsLoading(true);
      try {
        const data = (await loginWithGoogleMutation({
          idToken: response.credential,
          role: 'client',
        }).unwrap()) as LoginResponse;

        if (!data?.success || !data?.data) {
          toast.error(data?.message || 'Google login failed.');
          return;
        }

        await storeLoginSession(data.data, rememberMe);
        toast.success(`Welcome to ${BRAND.name}!`);
        router.push('/');
      } catch (error) {
        toast.error(extractErrorMessage(error, 'Google login failed.'));
      } finally {
        setIsLoading(false);
      }
    },
    [loginWithGoogleMutation, rememberMe, router, storeLoginSession]
  );

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId || !googleButtonRef.current) return;

    const renderGoogleButton = () => {
      if (!window.google?.accounts?.id || !googleButtonRef.current) return;
      googleButtonRef.current.innerHTML = '';
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleCredential,
      });
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: 'outline',
        size: 'large',
        shape: 'rectangular',
        width: 260,
        text: 'continue_with',
      });
    };

    if (window.google?.accounts?.id) {
      renderGoogleButton();
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>('script[src="https://accounts.google.com/gsi/client"]');
    if (existingScript) {
      existingScript.addEventListener('load', renderGoogleButton, { once: true });
      return () => existingScript.removeEventListener('load', renderGoogleButton);
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.addEventListener('load', renderGoogleButton, { once: true });
    document.head.appendChild(script);

    return () => script.removeEventListener('load', renderGoogleButton);
  }, [handleGoogleCredential]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const loginPayload = {
      email: email.trim(),
      password,
    };

    if (!loginPayload.email || !loginPayload.password) {
      toast.error('Email and password are required.');
      return;
    }

    if (!process.env.NEXT_PUBLIC_API_URL) {
      toast.error('Missing NEXT_PUBLIC_API_URL. Set frontend API base URL first.');
      return;
    }

    setIsLoading(true);
    try {
      const data = (await loginMutation(loginPayload).unwrap()) as LoginResponse;
      if (!data?.success || !data?.data) {
        toast.error(data?.message || 'Login failed. Please try again.');
        return;
      }

      await storeLoginSession(data.data, rememberMe);
      toast.success(`Welcome back to ${BRAND.name}!`);
      router.push('/');
    } catch {
      toast.error('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otpValues];
    next[i] = val;
    setOtpValues(next);
    if (val && i < otpValues.length - 1) otpRefs.current[i + 1]?.focus();
  };

  const handleOtpKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpValues[i] && i > 0) {
      otpRefs.current[i - 1]?.focus();
    }
  };

  const handleRequestForgotPasswordOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const normalizedEmail = forgotEmail.trim().toLowerCase();

    if (!normalizedEmail) {
      toast.error('Email is required.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await requestForgotPasswordOtp({ email: normalizedEmail }).unwrap();
      if (!response?.success) {
        toast.error(response?.message || 'Could not send OTP.');
        return;
      }
      setForgotEmail(normalizedEmail);
      setOtpValues(['', '', '', '']);
      setResetToken('');
      toast.success('A 4-digit OTP has been sent to your email.');
      setView('forgot-otp');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Could not send OTP.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyForgotPasswordOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const otp = otpValues.join('');

    if (otp.length !== 4) {
      toast.error('Enter the 4-digit OTP.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await verifyForgotPasswordOtp({ email: forgotEmail, otp }).unwrap();
      if (!response?.success || !response?.data?.resetToken) {
        toast.error(response?.message || 'OTP verification failed.');
        return;
      }
      setResetToken(response.data.resetToken);
      toast.success('OTP verified. Set your new password.');
      setView('new-password');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'OTP verification failed.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const otp = otpValues.join('');

    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    if (!resetToken) {
      toast.error('Reset session expired. Verify OTP again.');
      setView('forgot-otp');
      return;
    }

    setIsLoading(true);
    try {
      const response = await resetForgotPassword({
        email: forgotEmail,
        otp,
        resetToken,
        newPassword,
        confirmPassword,
      }).unwrap();
      if (!response?.success) {
        toast.error(response?.message || 'Password reset failed.');
        return;
      }
      toast.success('Password changed successfully.');
      setView('success');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Password reset failed.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendForgotPasswordOtp = async () => {
    if (!forgotEmail) return;

    try {
      await requestForgotPasswordOtp({ email: forgotEmail }).unwrap();
      setOtpValues(['', '', '', '']);
      setResetToken('');
      toast.success('OTP resent!');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Could not resend OTP.'));
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#2286BE]/5 rounded-full blur-[120px] translate-x-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#2286BE]/5 rounded-full blur-[100px] -translate-x-1/2 translate-y-1/2 pointer-events-none" aria-hidden="true" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative z-10"
      >
        <Link href="/" className="inline-flex items-center text-slate-400 hover:text-[#2286BE] mb-8 font-black text-xs uppercase tracking-widest transition-colors group">
          <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Home
        </Link>

        <AnimatePresence mode="wait">
          {view === 'login' && (
            <motion.div key="login" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <div className="text-center mb-10">
                <Link href="/" className="inline-flex items-center gap-3 mb-6">
                  <div className="h-14 w-14 rounded-2xl bg-[#2286BE] flex items-center justify-center shadow-xl shadow-[#2286BE]/30">
                    <Image src={BRAND.logo} alt={BRAND.name} width={28} height={28} className="invert" />
                  </div>
                  <span className="text-3xl font-black text-slate-900 tracking-tight">{BRAND.name}</span>
                </Link>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-1">Welcome Back</h1>
                <p className="text-slate-500 font-medium">Log in to your {BRAND.name} account</p>
              </div>

              <form onSubmit={handleLogin} noValidate className="space-y-4">
                <div className="space-y-1.5 px-1">
                  <label htmlFor="login-email" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Email Address</label>
                  <div className="relative group">
                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#2286BE] transition-colors" />
                    <Input
                      id="login-email"
                      type="email"
                      name="email"
                      autoComplete="email"
                      placeholder="john@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-14 pl-12 rounded-2xl border-slate-100 bg-slate-50/50 focus-visible:ring-[#2286BE] font-bold text-slate-900"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5 px-1">
                  <label htmlFor="login-password" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Password</label>
                  <div className="relative group">
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#2286BE] transition-colors" />
                    <Input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      autoComplete="current-password"
                      placeholder="********"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-14 pl-12 pr-12 rounded-2xl border-slate-100 bg-slate-50/50 focus-visible:ring-[#2286BE] font-bold text-slate-900"
                      required
                      minLength={8}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between px-1">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <div
                      onClick={() => setRememberMe(!rememberMe)}
                      className={`h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer ${
                        rememberMe ? 'bg-[#2286BE] border-[#2286BE]' : 'border-slate-300 bg-white'
                      }`}
                    >
                      {rememberMe && <CheckCircle2 size={14} className="text-white" strokeWidth={3} />}
                    </div>
                    <span className="text-sm font-bold text-slate-600">Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      resetForgotPasswordState();
                      setForgotEmail(email.trim().toLowerCase());
                      setView('forgot-email');
                    }}
                    className="text-[13px] font-black text-[#2286BE] hover:underline transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>

                <Button type="submit" disabled={isLoading} aria-busy={isLoading}
                  className="w-full h-16 bg-[#2286BE] hover:bg-[#1b6da0] text-white font-black text-lg rounded-2xl shadow-xl shadow-[#2286BE]/20 mt-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60">
                  {isLoading ? 'Signing in...' : <> Sign In <ChevronRight size={20} className="ml-2" /></>}
                </Button>
              </form>

              <div className="relative my-8" role="separator">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-4 text-slate-400 font-bold tracking-widest">Or continue with</span></div>
              </div>

              <div className="flex justify-center">
                {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? (
                  <div
                    className="flex h-14 w-full rounded-2xl  items-center justify-center overflow-hidden   bg-white "
                    ref={googleButtonRef}
                  />
                ) : (
                  <Button
                    variant="outline"
                    type="button"
                    aria-label="Continue with Google"
                    onClick={() => toast.error('Set NEXT_PUBLIC_GOOGLE_CLIENT_ID first.')}
                    className="h-14 rounded-2xl  font-bold hover:bg-slate-50"
                  >
                    <Image src="https://www.google.com/favicon.ico" alt="" width={18} height={18} className="mr-2" /> Google
                  </Button>
                )}
              </div>

              <p className="text-center mt-8 text-slate-500 font-bold">
                Don&apos;t have an account? <Link href="/signup" className="text-[#2286BE] hover:underline">Join Now</Link>
              </p>
            </motion.div>
          )}

          {view === 'forgot-email' && (
            <motion.div key="forgot-email" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="text-center mb-10">
                <div className="inline-flex h-20 w-20 rounded-3xl bg-[#2286BE]/10 items-center justify-center mx-auto mb-6">
                  <Mail size={36} className="text-[#2286BE]" />
                </div>
                <h1 className="text-3xl font-black text-slate-900 mb-2">Forgot Password?</h1>
                <p className="text-slate-500 font-medium">Enter your email and we&apos;ll send a verification code.</p>
              </div>
              <form onSubmit={handleRequestForgotPasswordOtp} className="space-y-5">
                <div className="relative group">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#2286BE] transition-colors" />
                  <Input
                    type="email"
                    required
                    placeholder="your@email.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="h-14 pl-12 rounded-2xl border-slate-100 bg-slate-50/50 focus-visible:ring-[#2286BE] font-bold text-slate-900"
                  />
                </div>
                <Button type="submit" disabled={isLoading} className="w-full h-14 bg-[#2286BE] hover:bg-[#1b6da0] text-white font-black text-base rounded-2xl shadow-lg shadow-[#2286BE]/20 transition-all">
                  {isLoading ? 'Sending...' : <>Send Code <ChevronRight size={18} className="ml-2" /></>}
                </Button>
              </form>
              <button
                onClick={() => {
                  resetForgotPasswordState();
                  setView('login');
                }}
                className="w-full text-center mt-6 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
              >
                ← Back to Login
              </button>
            </motion.div>
          )}

          {view === 'forgot-otp' && (
            <motion.div key="forgot-otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="text-center mb-10">
                <div className="inline-flex h-20 w-20 rounded-3xl bg-[#2286BE]/10 items-center justify-center mx-auto mb-6">
                  <KeyRound size={36} className="text-[#2286BE]" />
                </div>
                <h1 className="text-3xl font-black text-slate-900 mb-2">Enter Code</h1>
                <p className="text-slate-500 font-medium">We sent a 4-digit code to {forgotEmail || 'your email'}.</p>
              </div>
              <form onSubmit={handleVerifyForgotPasswordOtp} className="space-y-8">
                <div className="flex gap-3 justify-center">
                  {otpValues.map((v, i) => (
                    <input
                      key={i}
                      ref={(el) => { otpRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={v}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className={`h-14 w-12 text-center text-2xl font-black rounded-2xl border-2 transition-all outline-none focus:ring-2 focus:ring-[#2286BE]/30 ${
                        v ? 'border-[#2286BE] bg-[#2286BE]/5 text-[#2286BE]' : 'border-slate-200 bg-slate-50 text-slate-900'
                      }`}
                    />
                  ))}
                </div>
                <Button type="submit" disabled={isLoading} className="w-full h-14 bg-[#2286BE] hover:bg-[#1b6da0] text-white font-black text-base rounded-2xl shadow-lg shadow-[#2286BE]/20 transition-all">
                  {isLoading ? 'Verifying...' : <>Verify Code <ChevronRight size={18} className="ml-2" /></>}
                </Button>
              </form>
              <p className="text-center mt-5 text-sm text-slate-400 font-bold">
                Didn&apos;t receive it?{' '}
                <button type="button" className="text-[#2286BE] font-black hover:underline" onClick={handleResendForgotPasswordOtp}>
                  Resend
                </button>
              </p>
              <button onClick={() => setView('forgot-email')} className="w-full text-center mt-4 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors">
                ← Back
              </button>
            </motion.div>
          )}

          {view === 'new-password' && (
            <motion.div key="new-password" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="text-center mb-10">
                <div className="inline-flex h-20 w-20 rounded-3xl bg-[#2286BE]/10 items-center justify-center mx-auto mb-6">
                  <Lock size={36} className="text-[#2286BE]" />
                </div>
                <h1 className="text-3xl font-black text-slate-900 mb-2">New Password</h1>
                <p className="text-slate-500 font-medium">Create a strong new password for your account.</p>
              </div>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="relative group">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#2286BE] transition-colors" />
                  <Input
                    type={showNewPass ? 'text' : 'password'}
                    required
                    placeholder="New password"
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-14 pl-12 pr-12 rounded-2xl border-slate-100 bg-slate-50/50 focus-visible:ring-[#2286BE] font-bold text-slate-900"
                  />
                  <button type="button" onClick={() => setShowNewPass(!showNewPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showNewPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <div className="relative group">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#2286BE] transition-colors" />
                  <Input
                    type={showConfirmPass ? 'text' : 'password'}
                    required
                    placeholder="Confirm password"
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-14 pl-12 pr-12 rounded-2xl border-slate-100 bg-slate-50/50 focus-visible:ring-[#2286BE] font-bold text-slate-900"
                  />
                  <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showConfirmPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <Button type="submit" disabled={isLoading} className="w-full h-14 bg-[#2286BE] hover:bg-[#1b6da0] text-white font-black text-base rounded-2xl shadow-lg shadow-[#2286BE]/20 mt-2 transition-all">
                  {isLoading ? 'Updating...' : <>Reset Password <ChevronRight size={18} className="ml-2" /></>}
                </Button>
              </form>
            </motion.div>
          )}

          {view === 'success' && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                className="inline-flex h-28 w-28 rounded-full bg-green-50 items-center justify-center mx-auto mb-8"
              >
                <CheckCircle2 size={56} className="text-green-500" />
              </motion.div>
              <h1 className="text-3xl font-black text-slate-900 mb-3">Password Reset!</h1>
              <p className="text-slate-500 font-medium mb-10 max-w-sm mx-auto">
                Your password has been successfully updated. You can now log in with your new password.
              </p>
              <Button
                onClick={() => {
                  resetForgotPasswordState();
                  setView('login');
                }}
                className="h-14 px-12 bg-[#2286BE] hover:bg-[#1b6da0] text-white font-black text-base rounded-2xl shadow-lg shadow-[#2286BE]/20 transition-all"
              >
                Back to Login
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
