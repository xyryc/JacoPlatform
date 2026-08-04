/**
 * LocallyServe — Centralized Constants & Configuration
 *
 * Use these constants throughout the app to ensure brand consistency
 * and make it easy to update branding/contact info in one place.
 */

export const BRAND = {
  name: 'LocallyServe',
  tagline: 'You. Your Neighbors. Saving time and money on home services.',
  logo: '/logo.png',
  favicon: '/favicon.ico',
};

export const CONTACT = {
  email: 'hello@locallyserve.com',
  phone: '+1 (555) 000-0000',
  address: 'New York, NY, USA',
  supportUrl: '/contact',
};

export const SOCIAL_LINKS = {
  facebook: 'https://facebook.com/locallyserve',
  twitter: 'https://twitter.com/locallyserve',
  instagram: 'https://instagram.com/locallyserve',
  linkedin: 'https://linkedin.com/company/locallyserve',
};

export const APP_LINKS = {
  appStore: '#', // TODO: Add real App Store URL
  googlePlay: '#', // TODO: Add real Google Play URL
};

export const SEO = {
  defaultTitle: 'LocallyServe — Home Services Marketplace',
  defaultDescription: 'Find and share home services with your neighbors. Cleaning, plumbing, electrical, and more from verified local professionals.',
  ogImage: '/og-image.png',
  twitterHandle: '@LocallyServe',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://locallyserve.com',
};

export const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || '',
  timeout: 10000,
};
