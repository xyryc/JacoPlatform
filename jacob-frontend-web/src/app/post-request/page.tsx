import { Metadata } from 'next';
import PostRequestClient from '@/components/sections/PostRequestClient';
import { BRAND } from '@/lib/constants';

export const metadata: Metadata = {
  title: `Post a Custom Request | ${BRAND.name}`,
  description: `Can't find the specific service you need? Post a custom request on ${BRAND.name} and get matched with top local experts in hours.`,
};

export default function PostRequestPage() {
  return <PostRequestClient />;
}
