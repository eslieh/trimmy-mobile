export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  ForgotPassword: undefined;
  ForgotPasswordVerification: { email: string };
  ResetPassword: { email: string };
  OnboardingVerification: { email: string; password: string };
  OnboardingMobile: { email: string; password: string };
  OnboardingName: { email: string; password: string; mobile: string };
  Success: {
    title: string;
    subtitle: string;
    ctaLabel: string;
    nextRoute: 'Welcome' | 'Login' | 'GetStarted';
  };
  GetStarted: undefined;
  BusinessBasics: undefined;
};
