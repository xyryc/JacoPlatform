import { Metadata } from 'next';
import LoginClient from '@/components/sections/LoginClient';
import { BRAND } from '@/lib/constants';

export const metadata: Metadata = {
  title: `Log In | ${BRAND.name}`,
  description: `Access your ${BRAND.name} account to manage your bookings, browse services, or manage your professional provider profile.`,
};

export default function LoginPage() {
  return <LoginClient />;
}
