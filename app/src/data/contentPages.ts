export type ContentSection = {
  title: string;
  body: string;
};

export type ContentStat = {
  label: string;
  value: string;
};

export type ContentPage = {
  title: string;
  eyebrow: string;
  subtitle: string;
  stats?: ContentStat[];
  sections: ContentSection[];
  ctaTitle?: string;
  ctaBody?: string;
  ctaLabel?: string;
  ctaRoute?: string;
};

export const CONTENT_PAGES: Record<string, ContentPage> = {
  about: {
    title: "About Jacob",
    eyebrow: "Our Story",
    subtitle:
      "Jacob connects neighborhoods with trusted professionals and gives local providers a platform to grow with dignity.",
    stats: [
      { label: "Providers", value: "1,200+" },
      { label: "Bookings", value: "18K+" },
      { label: "Cities", value: "24" },
    ],
    sections: [
      {
        title: "Our Mission",
        body:
          "We want every client to feel safe when booking local help and every provider to feel respected when earning from their skills.",
      },
      {
        title: "What We Believe",
        body:
          "Trust, clear communication, transparent pricing, and quality service are the foundation of the Jacob experience.",
      },
      {
        title: "Why We Built This",
        body:
          "Too many households struggle to find reliable service professionals, and too many skilled providers struggle to reach the right clients. Jacob closes that gap.",
      },
    ],
    ctaTitle: "Start exploring services",
    ctaBody: "Browse categories, compare professionals, and book with confidence.",
    ctaLabel: "Browse Services",
    ctaRoute: "/services",
  },
  affiliate: {
    title: "Affiliate Program",
    eyebrow: "Grow With Us",
    subtitle:
      "Share Jacob with your audience and earn when new clients and providers join through your referrals.",
    stats: [
      { label: "Top Reward", value: "$120" },
      { label: "Partners", value: "3,400+" },
      { label: "Paid Out", value: "$1.2M+" },
    ],
    sections: [
      {
        title: "How It Works",
        body:
          "You get a referral link, promote Jacob through your audience, and earn commission when referred users complete qualified actions on the platform.",
      },
      {
        title: "Who It Is For",
        body:
          "Content creators, local community builders, agencies, bloggers, and anyone with an audience that needs home and local services.",
      },
      {
        title: "Why It Matters",
        body:
          "You help more people discover trusted services while building a recurring revenue stream around something genuinely useful.",
      },
    ],
    ctaTitle: "Ready to partner up?",
    ctaBody: "Reach out and we can help you get started with the Jacob affiliate program.",
    ctaLabel: "Contact Support",
    ctaRoute: "/(provider)/support",
  },
  joinProvider: {
    title: "Join as a Provider",
    eyebrow: "Earn With Jacob",
    subtitle:
      "Build a trusted local business, receive bookings from nearby clients, and manage everything from one dashboard.",
    stats: [
      { label: "Active Pros", value: "1,200+" },
      { label: "Monthly Jobs", value: "8.5K+" },
      { label: "Avg Response", value: "< 15m" },
    ],
    sections: [
      {
        title: "Why Providers Join",
        body:
          "Jacob helps skilled professionals get discovered faster, keep communication organized, and turn repeat clients into steady income.",
      },
      {
        title: "What You Can Manage",
        body:
          "Create services, respond to requests, track orders, chat with clients, receive reviews, and request withdrawals from one mobile workflow.",
      },
      {
        title: "How To Get Approved Faster",
        body:
          "Complete your profile, add clear service details, define your coverage area, and submit your verification details early.",
      },
    ],
    ctaTitle: "Ready to start selling?",
    ctaBody: "Create your provider account and move into setup right away.",
    ctaLabel: "Create Provider Account",
    ctaRoute: "/(auth)/provider-register",
  },
  providerHelp: {
    title: "Provider Help",
    eyebrow: "Support Center",
    subtitle:
      "Everything providers need to understand gigs, orders, payouts, profile setup, and platform best practices.",
    sections: [
      {
        title: "Setting Up Your Profile",
        body:
          "Complete your business bio, service area, payout details, and verification documents so clients can trust your profile immediately.",
      },
      {
        title: "Publishing Better Gigs",
        body:
          "Use strong titles, clear package descriptions, useful images, and accurate travel radius so the right clients can find you.",
      },
      {
        title: "Managing Orders Smoothly",
        body:
          "Respond quickly, communicate through chat, submit clear deliveries, and handle revisions professionally to build a strong rating.",
      },
      {
        title: "Withdrawals and Verification",
        body:
          "Keep your payout information up to date and submit verification early so withdrawals can be processed without delay.",
      },
    ],
    ctaTitle: "Need direct help?",
    ctaBody: "Our support team can guide you through account, payout, or order issues.",
    ctaLabel: "Open Support",
    ctaRoute: "/(provider)/support",
  },
  successStories: {
    title: "Success Stories",
    eyebrow: "Real Impact",
    subtitle:
      "Jacob helps clients solve urgent problems faster and helps providers turn their skills into steady income.",
    sections: [
      {
        title: "From Side Hustle to Full-Time",
        body:
          "Many providers begin with a single category and grow into a stable business through repeat clients, better ratings, and strong delivery habits.",
      },
      {
        title: "Faster Help for Families",
        body:
          "Clients use Jacob to find urgent cleaning, repair, and maintenance help without relying on unverified recommendations.",
      },
      {
        title: "Better Trust on Both Sides",
        body:
          "Profiles, reviews, messaging, and structured order flow reduce confusion and create a safer experience for everyone.",
      },
    ],
    ctaTitle: "See what is available near you",
    ctaBody: "Discover trusted categories and professionals in your area.",
    ctaLabel: "View Categories",
    ctaRoute: "/categories",
  },
  privacy: {
    title: "Privacy Policy",
    eyebrow: "Legal",
    subtitle:
      "We explain what data we collect, why we collect it, how it is used, and what rights you have over it.",
    sections: [
      {
        title: "Information We Collect",
        body:
          "We collect the details you provide directly, service and booking activity, and technical information needed to keep the platform secure and functional.",
      },
      {
        title: "How We Use It",
        body:
          "We use your information to operate the platform, support bookings, improve matching, process payments, send notifications, and keep users safe.",
      },
      {
        title: "Sharing and Retention",
        body:
          "We only share data when needed for service delivery, payment processing, compliance, or when you explicitly allow it. We keep records only as long as needed for service and legal purposes.",
      },
      {
        title: "Your Rights",
        body:
          "You can request access, correction, or deletion of your data, and you can contact support if you have any privacy questions.",
      },
    ],
  },
  terms: {
    title: "Terms of Service",
    eyebrow: "Legal",
    subtitle:
      "These terms explain how Jacob works, what users can expect, and the responsibilities of clients and providers on the platform.",
    sections: [
      {
        title: "Account Responsibilities",
        body:
          "Users are responsible for providing accurate information, protecting account access, and using the platform in good faith.",
      },
      {
        title: "Bookings and Payments",
        body:
          "Clients should review gig details carefully before booking. Providers should deliver according to the published package and order requirements.",
      },
      {
        title: "Platform Conduct",
        body:
          "Fraud, harassment, abuse, or attempts to misuse the platform may result in account restriction or permanent removal.",
      },
      {
        title: "Disputes and Support",
        body:
          "If something goes wrong, users should use the built-in communication and support flow so issues can be reviewed fairly.",
      },
    ],
  },
};
