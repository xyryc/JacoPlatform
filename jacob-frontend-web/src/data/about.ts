import { Heart, Award, Target, Globe2 } from 'lucide-react';
import React from 'react';
import { BRAND } from '@/lib/constants';

export const TEAM_MEMBERS = [
  { name: 'Arif Hossain', role: 'Co-Founder & CEO', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=256&h=256&auto=format&fit=crop', bio: 'Former engineer at Pathao. Passionate about empowering local businesses.' },
  { name: 'Nishat Jahan', role: 'Co-Founder & CPO', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=256&h=256&auto=format&fit=crop', bio: 'Built product at Shajgoj. Obsessed with designing experiences people love.' },
  { name: 'Tanvir Ahmed', role: 'CTO', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=256&h=256&auto=format&fit=crop', bio: 'ML engineer from BUET. Building the infrastructure that connects thousands.' },
  { name: 'Sadia Islam', role: 'Head of Growth', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&h=256&auto=format&fit=crop', bio: `Marketing veteran. Scaled three startups before joining ${BRAND.name}.` },
  { name: 'Raihan Kabir', role: 'Head of Operations', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=256&h=256&auto=format&fit=crop', bio: 'Ops expert ensuring every service delivery exceeds expectations.' },
  { name: 'Mim Akter', role: 'Head of Design', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=256&h=256&auto=format&fit=crop', bio: 'Award-winning UX designer crafting every pixel with intention.' },
];

export const CORE_VALUES = [
  { icon: React.createElement(Heart, { size: 24 }), color: 'bg-rose-50 text-rose-500', title: 'Community First', desc: 'We exist to uplift professionals and bring quality services to every household.' },
  { icon: React.createElement(Award, { size: 24 }), color: 'bg-amber-50 text-amber-500', title: 'Quality Always', desc: 'Every provider is vetted. Every job is covered. No compromises.' },
  { icon: React.createElement(Target, { size: 24 }), color: 'bg-blue-50 text-blue-500', title: 'Transparency', desc: 'From pricing to reviews — what you see is exactly what you get.' },
  { icon: React.createElement(Globe2, { size: 24 }), color: 'bg-green-50 text-green-500', title: 'Accessible to All', desc: 'Building a platform that works for everyone — clients and providers alike.' },
];

export const MILESTONES = [
  { year: '2023', event: `${BRAND.name} founded in Austin, TX with 50 founding providers.` },
  { year: 'Early 2024', event: 'Launched in Chattogram and Sylhet. Hit 500 providers and 10,000 bookings.' },
  { year: 'Mid 2024', event: 'Raised seed funding. Expanded to Rajshahi and launched the mobile app.' },
  { year: '2025', event: 'Crossed 5,000 providers and $2.4 million paid out to our community.' },
  { year: '2026', event: 'Expanding to 3 new cities and launching enterprise service packages.' },
];

export const STATS = [
  { val: '5,200+', label: 'Active Providers' },
  { val: '48K+', label: 'Happy Clients' },
  { val: '$2.4M', label: 'Paid Out' },
  { val: '12', label: 'Cities' },
];
