import { Metadata } from 'next';
import SuccessStoriesClient from '@/components/sections/SuccessStoriesClient';
import { BRAND } from '@/lib/constants';

export const metadata: Metadata = {
  title: `Success Stories | ${BRAND.name}`,
  description: `Discover how professionals across Bangladesh are building successful home service businesses with ${BRAND.name}. Read real testimonials and earnings reports.`,
};

export default function SuccessStoriesPage() {
  return <SuccessStoriesClient />;
}
