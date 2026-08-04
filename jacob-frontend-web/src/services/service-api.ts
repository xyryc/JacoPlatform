import { BRAND } from '@/lib/constants';

/**
 * ${BRAND.name} — Mock Service API
 * 
 * This layer abstracts data fetching and provides a clean interface
 * for the UI components. In production, these would be real async 
 * calls to the backend via src/lib/api.ts.
 */

import { api } from '@/lib/api';

export interface ServiceItem {
  id: number;
  title: string;
  rating: number;
  reviews: number;
  price: number;
  location: string;
  badge: string;
  tags: string[];
  image: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
}

// Mock Data Store
const MOCK_SERVICES: ServiceItem[] = [
  { 
    id: 1, 
    title: 'Deep Home Cleaning – Full Package', 
    rating: 4.95, 
    reviews: 312, 
    price: 1200, 
    location: 'Dhaka', 
    badge: 'Top Rated', 
    tags: ['Eco-Friendly', 'Same Day'],
    image: '/service1.png'
  },
  { 
    id: 2, 
    title: 'Emergency Pipe Leak Repair', 
    rating: 4.90, 
    reviews: 204, 
    price: 500, 
    location: 'Gulshan', 
    badge: 'Verified', 
    tags: ['Emergency', '24/7'],
    image: '/service2.png'
  },
  { 
    id: 3, 
    title: 'AC Maintenance & Gas Refill', 
    rating: 4.88, 
    reviews: 143, 
    price: 1500, 
    location: 'Uttara', 
    badge: 'Top Rated', 
    tags: ['Certified', 'Premium'],
    image: '/service3.png'
  }
];

export const ServiceApi = {
  /**
   * Fetches all available services with optional filtering
   */
  async getServices(filters?: { category?: string; query?: string }): Promise<ServiceItem[]> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    let services = [...MOCK_SERVICES];
    
    if (filters?.query) {
      const q = filters.query.toLowerCase();
      services = services.filter(s => 
        s.title.toLowerCase().includes(q) || 
        s.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    
    return services;
  },

  /**
   * Fetches a single service by ID
   */
  async getServiceById(id: number): Promise<ServiceItem | null> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return MOCK_SERVICES.find(s => s.id === id) || null;
  },

};
