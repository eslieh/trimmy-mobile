import type { BusinessProfile } from '../../types/discovery';

// Standalone seed data for Discovery — the app has no persisted "database"
// of businesses (onboarding's mock createBusiness calls are stateless), so
// this stands in for what a real backend's published-businesses table would
// return. Photos are seeded picsum.photos URLs (deterministic per business,
// but not real uploads).
export const MOCK_BUSINESS_PROFILES: BusinessProfile[] = [
  {
    businessId: 'biz_seed_1',
    name: 'Glow Beauty Lounge',
    description:
      'A cosy beauty lounge in the heart of Kilimani offering hair styling, coloring, and nail care in a relaxed, welcoming space.',
    categories: ['hair_salon', 'nail_salon'],
    photos: [
      'https://picsum.photos/seed/glow-beauty-1/800/600',
      'https://picsum.photos/seed/glow-beauty-2/800/600',
      'https://picsum.photos/seed/glow-beauty-3/800/600',
    ],
    rating: 4.7,
    reviewCount: 128,
    address: 'Kilimani, Nairobi',
    lat: -1.2921,
    lng: 36.7833,
    depositSummary: 'No deposit required',
    cancellationSummary: 'Free cancellation up to 24h before, 50% fee after',
    services: [
      { serviceId: 'svc_seed_1a', categoryName: 'Haircuts', name: 'Classic Haircut', durationMinutes: 45, price: { amount: 800, currency: 'KES' } },
      { serviceId: 'svc_seed_1b', categoryName: 'Haircuts', name: 'Blow Dry & Style', durationMinutes: 60, price: { amount: 1200, currency: 'KES' } },
      { serviceId: 'svc_seed_1c', categoryName: 'Nails', name: 'Gel Manicure', durationMinutes: 50, price: { amount: 1500, currency: 'KES' } },
    ],
    staff: [
      { staffId: 'staff_seed_1a', name: 'Jane Wanjiru', role: 'Senior Stylist', rating: 4.8 },
      { staffId: 'staff_seed_1b', name: 'Achieng Otieno', role: 'Nail Technician', rating: 4.6 },
    ],
    reviews: [
      { reviewId: 'rev_seed_1a', authorName: 'Amina K.', rating: 5, text: 'Amazing service, will definitely come back!', createdAt: '2026-09-10T14:00:00Z' },
      { reviewId: 'rev_seed_1b', authorName: 'Faith N.', rating: 4, text: 'Great haircut, a bit of a wait though.', createdAt: '2026-08-22T09:30:00Z' },
    ],
  },
  {
    businessId: 'biz_seed_2',
    name: 'Urban Fade Barbershop',
    description: 'Westlands’ go-to barbershop for precision fades, beard grooming, and a proper old-school cut experience.',
    categories: ['barbershop'],
    photos: [
      'https://picsum.photos/seed/urban-fade-1/800/600',
      'https://picsum.photos/seed/urban-fade-2/800/600',
    ],
    rating: 4.9,
    reviewCount: 341,
    address: 'Westlands, Nairobi',
    lat: -1.2673,
    lng: 36.8065,
    depositSummary: 'KSh 200 deposit required',
    cancellationSummary: 'Free cancellation up to 12h before, 100% fee after',
    services: [
      { serviceId: 'svc_seed_2a', categoryName: 'Cuts', name: 'Skin Fade', durationMinutes: 30, price: { amount: 500, currency: 'KES' } },
      { serviceId: 'svc_seed_2b', categoryName: 'Cuts', name: 'Beard Trim', durationMinutes: 20, price: { amount: 300, currency: 'KES' } },
      { serviceId: 'svc_seed_2c', categoryName: 'Cuts', name: 'Cut & Beard Combo', durationMinutes: 45, price: { amount: 700, currency: 'KES' } },
    ],
    staff: [
      { staffId: 'staff_seed_2a', name: 'Brian Otieno', role: 'Master Barber', rating: 4.9 },
      { staffId: 'staff_seed_2b', name: 'Kevin Maina', role: 'Barber', rating: 4.7 },
    ],
    reviews: [
      { reviewId: 'rev_seed_2a', authorName: 'Dennis O.', rating: 5, text: 'Best fade in Nairobi, hands down.', createdAt: '2026-09-15T11:00:00Z' },
      { reviewId: 'rev_seed_2b', authorName: 'Peter M.', rating: 5, text: 'Consistent quality every time.', createdAt: '2026-09-01T16:45:00Z' },
    ],
  },
  {
    businessId: 'biz_seed_3',
    name: 'Serenity Spa & Wellness',
    description: 'A tranquil escape in Karen offering full-body massage and facials designed to help you unwind and recharge.',
    categories: ['spa'],
    photos: [
      'https://picsum.photos/seed/serenity-spa-1/800/600',
      'https://picsum.photos/seed/serenity-spa-2/800/600',
    ],
    rating: 4.6,
    reviewCount: 87,
    address: 'Karen, Nairobi',
    lat: -1.3192,
    lng: 36.7076,
    depositSummary: 'KSh 1000 deposit required',
    cancellationSummary: 'Free cancellation up to 48h before, 50% fee after',
    services: [
      { serviceId: 'svc_seed_3a', categoryName: 'Massage', name: 'Full Body Massage (60min)', durationMinutes: 60, price: { amount: 3500, currency: 'KES' } },
      { serviceId: 'svc_seed_3b', categoryName: 'Facials', name: 'Deep Cleanse Facial', durationMinutes: 45, price: { amount: 2500, currency: 'KES' } },
    ],
    staff: [{ staffId: 'staff_seed_3a', name: 'Grace Muthoni', role: 'Spa Therapist', rating: 4.7 }],
    reviews: [
      { reviewId: 'rev_seed_3a', authorName: 'Linda W.', rating: 5, text: 'So relaxing, exactly what I needed.', createdAt: '2026-08-30T10:00:00Z' },
    ],
  },
  {
    businessId: 'biz_seed_4',
    name: 'Nailed It Nail Bar',
    description: 'Lavington’s favorite nail bar for classic manicures, gel pedicures, and creative nail art.',
    categories: ['nail_salon'],
    photos: [
      'https://picsum.photos/seed/nailed-it-1/800/600',
      'https://picsum.photos/seed/nailed-it-2/800/600',
    ],
    rating: 4.5,
    reviewCount: 64,
    address: 'Lavington, Nairobi',
    lat: -1.2793,
    lng: 36.7687,
    depositSummary: 'No deposit required',
    cancellationSummary: 'Free cancellation up to 24h before, 30% fee after',
    services: [
      { serviceId: 'svc_seed_4a', categoryName: 'Nails', name: 'Classic Manicure', durationMinutes: 40, price: { amount: 900, currency: 'KES' } },
      { serviceId: 'svc_seed_4b', categoryName: 'Nails', name: 'Gel Pedicure', durationMinutes: 55, price: { amount: 1800, currency: 'KES' } },
    ],
    staff: [{ staffId: 'staff_seed_4a', name: 'Cynthia Akinyi', role: 'Nail Artist', rating: 4.5 }],
    reviews: [
      { reviewId: 'rev_seed_4a', authorName: 'Mercy J.', rating: 4, text: 'Lovely nail art, lasted 3 weeks.', createdAt: '2026-09-05T13:20:00Z' },
    ],
  },
  {
    businessId: 'biz_seed_5',
    name: "The Gentleman's Cut",
    description: 'A CBD barbershop built for professionals — sharp cuts and hot towel shaves that fit around your workday.',
    categories: ['barbershop', 'hair_salon'],
    photos: [
      'https://picsum.photos/seed/gentlemans-cut-1/800/600',
      'https://picsum.photos/seed/gentlemans-cut-2/800/600',
    ],
    rating: 4.8,
    reviewCount: 203,
    address: 'CBD, Nairobi',
    lat: -1.2864,
    lng: 36.8172,
    depositSummary: 'No deposit required',
    cancellationSummary: 'Free cancellation up to 24h before, 50% fee after',
    services: [
      { serviceId: 'svc_seed_5a', categoryName: 'Cuts', name: 'Executive Haircut', durationMinutes: 40, price: { amount: 1000, currency: 'KES' } },
      { serviceId: 'svc_seed_5b', categoryName: 'Grooming', name: 'Hot Towel Shave', durationMinutes: 30, price: { amount: 600, currency: 'KES' } },
    ],
    staff: [{ staffId: 'staff_seed_5a', name: 'Samuel Kiptoo', role: 'Senior Barber', rating: 4.8 }],
    reviews: [
      { reviewId: 'rev_seed_5a', authorName: 'James R.', rating: 5, text: 'Professional and quick, great for a lunch break cut.', createdAt: '2026-09-12T12:00:00Z' },
    ],
  },
  {
    businessId: 'biz_seed_6',
    name: 'Radiance Beauty Studio',
    description: 'A Kileleshwa beauty studio specializing in hair styling and makeup for everyday glow-ups and special events.',
    categories: ['beauty', 'hair_salon'],
    photos: [
      'https://picsum.photos/seed/radiance-1/800/600',
      'https://picsum.photos/seed/radiance-2/800/600',
    ],
    rating: 4.4,
    reviewCount: 52,
    address: 'Kileleshwa, Nairobi',
    lat: -1.2806,
    lng: 36.7789,
    depositSummary: 'KSh 500 deposit required',
    cancellationSummary: 'Free cancellation up to 24h before, 50% fee after',
    services: [
      { serviceId: 'svc_seed_6a', categoryName: 'Hair', name: 'Silk Press', durationMinutes: 90, price: { amount: 2000, currency: 'KES' } },
      { serviceId: 'svc_seed_6b', categoryName: 'Makeup', name: 'Full Face Makeup', durationMinutes: 60, price: { amount: 2500, currency: 'KES' } },
    ],
    staff: [{ staffId: 'staff_seed_6a', name: 'Esther Wambui', role: 'Beauty Specialist', rating: 4.4 }],
    reviews: [
      { reviewId: 'rev_seed_6a', authorName: 'Susan K.', rating: 4, text: 'Beautiful makeup for my event, highly recommend.', createdAt: '2026-08-18T08:00:00Z' },
    ],
  },
];
