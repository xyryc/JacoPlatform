import { Metadata } from 'next';
import PrivacyClient from '@/components/sections/PrivacyClient';
import { BRAND } from '@/lib/constants';

export const metadata: Metadata = {
  title: `Privacy Policy | ${BRAND.name}`,
  description: `Learn how ${BRAND.name} collects, uses, and protects your personal data. Your privacy and trust are our top priorities.`,
};

export default function PrivacyPage() {
  return <PrivacyClient />;
}
