export type BusinessCategory =
  | 'hair_salon'
  | 'barbershop'
  | 'nail_salon'
  | 'spa'
  | 'beauty'
  | 'other';

export type Money = {
  amount: number;
  currency: 'KES';
};

export type BusinessLocation = {
  address: string;
  lat: number;
  lng: number;
  // Manually entered, since a map pin alone doesn't tell a customer which
  // floor or shop to head to inside a mall/office building.
  building?: string;
  floor?: string;
  unit?: string;
};

export type BusinessStatus = 'draft' | 'published';

export type OnboardingStep =
  | 'business_basics'
  | 'photos'
  | 'working_hours'
  | 'services'
  | 'policies'
  | 'payment_destination'
  | 'team_mode'
  | 'review_publish';

// The first photo (by array order) is the cover/thumbnail shown in search
// results; the rest form the gallery on the business's full profile.
export type BusinessPhoto = {
  photoId: string;
  businessId: string;
  url: string;
  isCover: boolean;
};

export type Business = {
  businessId: string;
  name: string;
  description: string;
  categories: BusinessCategory[];
  phone: string;
  location: BusinessLocation;
  status: BusinessStatus;
  onboardingStep: OnboardingStep;
  photos?: BusinessPhoto[];
  workingHours?: WeeklyHours;
  policies?: BusinessPolicies;
  paymentDestination?: PaymentDestination;
  teamMode?: TeamMode;
};

export type DayHours = { open: string; close: string } | null;

export type WeeklyHours = {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
};

// Owner-defined grouping for their service menu (e.g. "Haircuts", "Coloring") —
// distinct from BusinessCategory, which categorizes the business itself for
// marketplace discovery, not its individual services.
export type ServiceCategory = {
  categoryId: string;
  businessId: string;
  name: string;
};

export type Service = {
  serviceId: string;
  businessId: string;
  categoryId: string;
  name: string;
  durationMinutes: number;
  price: Money;
};

export type DepositRule = {
  required: boolean;
  type: 'fixed' | 'percent';
  amount: Money;
  appliesTo: 'all_services' | 'selected_services';
};

export type CancellationPolicy = {
  freeCancellationHours: number;
  lateFeePercent: number;
};

export type NoShowPolicy = {
  feePercent: number;
};

export type BusinessPolicies = {
  deposit: DepositRule;
  cancellation: CancellationPolicy;
  noShow: NoShowPolicy;
};

export type PaymentDestination = {
  type: 'mpesa_till' | 'mpesa_paybill' | 'bank_account';
  tillNumber?: string; // mpesa_till
  paybillNumber?: string; // mpesa_paybill
  paybillAccountNumber?: string; // mpesa_paybill
  bankName?: string; // bank_account
  bankShortcode?: string; // bank_account
  bankAccountNumber?: string; // bank_account
  verificationStatus: 'pending' | 'verified' | 'failed';
};

export type TeamMode = 'solo' | 'team';
