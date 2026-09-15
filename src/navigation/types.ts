export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  ForgotPassword: undefined;
  ForgotPasswordVerification: { email: string };
  ResetPassword: { email: string };
  OnboardingVerification: { email: string };
  OnboardingMobile: { email: string };
  OnboardingName: { email: string; mobile: string };
  Success: {
    title: string;
    subtitle: string;
    ctaLabel: string;
    nextRoute: 'Welcome' | 'Login';
  };
};
