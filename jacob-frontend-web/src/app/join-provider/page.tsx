import { Metadata } from 'next';
import JoinProviderClient from '@/components/sections/JoinProviderClient';
import { BRAND } from '@/lib/constants';

export const metadata: Metadata = {
  title: `Join as a Provider | ${BRAND.name}`,
  description: `Become a verified professional on ${BRAND.name}. Set your own hours, reach thousands of local clients, and grow your service business today.`,
  openGraph: {
    title: `Earn More with ${BRAND.name} — Join Our Pro Community`,
    description: `The most trusted marketplace for skilled professionals in Bangladesh. Start earning today with free registration.`,
  }
};

export default function JoinProviderPage() {
  return <JoinProviderClient />;
}
