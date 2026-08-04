import { Metadata } from 'next';
import SignupClient from '@/components/sections/SignupClient';
import { BRAND } from '@/lib/constants';

export const metadata: Metadata = {
  title: `Create Account | ${BRAND.name}`,
  description: `Join ${BRAND.name} today. Sign up to find trusted local services or start earning as a verified professional.`,
};

export default function SignupPage() {
  return <SignupClient />;
}
