import { Metadata } from 'next';
import ContactClient from '@/components/sections/ContactClient';
import { BRAND } from '@/lib/constants';

export const metadata: Metadata = {
  title: `Contact Us | ${BRAND.name}`,
  description: `Get in touch with the ${BRAND.name} team. We're here to help with any questions, feedback, or support requests regarding our home services platform.`,
  openGraph: {
    title: `Contact ${BRAND.name} — We're Here to Help`,
    description: `Questions, feedback, or support? Reach out to our team today for fast, friendly assistance.`,
  }
};

export default function ContactPage() {
  return <ContactClient />;
}
