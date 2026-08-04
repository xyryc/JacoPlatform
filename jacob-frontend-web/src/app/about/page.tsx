import { Metadata } from 'next';
import AboutClient from '@/components/sections/AboutClient';
import { BRAND } from '@/lib/constants';

export const metadata: Metadata = {
  title: `About Us | ${BRAND.name}`,
  description: `Learn about ${BRAND.name}'s mission to connect neighborhoods with trusted local professionals and empower our community.`,
  openGraph: {
    title: `About ${BRAND.name} — Our Mission & Story`,
    description: `Making every neighborhood a better place to live by connecting trust with quality home services.`,
  }
};

export default function AboutPage() {
  return <AboutClient />;
}
