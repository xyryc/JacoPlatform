import { Metadata } from 'next';
import ProviderDashboardClient from '@/components/sections/ProviderDashboardClient';
import { BRAND } from '@/lib/constants';

export const metadata: Metadata = {
  title: `Provider Hub | ${BRAND.name} Professionals`,
  description: `Manage your home service business, track earnings, and respond to customer requests on ${BRAND.name}. Grow your local reach with Bangladesh's most trusted marketplace.`,
  robots: { index: false, follow: false },
};

export default function ProviderDashboardPage() {
  return <ProviderDashboardClient />;
}
