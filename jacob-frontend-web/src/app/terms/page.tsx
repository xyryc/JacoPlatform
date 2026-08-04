import { Metadata } from 'next';
import TermsClient from '@/components/sections/TermsClient';
import { BRAND } from '@/lib/constants';

export const metadata: Metadata = {
  title: `Terms of Service | ${BRAND.name}`,
  description: `Read the Terms of Service for ${BRAND.name}. Understand your rights and responsibilities when using our home services marketplace.`,
};

export default function TermsPage() {
  return <TermsClient />;
}
