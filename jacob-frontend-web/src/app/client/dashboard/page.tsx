import { Metadata } from 'next';
import ClientDashboardClient from '@/components/sections/ClientDashboardClient';
import { BRAND } from '@/lib/constants';

export const metadata: Metadata = {
  title: `Customer Dashboard | ${BRAND.name}`,
  description: `Manage your home service bookings, track active orders, and explore new gift categories on ${BRAND.name}.`,
  robots: { index: false, follow: false },
};

export default function ClientDashboardPage() {
  return <ClientDashboardClient />;
}
