export interface PlanConfig {
  id: 'free' | 'pro' | 'lifetime';
  name: string;
  price: number;
  period: 'month' | 'once' | null;
  annualPrice?: number;
  apps: number;
  scansPerMonth: number;
  companionPerMonth: number;
  history: 'latest' | 'full';
  autoRescan: boolean;
  fixPrompts: 'top3' | 'all';
  deepChecks: boolean | 'after-ownership-proof';
  available: boolean;
  seatCap?: number;
  stripePaymentLink?: string;
}

export const PLANS: Record<'free' | 'pro' | 'lifetime', PlanConfig> = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    period: null,
    apps: 1,
    scansPerMonth: 3,
    companionPerMonth: 15,
    history: 'latest',
    autoRescan: false,
    fixPrompts: 'top3',
    deepChecks: false,
    available: true,
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 15,
    period: 'month',
    annualPrice: 144,
    stripePaymentLink: 'https://buy.stripe.com/8x2aEX7BB8zf53K1pi4AU0r',
    apps: 5,
    scansPerMonth: 30,
    companionPerMonth: 300,
    history: 'full',
    autoRescan: true,
    fixPrompts: 'all',
    deepChecks: 'after-ownership-proof',
    available: true,
  },
  lifetime: {
    id: 'lifetime',
    name: 'Founding Lifetime',
    price: 149,
    period: 'once',
    seatCap: 100,
    stripePaymentLink: 'https://buy.stripe.com/7sY5kD3ll8zf67Oec44AU0q',
    apps: 5,
    scansPerMonth: 30,
    companionPerMonth: 150,
    history: 'full',
    autoRescan: true,
    fixPrompts: 'all',
    deepChecks: 'after-ownership-proof',
    available: true,
  },
};

export const SEATS_CLAIMED = 0; // placeholder until a backend exists. Do not invent a number.
