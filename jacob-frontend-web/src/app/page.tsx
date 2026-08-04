import type { Metadata } from 'next';
import { BRAND, SEO } from '@/lib/constants';
import AppDownloadSection from "@/components/sections/AppDownloadSection";
import FAQSection from "@/components/sections/FAQSection";
import HeroSection from "@/components/sections/HeroSection";
import HowItWorksSection from "@/components/sections/HowItWorksSection";
import ProfessionalsSection from "@/components/sections/ProfessionalsSection";
import ReviewsSection from "@/components/sections/ReviewsSection";
import ServicesSection from "@/components/sections/ServicesSection";

export const metadata: Metadata = {
  title: SEO.defaultTitle,
  description: SEO.defaultDescription,
  openGraph: {
    title: SEO.defaultTitle,
    description: SEO.defaultDescription,
    url: "/",
    siteName: BRAND.name,
  },
};

export default function Home() {
  return (
    <>
      <HeroSection />
      <ProfessionalsSection />
      <ServicesSection />
      <HowItWorksSection />
      <ReviewsSection />
      <FAQSection />
      <AppDownloadSection />
    </>
  );
}
