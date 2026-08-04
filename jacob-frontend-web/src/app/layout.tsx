import type { Metadata } from 'next';
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import StoreProvider from "@/providers/StoreProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { SocketProvider } from "@/contexts/SocketContext";
import { LocationProvider } from "@/contexts/LocationContext";
import "react-day-picker/style.css";
import "mapbox-gl/dist/mapbox-gl.css";
import { Toaster } from "sonner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { BRAND, SEO, CONTACT, SOCIAL_LINKS } from "@/lib/constants";
import WebsiteAuthGate from "@/components/auth/WebsiteAuthGate";
import WebsiteReviewPrompt from "@/components/feedback/WebsiteReviewPrompt";

export const metadata: Metadata = {
  metadataBase: new URL(SEO.siteUrl),
  title: {
    default: SEO.defaultTitle,
    template: `%s | ${BRAND.name}`,
  },
  description: SEO.defaultDescription,
  keywords: [
    "home services",
    "local professionals",
    "neighborhood services",
    "cleaning",
    "plumbing",
    "electrical",
    "home repair",
    BRAND.name,
  ],
  authors: [{ name: BRAND.name }],
  creator: BRAND.name,
  publisher: BRAND.name,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SEO.siteUrl,
    siteName: BRAND.name,
    title: SEO.defaultTitle,
    description: SEO.defaultDescription,
    images: [
      {
        url: SEO.ogImage,
        width: 1200,
        height: 630,
        alt: SEO.defaultTitle,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SEO.defaultTitle,
    description: SEO.defaultDescription,
    images: [SEO.ogImage],
    creator: SEO.twitterHandle,
  },
  alternates: {
    canonical: SEO.siteUrl,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: BRAND.name,
  description: SEO.defaultDescription,
  url: SEO.siteUrl,
  logo: `${SEO.siteUrl}${BRAND.logo}`,
  sameAs: Object.values(SOCIAL_LINKS),
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    email: CONTACT.email,
    telephone: CONTACT.phone,
    availableLanguage: "English",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased flex flex-col min-h-screen" suppressHydrationWarning>
        <ErrorBoundary>
          <StoreProvider>
            <AuthProvider>
              <SocketProvider>
                <LocationProvider>
                  <WebsiteAuthGate>
                    <Header />
                    <div className="pt-[72px] lg:pt-[88px]">
                      <main className="flex-1">{children}</main>
                    </div>
                    <Footer />
                    <WebsiteReviewPrompt />
                    <Toaster position="top-center" richColors />
                  </WebsiteAuthGate>
                </LocationProvider>
              </SocketProvider>
            </AuthProvider>
          </StoreProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
