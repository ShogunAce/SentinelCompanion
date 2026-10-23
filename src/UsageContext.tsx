import React, { createContext, useContext, useState, useEffect } from 'react';
import { PLANS } from './plans';
import type { PlanConfig } from './plans';

// Real enforcement must be server-side per account, because client-side limits are only a display.

interface UsageContextType {
  planId: 'free' | 'pro' | 'lifetime';
  currentPlan: PlanConfig;
  connectedApps: string[];
  scansUsed: number;
  companionUsed: number;
  resetDate: string;
  canConnectApp: (origin?: string) => boolean;
  canScan: () => boolean;
  canMessage: () => boolean;
  recordScan: (origin: string, cached?: boolean) => void;
  recordMessage: () => void;
  addApp: (origin: string) => boolean;
  remaining: () => { apps: number; scans: number; messages: number };
  setPlan: (planId: 'free' | 'pro' | 'lifetime') => void;
  setUsage: (scans: number, messages: number, appsCount?: number) => void;
  isDevMode: boolean;
  openWaitlistModal: (planId?: 'pro' | 'lifetime', period?: 'monthly' | 'annual' | 'once') => void;
  isWaitlistOpen: boolean;
  closeWaitlistModal: () => void;
  waitlistPrefill: { planId: 'pro' | 'lifetime'; period: 'monthly' | 'annual' | 'once' };
}

const UsageContext = createContext<UsageContextType | undefined>(undefined);

export function UsageProvider({ children }: { children: React.ReactNode }) {
  const [planId, setPlanId] = useState<'free' | 'pro' | 'lifetime'>('free');
  const [connectedApps, setConnectedApps] = useState<string[]>(['https://my-vibe-app.bolt.host']);
  const [scansUsed, setScansUsed] = useState<number>(0);
  const [companionUsed, setCompanionUsed] = useState<number>(0);

  // Waitlist dialog state
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);
  const [waitlistPrefill, setWaitlistPrefill] = useState<{ planId: 'pro' | 'lifetime'; period: 'monthly' | 'annual' | 'once' }>({
    planId: 'pro',
    period: 'monthly',
  });

  // Check dev mode via URL parameter or hash
  const [isDevMode, setIsDevMode] = useState(false);
  useEffect(() => {
    const checkDev = () => {
      const search = window.location.search;
      const hash = window.location.hash;
      if (search.includes('dev') || hash.includes('dev')) {
        setIsDevMode(true);
      }
    };
    checkDev();
    window.addEventListener('hashchange', checkDev);
    return () => window.removeEventListener('hashchange', checkDev);
  }, []);

  // Compute first day of next month
  const getNextMonthResetDate = () => {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return nextMonth.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };
  const resetDate = getNextMonthResetDate();

  const currentPlan = PLANS[planId];

  const canConnectApp = (origin?: string) => {
    if (origin && connectedApps.includes(origin)) return true;
    return connectedApps.length < currentPlan.apps;
  };

  const canScan = () => {
    return scansUsed < currentPlan.scansPerMonth;
  };

  const canMessage = () => {
    return companionUsed < currentPlan.companionPerMonth;
  };

  const recordScan = (origin: string, cached: boolean = false) => {
    // Count only fresh scans. If cached === true, do NOT count it.
    if (!cached) {
      setScansUsed((prev) => prev + 1);
    }
    if (origin && !connectedApps.includes(origin) && connectedApps.length < currentPlan.apps) {
      setConnectedApps((prev) => [...prev, origin]);
    }
  };

  const recordMessage = () => {
    setCompanionUsed((prev) => prev + 1);
  };

  const addApp = (origin: string) => {
    if (!connectedApps.includes(origin)) {
      if (connectedApps.length >= currentPlan.apps) {
        return false;
      }
      setConnectedApps((prev) => [...prev, origin]);
    }
    return true;
  };

  const remaining = () => {
    return {
      apps: Math.max(0, currentPlan.apps - connectedApps.length),
      scans: Math.max(0, currentPlan.scansPerMonth - scansUsed),
      messages: Math.max(0, currentPlan.companionPerMonth - companionUsed),
    };
  };

  const setUsage = (scans: number, messages: number, appsCount?: number) => {
    setScansUsed(scans);
    setCompanionUsed(messages);
    if (typeof appsCount === 'number') {
      const dummyApps = Array.from({ length: appsCount }, (_, i) => `https://app-${i + 1}.vibecoded.site`);
      setConnectedApps(dummyApps);
    }
  };

  const openWaitlistModal = (targetPlan: 'pro' | 'lifetime' = 'pro', period: 'monthly' | 'annual' | 'once' = 'monthly') => {
    setWaitlistPrefill({ planId: targetPlan, period });
    setIsWaitlistOpen(true);
  };

  const closeWaitlistModal = () => {
    setIsWaitlistOpen(false);
  };

  return (
    <UsageContext.Provider
      value={{
        planId,
        currentPlan,
        connectedApps,
        scansUsed,
        companionUsed,
        resetDate,
        canConnectApp,
        canScan,
        canMessage,
        recordScan,
        recordMessage,
        addApp,
        remaining,
        setPlan: setPlanId,
        setUsage,
        isDevMode,
        openWaitlistModal,
        isWaitlistOpen,
        closeWaitlistModal,
        waitlistPrefill,
      }}
    >
      {children}
    </UsageContext.Provider>
  );
}

export function useUsage() {
  const context = useContext(UsageContext);
  if (!context) {
    throw new Error('useUsage must be used within a UsageProvider');
  }
  return context;
}
