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
  | 'working_hours'
  | 'services'
  | 'policies'
  | 'payment_destination'
  | 'team_mode'
  | 'review_publish';

export type Business = {
  businessId: string;
  name: string;
  categories: BusinessCategory[];
  phone: string;
  location: BusinessLocation;
  status: BusinessStatus;
  onboardingStep: OnboardingStep;
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

export type Service = {
  serviceId: string;
  businessId: string;
  name: string;
  category: BusinessCategory;
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
  tillNumber?: string;
  paybillNumber?: string;
  accountNumber?: string;
  verificationStatus: 'pending' | 'verified' | 'failed';
};

export type TeamMode = 'solo' | 'team';
