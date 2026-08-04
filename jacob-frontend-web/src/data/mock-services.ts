export interface Service {
  id: string;
  title: string;
  category: string;
  subCategory: string;
  provider: {
    id: string;
    name: string;
    type: 'Solo' | 'Team' | 'Agency';
    avatar: string;
    badge?: 'Verified' | 'Top Rated' | 'New' | 'Level 1' | 'Level 2' | 'Level 3';
    level: 'New' | 'Level 1' | 'Level 2' | 'Level 3' | 'Top Rated';
    rating: number;
    completedOrders: number;
  };
  location: {
    city: string;
    lat: number;
    lng: number;
  };
  startingPrice: number;
  description: string;
  images: string[];
  requirements?: string;
  deliveryTime?: {
    basic: string;
    standard: string;
    premium: string;
  };
  travelRadius?: number;
  distance?: number; // Calculated dynamically
}

export const MOCK_SERVICES: Service[] = [
  {
    id: 'GIG-001',
    title: 'Professional Deep House Cleaning',
    category: 'Cleaning',
    subCategory: 'House Cleaning',
    provider: {
      id: 'USR-001',
      name: 'Rahim Uddin',
      type: 'Solo',
      avatar: 'https://i.pravatar.cc/150?u=a042581f4e290267041',
      badge: 'Top Rated',
      level: 'Top Rated',
      rating: 4.9,
      completedOrders: 142,
    },
    location: {
      city: 'New York, NY',
      lat: 40.7128,
      lng: -74.0060,
    },
    startingPrice: 45,
    description: 'Get your home sparkling clean with our deep cleaning package. We cover every corner, including hard-to-reach areas, ensuring a high-quality, hygienic environment for your family.',
    images: ['/service1.png', '/service2.png'],
    requirements: 'Please ensure clear access to all rooms. Access to water and a power outlet is required.',
    deliveryTime: { basic: '1 Day', standard: '2 Days', premium: '3 Days' },
    travelRadius: 25,
  },
  {
    id: 'GIG-002',
    title: 'Expert Plumbing & Pipe Repair',
    category: 'Plumbing',
    subCategory: 'Pipe Maintenance',
    provider: {
      id: 'USR-002',
      name: 'QuickFix Team',
      type: 'Team',
      avatar: 'https://i.pravatar.cc/150?u=a042581f4e290267042',
      badge: 'Verified',
      level: 'Level 2',
      rating: 4.7,
      completedOrders: 310,
    },
    location: {
      city: 'Austin, TX',
      lat: 30.2672,
      lng: -97.7431,
    },
    startingPrice: 25,
    description: 'Expert plumbers ready to handle emergency leaks, pipe repairs, and full drainage system maintenance. Fast, reliable, and equipped with industrial-grade tools.',
    images: ['/service3.png'],
    requirements: 'Clear access to the leaking area and shutting off the main water valve may be needed.',
    deliveryTime: { basic: '1 Day', standard: '1 Day', premium: '2 Days' },
    travelRadius: 15,
  },
  {
    id: 'GIG-003',
    title: 'AC Servicing & Master Cleaning',
    category: 'Electrical',
    subCategory: 'AC Servicing',
    provider: {
      id: 'USR-003',
      name: 'CoolBreeze Agency',
      type: 'Agency',
      avatar: 'https://i.pravatar.cc/150?u=a042581f4e290267043',
      badge: 'Verified',
      level: 'Level 1',
      rating: 4.5,
      completedOrders: 82,
    },
    location: {
      city: 'Miami, FL',
      lat: 25.7617,
      lng: -80.1918,
    },
    startingPrice: 35,
    description: 'Breathe clean air with our master cooling service. We provide full gas refills, filter cleaning, and system diagnostics for all major AC brands.',
    images: ['/service4.png'],
    requirements: 'Access to the outdoor unit and an indoor power source for cleaning equipment.',
    deliveryTime: { basic: '1 Day', standard: '1 Day', premium: '2 Days' },
    travelRadius: 20,
  },
  {
    id: 'GIG-004',
    title: 'At-home Bridal Makeup & Styling',
    category: 'Beauty',
    subCategory: 'Bridal Makeup',
    provider: {
      id: 'USR-004',
      name: 'Sadia Islam',
      type: 'Solo',
      avatar: 'https://i.pravatar.cc/150?u=a042581f4e290267044',
      badge: 'Top Rated',
      level: 'Top Rated',
      rating: 5.0,
      completedOrders: 43,
    },
    location: {
      city: 'Los Angeles, CA',
      lat: 34.0522,
      lng: -118.2437,
    },
    startingPrice: 150,
    description: 'Premium bridal makeup and styling delivered at your doorstep. From traditional Mehndi to modern wedding looks, our experts ensure you look your best.',
    images: ['/hero2.png'],
  },
  {
    id: 'GIG-005',
    title: 'Pest Control for Apartments & Offices',
    category: 'Pest Control',
    subCategory: 'Termite Control',
    provider: {
      id: 'USR-005',
      name: 'PestBusters Ltd.',
      type: 'Agency',
      avatar: 'https://i.pravatar.cc/150?u=a042581f4e290267045',
      badge: 'Verified',
      level: 'Level 3',
      rating: 4.8,
      completedOrders: 512,
    },
    location: {
      city: 'Houston, TX',
      lat: 29.7604,
      lng: -95.3698,
    },
    startingPrice: 65,
    description: 'Professional pest control solutions for termites, roaches, and rodents. Safe for pets and kids, ensuring a pest-free home or office environment.',
    images: ['/service1.png'],
  },
];

// Helper to calculate distance in km using Haversine formula
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  const d = R * c; // Distance in km
  return Number(d.toFixed(1));
}
