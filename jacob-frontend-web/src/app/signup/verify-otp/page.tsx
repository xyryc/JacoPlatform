import { Metadata } from 'next';
import SignupOtpVerifyClient from '@/components/sections/SignupOtpVerifyClient';
import { BRAND } from '@/lib/constants';

export const metadata: Metadata = {
  title: `Verify OTP | ${BRAND.name}`,
  description: `Verify your ${BRAND.name} signup OTP to complete registration and continue.`,
};

export default function SignupVerifyOtpPage() {
  return <SignupOtpVerifyClient />;
}
