import React from 'react';
import { 
  Paintbrush, Wrench, Zap, Trash2, Heart, 
  Cpu, Hammer, Truck, Droplets, Scissors, ShieldCheck
} from 'lucide-react';


export interface Service {
  id: number;
  title: string;
  rating: number;
  reviews: number;
  price: number;
  location: string;
  badge: string;
  level: string;
  tags: string[];
  image: string;
}

export interface CategoryData {
  name: string;
  slug: string;
  iconName: string;
  description: string;
  color: string;
  bgGradient: string;
  services: Service[];
}

export interface CategoryCard {
  name: string;
  slug: string;
  iconName: string;
  color: string;
  count: number;
}

export const DEFAULT_CATEGORIES: CategoryCard[] = [
  { name: 'LocallyServe Pro', slug: 'locallyserve-pro', iconName: 'ShieldCheck', color: 'bg-indigo-100 text-indigo-600', count: 3 },
  { name: 'Cleaning', slug: 'cleaning', iconName: 'Droplets', color: 'bg-blue-50 text-blue-500', count: 124 },
  { name: 'Plumbing', slug: 'plumbing', iconName: 'Wrench', color: 'bg-orange-50 text-orange-500', count: 86 },
  { name: 'Electrical', slug: 'electrical', iconName: 'Zap', color: 'bg-yellow-50 text-yellow-500', count: 92 },
  { name: 'Painting', slug: 'painting', iconName: 'Paintbrush', color: 'bg-pink-50 text-pink-500', count: 45 },
  { name: 'Pest Control', slug: 'pest-control', iconName: 'Trash2', color: 'bg-green-50 text-green-500', count: 38 },
  { name: 'Appliance Repair', slug: 'appliance-repair', iconName: 'Cpu', color: 'bg-indigo-50 text-indigo-500', count: 112 },
  { name: 'Carpentry', slug: 'carpentry', iconName: 'Hammer', color: 'bg-amber-50 text-amber-500', count: 64 },
  { name: 'Shipping', slug: 'shipping', iconName: 'Truck', color: 'bg-purple-50 text-purple-500', count: 57 },
  { name: 'Beauty', slug: 'beauty', iconName: 'Scissors', color: 'bg-rose-50 text-rose-500', count: 142 },
  { name: 'Personal Care', slug: 'personal-care', iconName: 'Heart', color: 'bg-red-50 text-red-500', count: 78 },
];

export const CATEGORY_MAP: Record<string, CategoryData> = {
  'locallyserve-pro': {
    name: 'LocallyServe Pro',
    slug: 'locallyserve-pro',
    iconName: 'ShieldCheck',
    description: 'Exclusive premium services provided directly by LocallyServe. Guaranteed quality, priority support, and in-house fully vetted professionals.',
    color: 'text-indigo-600',
    bgGradient: 'from-indigo-100 to-white',
    services: [
      { id: 101, title: 'Premium Deep Home Cleaning & Organization', rating: 5.0, reviews: 142, price: 150, location: 'Citywide', badge: 'Top Rated', level: 'Top Rated', tags: ['In-House', 'Premium', 'Guarantee'], image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80' },
      { id: 102, title: 'Complete Property Maintenance Plan', rating: 4.98, reviews: 89, price: 899, location: 'Citywide', badge: 'Verified', level: 'Level 2', tags: ['Subscription', 'All-in-one'], image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&q=80' },
      { id: 103, title: 'Luxury Move-in & Move-out Service', rating: 4.95, reviews: 56, price: 500, location: 'Citywide', badge: 'Top Rated', level: 'Top Rated', tags: ['Moving', 'VIP'], image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80' },
    ],
  },
  'cleaning': {
    name: 'Cleaning',
    slug: 'cleaning',
    iconName: 'Droplets',
    description: 'Professional home & office cleaning services from verified experts in your neighborhood.',
    color: 'text-blue-500',
    bgGradient: 'from-blue-50 to-white',
    services: [
      { id: 1, title: 'Deep Home Cleaning – Full Package', rating: 4.95, reviews: 312, price: 45, location: 'New York, NY', badge: 'Top Rated', level: 'Top Rated', tags: ['Eco-Friendly', 'Same Day'], image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&q=80' },
      { id: 2, title: 'Office Sanitization & Cleaning', rating: 4.87, reviews: 184, price: 85, location: 'Houston, TX', badge: 'Verified', level: 'Level 2', tags: ['Commercial', 'Weekly Plans'], image: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=600&q=80' },
      { id: 3, title: 'Bathroom & Kitchen Deep Clean', rating: 4.92, reviews: 227, price: 800, location: 'Uttara', badge: 'Top Rated', level: 'Top Rated', tags: ['Eco-Friendly'], image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80' },
      { id: 4, title: 'Sofa & Carpet Steam Cleaning', rating: 4.80, reviews: 96, price: 600, location: 'Gulshan', badge: 'Verified', level: 'Level 2', tags: ['Steam Clean'], image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80' },
    ],
  },
  'plumbing': {
    name: 'Plumbing',
    slug: 'plumbing',
    iconName: 'Wrench',
    description: 'Fast and reliable plumbing repairs, installations, and maintenance from certified professionals.',
    color: 'text-orange-500',
    bgGradient: 'from-orange-50 to-white',
    services: [
      { id: 1, title: 'Emergency Pipe Leak Repair', rating: 4.90, reviews: 204, price: 35, location: 'Austin, TX', badge: 'Top Rated', level: 'Top Rated', tags: ['Emergency', '24/7'], image: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=600&q=80' },
      { id: 2, title: 'Bathroom Fixture Installation', rating: 4.82, reviews: 137, price: 900, location: 'Gulshan', badge: 'Verified', level: 'Level 2', tags: ['Installation'], image: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&q=80' },
      { id: 3, title: 'Drain Unclogging Service', rating: 4.78, reviews: 89, price: 400, location: 'Uttara', badge: 'Verified', level: 'Level 2', tags: ['Same Day'], image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&q=80' },
    ],
  },
  'electrical': {
    name: 'Electrical',
    slug: 'electrical',
    iconName: 'Zap',
    description: 'Certified electricians for safe wiring, installations, repairs, and panel upgrades.',
    color: 'text-yellow-500',
    bgGradient: 'from-yellow-50 to-white',
    services: [
      { id: 1, title: 'Electrical Wiring & Rewiring', rating: 4.93, reviews: 178, price: 75, location: 'Miami, FL', badge: 'Top Rated', level: 'Top Rated', tags: ['Certified', 'Safe'], image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&q=80' },
      { id: 2, title: 'Fan & Light Installation', rating: 4.85, reviews: 301, price: 300, location: 'Gulshan', badge: 'Verified', level: 'Level 2', tags: ['Quick Fix'], image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80' },
    ],
  },
  'painting': {
    name: 'Painting',
    slug: 'painting',
    iconName: 'Paintbrush',
    description: 'Interior and exterior painting services to transform your home with expert brush strokes.',
    color: 'text-pink-500',
    bgGradient: 'from-pink-50 to-white',
    services: [
      { id: 1, title: 'Interior Wall Painting – Full Home', rating: 4.91, reviews: 145, price: 150, location: 'Los Angeles, CA', badge: 'Top Rated', level: 'Top Rated', tags: ['Interior', 'Full Home'], image: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=600&q=80' },
      { id: 2, title: 'Exterior House Painting', rating: 4.82, reviews: 87, price: 8000, location: 'Gulshan', badge: 'Verified', level: 'Level 2', tags: ['Exterior'], image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=600&q=80' },
    ],
  },
  'pest-control': {
    name: 'Pest Control',
    slug: 'pest-control',
    iconName: 'Trash2',
    description: 'Safe, effective pest elimination and prevention treatments by certified pest control experts.',
    color: 'text-green-500',
    bgGradient: 'from-green-50 to-white',
    services: [
      { id: 1, title: 'Full Home Pest Treatment', rating: 4.88, reviews: 203, price: 65, location: 'Houston, TX', badge: 'Top Rated', level: 'Top Rated', tags: ['Safe', 'Full Home'], image: 'https://images.unsplash.com/photo-1592417817098-8fd3d9eb14a5?w=600&q=80' },
    ],
  },
  'appliance-repair': {
    name: 'Appliance Repair',
    slug: 'appliance-repair',
    iconName: 'Cpu',
    description: 'Expert repair and maintenance of all home appliances — from ACs to washing machines.',
    color: 'text-indigo-500',
    bgGradient: 'from-indigo-50 to-white',
    services: [
      { id: 1, title: 'AC Repair & Gas Refill', rating: 4.94, reviews: 387, price: 1200, location: 'Dhaka', badge: 'Top Rated', level: 'Top Rated', tags: ['AC', 'Gas Refill'], image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&q=80' },
    ],
  },
  'carpentry': {
    name: 'Carpentry',
    slug: 'carpentry',
    iconName: 'Hammer',
    description: 'Skilled carpenters for furniture repair, custom builds, and home woodwork projects.',
    color: 'text-amber-500',
    bgGradient: 'from-amber-50 to-white',
    services: [
      { id: 1, title: 'Custom Furniture Design & Build', rating: 4.96, reviews: 89, price: 8000, location: 'Dhaka', badge: 'Top Rated', level: 'Top Rated', tags: ['Custom', 'Furniture'], image: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&q=80' },
    ],
  },
  'shipping': {
    name: 'Shipping',
    slug: 'shipping',
    iconName: 'Truck',
    description: 'Safe and efficient home and office moving services with professional movers.',
    color: 'text-purple-500',
    bgGradient: 'from-purple-50 to-white',
    services: [
      { id: 1, title: 'Full Home Shipping Package', rating: 4.91, reviews: 178, price: 6000, location: 'Dhaka', badge: 'Top Rated', level: 'Top Rated', tags: ['Full Home', 'Insured'], image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80' },
    ],
  },
  'beauty': {
    name: 'Beauty',
    slug: 'beauty',
    iconName: 'Scissors',
    description: 'On-demand beauty and grooming professionals who come straight to your door.',
    color: 'text-rose-500',
    bgGradient: 'from-rose-50 to-white',
    services: [
      { id: 1, title: 'Bridal Makeup & Hair Package', rating: 4.97, reviews: 312, price: 5000, location: 'Dhaka', badge: 'Top Rated', level: 'Top Rated', tags: ['Bridal', 'Premium'], image: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=600&q=80' },
    ],
  },
  'personal-care': {
    name: 'Personal Care',
    slug: 'personal-care',
    iconName: 'Heart',
    description: 'Compassionate caregivers and personal care assistants for all ages and needs.',
    color: 'text-red-500',
    bgGradient: 'from-red-50 to-white',
    services: [
      { id: 1, title: 'Elderly Care & Companionship', rating: 4.96, reviews: 127, price: 2500, location: 'Dhaka', badge: 'Top Rated', level: 'Top Rated', tags: ['Elderly', 'Compassionate'], image: 'https://images.unsplash.com/photo-1576765608622-067973a79f53?w=600&q=80' },
    ],
  },
};

export const getIconByName = (name: string, props: any = {}) => {
  const icons: Record<string, any> = {
    Paintbrush, Wrench, Zap, Trash2, Heart, 
    Cpu, Hammer, Truck, Droplets, Scissors, ShieldCheck
  };
  const Icon = icons[name] || ShieldCheck;
  return React.createElement(Icon, props);
};
