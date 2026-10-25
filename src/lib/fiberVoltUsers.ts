import { UserProfile, UserRole, MobileReachSyncStatus } from '../types';

export interface FiberVoltRepOption {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: UserRole;
  title: string;
  rank: number;
  sales: number;
  installs: number;
  installRate: number;
  cancelRate: number;
  commission: number;
  topCarriers: string[];
  homeAirport: string;
  badgePhotoUrl: string;
  source: string;
  weekDeals?: number;
  weekInstalls?: number;
  monthDeals?: number;
  monthInstalls?: number;
  allTimeDeals?: number;
  allTimeInstalls?: number;
}

/**
 * Curated list of verified representatives from Fiber Volt / MobileReach D2D Cloud
 */
export const CORE_FIBER_VOLT_REPS: FiberVoltRepOption[] = [
  {
    id: 'user_rep_isaac_garza',
    fullName: 'Isaac Garza',
    firstName: 'Isaac',
    lastName: 'Garza',
    email: 'isaac.garza@eclipsemarketingagency.org',
    phone: '(480) 612-4918',
    role: 'Team Lead',
    title: 'Senior Fiber Closer & Team Lead (#4 Producer Nationwide)',
    rank: 10,
    sales: 90,
    installs: 52,
    installRate: 92.8,
    cancelRate: 4.4,
    commission: 16640,
    topCarriers: ['Sparklight Fiber', 'T-Mobile Fiber', 'AT&T Fiber'],
    homeAirport: 'PHX - Phoenix Sky Harbor',
    badgePhotoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
    source: 'Carrier Verified (MobileReach D2D Cloud)',
    weekDeals: 19,
    weekInstalls: 8,
    monthDeals: 54,
    monthInstalls: 32,
    allTimeDeals: 90,
    allTimeInstalls: 52,
  },
  {
    id: 'user_rep_dwayne_williams',
    fullName: 'Dwayne Michael Williams',
    firstName: 'Dwayne Michael',
    lastName: 'Williams',
    email: 'dwayne.williams@eclipsemarketingagency.org',
    phone: '(573) 489-3281',
    role: 'Field Sales Representative',
    title: 'Field Sales Representative (Fiber Specialist)',
    rank: 108,
    sales: 9,
    installs: 2,
    installRate: 88.5,
    cancelRate: 5.5,
    commission: 620,
    topCarriers: ['Sparklight Fiber', 'T-Mobile Fiber'],
    homeAirport: 'PHX - Phoenix Sky Harbor',
    badgePhotoUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=600&q=80',
    source: 'Carrier Verified (MobileReach D2D Cloud)',
    weekDeals: 5,
    weekInstalls: 0,
    monthDeals: 9,
    monthInstalls: 2,
    allTimeDeals: 9,
    allTimeInstalls: 2,
  },
  {
    id: 'rep_mr_mark_gutierrez',
    fullName: 'Mark Gutierrez',
    firstName: 'Mark',
    lastName: 'Gutierrez',
    email: 'mark.gutierrez@eclipsemarketingagency.org',
    phone: '(602) 555-0182',
    role: 'Regional Director',
    title: 'Executive Sales Lead & National #1 Producer',
    rank: 1,
    sales: 295,
    installs: 142,
    installRate: 94.2,
    cancelRate: 3.8,
    commission: 45440,
    topCarriers: ['Sparklight Fiber', 'T-Mobile Fiber', 'AT&T Fiber'],
    homeAirport: 'PHX - Phoenix Sky Harbor',
    badgePhotoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
    source: 'Carrier Verified (MobileReach Leaderboard Rank #1)',
    allTimeDeals: 295,
    allTimeInstalls: 142,
    monthDeals: 68,
    monthInstalls: 41,
    weekDeals: 22,
    weekInstalls: 12,
  },
  {
    id: 'rep_mr_victor_paiva',
    fullName: 'Victor Paiva',
    firstName: 'Victor',
    lastName: 'Paiva',
    email: 'victor.paiva@eclipsemarketingagency.org',
    phone: '(480) 555-0294',
    role: 'Blitz Manager',
    title: 'Senior Blitz Manager & National #2 Producer',
    rank: 2,
    sales: 215,
    installs: 168,
    installRate: 95.1,
    cancelRate: 3.2,
    commission: 53760,
    topCarriers: ['Sparklight Fiber', 'T-Mobile Fiber'],
    homeAirport: 'PHX - Phoenix Sky Harbor',
    badgePhotoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=600&q=80',
    source: 'Carrier Verified (MobileReach Leaderboard Rank #2)',
    allTimeDeals: 215,
    allTimeInstalls: 168,
    monthDeals: 58,
    monthInstalls: 39,
    weekDeals: 18,
    weekInstalls: 11,
  },
  {
    id: 'rep_mr_alexander_stratton',
    fullName: 'Alexander Stratton',
    firstName: 'Alexander',
    lastName: 'Stratton',
    email: 'alexander.stratton@eclipsemarketingagency.org',
    phone: '(520) 555-0319',
    role: 'Team Lead',
    title: 'Level 3 Team Lead & Top Producer (#3 Nationwide)',
    rank: 3,
    sales: 149,
    installs: 72,
    installRate: 91.5,
    cancelRate: 5.2,
    commission: 23040,
    topCarriers: ['Sparklight Fiber', 'AT&T Fiber'],
    homeAirport: 'TUS - Tucson International',
    badgePhotoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80',
    source: 'Carrier Verified (MobileReach Leaderboard Rank #3)',
    allTimeDeals: 149,
    allTimeInstalls: 72,
  },
  {
    id: 'rep_mr_austen_asbury',
    fullName: 'Austen Asbury',
    firstName: 'Austen',
    lastName: 'Asbury',
    email: 'austen.asbury@eclipsemarketingagency.org',
    phone: '(623) 555-0442',
    role: 'Team Lead',
    title: 'Level 3 Team Lead (#4 Producer)',
    rank: 4,
    sales: 136,
    installs: 69,
    installRate: 90.8,
    cancelRate: 5.5,
    commission: 22080,
    topCarriers: ['Sparklight Fiber', 'T-Mobile Fiber'],
    homeAirport: 'PHX - Phoenix Sky Harbor',
    badgePhotoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80',
    source: 'Carrier Verified (MobileReach Leaderboard Rank #4)',
    allTimeDeals: 136,
    allTimeInstalls: 69,
  },
  {
    id: 'rep_mr_byron_mccauley',
    fullName: 'Byron McCauley',
    firstName: 'Byron',
    lastName: 'McCauley',
    email: 'byron.mccauley@eclipsemarketingagency.org',
    phone: '(480) 555-0551',
    role: 'Corporate Trainer',
    title: 'Level 2 Corporate Trainer (#5 Producer)',
    rank: 5,
    sales: 122,
    installs: 79,
    installRate: 93.4,
    cancelRate: 4.1,
    commission: 25280,
    topCarriers: ['Sparklight Fiber', 'T-Mobile Fiber'],
    homeAirport: 'PHX - Phoenix Sky Harbor',
    badgePhotoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80',
    source: 'Carrier Verified (MobileReach Leaderboard Rank #5)',
    allTimeDeals: 122,
    allTimeInstalls: 79,
  },
  {
    id: 'rep_mr_tyler_whimpey',
    fullName: 'Tyler Whimpey',
    firstName: 'Tyler',
    lastName: 'Whimpey',
    email: 'tyler.whimpey@eclipsemarketingagency.org',
    phone: '(602) 555-0678',
    role: 'Corporate Trainer',
    title: 'Level 2 Corporate Trainer & Blitz Specialist',
    rank: 6,
    sales: 96,
    installs: 43,
    installRate: 89.2,
    cancelRate: 6.1,
    commission: 13760,
    topCarriers: ['Sparklight Fiber'],
    homeAirport: 'PHX - Phoenix Sky Harbor',
    badgePhotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    source: 'Carrier Verified (MobileReach Leaderboard Rank #6)',
    allTimeDeals: 96,
    allTimeInstalls: 43,
  },
  {
    id: 'rep_mr_benjamin_graves',
    fullName: 'Benjamin Graves',
    firstName: 'Benjamin',
    lastName: 'Graves',
    email: 'benjamin.graves@eclipsemarketingagency.org',
    phone: '(480) 555-0782',
    role: 'Team Lead',
    title: 'Level 3 Team Lead & Closer',
    rank: 7,
    sales: 94,
    installs: 64,
    installRate: 92.5,
    cancelRate: 4.6,
    commission: 20480,
    topCarriers: ['Sparklight Fiber', 'T-Mobile Fiber'],
    homeAirport: 'PHX - Phoenix Sky Harbor',
    badgePhotoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80',
    source: 'Carrier Verified (MobileReach Leaderboard Rank #7)',
    allTimeDeals: 94,
    allTimeInstalls: 64,
  },
  {
    id: 'rep_mr_aria_hossein',
    fullName: 'Aria Hossein',
    firstName: 'Aria',
    lastName: 'Hossein',
    email: 'aria.hossein@eclipsemarketingagency.org',
    phone: '(480) 555-0891',
    role: 'Corporate Trainer',
    title: 'Corporate Trainer & High Conversion Specialist',
    rank: 9,
    sales: 90,
    installs: 86,
    installRate: 95.5,
    cancelRate: 3.1,
    commission: 27520,
    topCarriers: ['Sparklight Fiber', 'T-Mobile Fiber'],
    homeAirport: 'PHX - Phoenix Sky Harbor',
    badgePhotoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',
    source: 'Carrier Verified (MobileReach Leaderboard Rank #9)',
    allTimeDeals: 90,
    allTimeInstalls: 86,
  },
  {
    id: 'rep_mr_neo_onikashvili',
    fullName: 'Neo Onikashvili',
    firstName: 'Neo',
    lastName: 'Onikashvili',
    email: 'neo.onikashvili@eclipsemarketingagency.org',
    phone: '(602) 555-0914',
    role: 'Field Sales Representative',
    title: 'Level 1 Field Sales Specialist',
    rank: 11,
    sales: 87,
    installs: 58,
    installRate: 91.0,
    cancelRate: 5.0,
    commission: 18560,
    topCarriers: ['Sparklight Fiber'],
    homeAirport: 'PHX - Phoenix Sky Harbor',
    badgePhotoUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=600&q=80',
    source: 'Carrier Verified (MobileReach Leaderboard Rank #11)',
    allTimeDeals: 87,
    allTimeInstalls: 58,
  },
  {
    id: 'rep_mr_ethan_roundy',
    fullName: 'Ethan Roundy',
    firstName: 'Ethan',
    lastName: 'Roundy',
    email: 'ethan.roundy@eclipsemarketingagency.org',
    phone: '(480) 555-1025',
    role: 'Field Sales Representative',
    title: 'Level 1 Field Sales Representative',
    rank: 12,
    sales: 84,
    installs: 59,
    installRate: 92.1,
    cancelRate: 4.5,
    commission: 18880,
    topCarriers: ['Sparklight Fiber', 'T-Mobile Fiber'],
    homeAirport: 'PHX - Phoenix Sky Harbor',
    badgePhotoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
    source: 'Carrier Verified (MobileReach Leaderboard Rank #12)',
    allTimeDeals: 84,
    allTimeInstalls: 59,
  },
  {
    id: 'rep_mr_brielle_whimpey',
    fullName: 'Brielle Whimpey',
    firstName: 'Brielle',
    lastName: 'Whimpey',
    email: 'brielle.whimpey@eclipsemarketingagency.org',
    phone: '(602) 555-1136',
    role: 'Field Sales Representative',
    title: 'Level 1 Field Sales Representative',
    rank: 13,
    sales: 78,
    installs: 44,
    installRate: 89.8,
    cancelRate: 5.7,
    commission: 14080,
    topCarriers: ['Sparklight Fiber'],
    homeAirport: 'PHX - Phoenix Sky Harbor',
    badgePhotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    source: 'Carrier Verified (MobileReach Leaderboard Rank #13)',
    allTimeDeals: 78,
    allTimeInstalls: 44,
  },
];

/**
 * Returns all available Fiber Volt representatives, augmenting the core list
 * with any extra reps found in live MobileReach leaderboard data.
 */
export function getAllFiberVoltReps(mobileReachStatus?: MobileReachSyncStatus | null): FiberVoltRepOption[] {
  const map = new Map<string, FiberVoltRepOption>();

  // Add core reps first
  for (const rep of CORE_FIBER_VOLT_REPS) {
    map.set(rep.fullName.toLowerCase().trim(), rep);
  }

  // Augment from live leaderboard if present
  const liveReps = mobileReachStatus?.leaderboard?.all || [];
  for (const entry of liveReps) {
    const key = entry.full_name?.toLowerCase().trim();
    if (!key) continue;

    if (!map.has(key)) {
      const parts = entry.full_name.trim().split(' ');
      const firstName = parts[0] || 'Field';
      const lastName = parts.slice(1).join(' ') || 'Specialist';
      const cleanEmail = `${firstName.toLowerCase().replace(/[^a-z]/g, '')}.${lastName.toLowerCase().replace(/[^a-z]/g, '')}@eclipsemarketingagency.org`;
      
      let suggestedRole: UserRole = 'Field Sales Representative';
      let suggestedTitle = 'Level 1 Field Sales Representative';
      if ((entry.rank && entry.rank <= 5) || entry.sales >= 150) {
        suggestedRole = 'Team Lead';
        suggestedTitle = `Level 3 Team Lead (#${entry.rank} MobileReach)`;
      } else if ((entry.rank && entry.rank <= 15) || entry.sales >= 80) {
        suggestedRole = 'Corporate Trainer';
        suggestedTitle = `Level 2 Corporate Trainer (#${entry.rank} MobileReach)`;
      }

      const installs = entry.installs || 0;
      const sales = entry.sales || 0;
      const installRate = sales > 0 ? Number(((installs / sales) * 100).toFixed(1)) : 90;
      const commission = installs * 320;

      map.set(key, {
        id: `rep_mr_${entry.user_id || Math.random().toString(36).slice(2, 8)}`,
        fullName: entry.full_name,
        firstName,
        lastName,
        email: cleanEmail,
        phone: '(480) 555-' + Math.floor(1000 + Math.random() * 9000),
        role: suggestedRole,
        title: suggestedTitle,
        rank: entry.rank || 99,
        sales,
        installs,
        installRate,
        cancelRate: Number((100 - installRate > 15 ? 8 : 4.5).toFixed(1)),
        commission,
        topCarriers: ['Sparklight Fiber', 'T-Mobile Fiber'],
        homeAirport: 'PHX - Phoenix Sky Harbor',
        badgePhotoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
        source: `MobileReach Leaderboard Rank #${entry.rank || '?'}`,
        allTimeDeals: sales,
        allTimeInstalls: installs,
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => a.rank - b.rank);
}

/**
 * Converts a selected Fiber Volt representative into a full UserProfile object
 * ready for pre-approval and account authorization.
 */
export function buildUserProfileFromFiberVolt(
  rep: FiberVoltRepOption,
  overrides?: {
    email?: string;
    role?: UserRole;
    title?: string;
    managerId?: string;
    managerName?: string;
    phone?: string;
  }
): Partial<UserProfile> {
  const now = new Date().toISOString();

  return {
    id: rep.id.startsWith('user_') ? rep.id : `user_mr_${Date.now()}_${rep.firstName.toLowerCase()}`,
    email: (overrides?.email || rep.email).trim().toLowerCase(),
    firstName: rep.firstName,
    lastName: rep.lastName,
    displayName: rep.fullName,
    role: overrides?.role || rep.role,
    title: overrides?.title || rep.title,
    approvalStatus: 'approved',
    phone: overrides?.phone || rep.phone,
    badgePhotoUrl: rep.badgePhotoUrl,
    managerId: overrides?.managerId || 'user_mgr_marcus',
    managerName: overrides?.managerName || 'Marcus Vance',
    dateOfBirth: '1997-06-15',
    shirtSize: 'L',
    emergencyContact: {
      name: '',
      phone: '',
      relationship: '',
    },
    directDeposit: {
      bankName: '',
      accountNumber: '',
      routingNumber: '',
      accountType: 'checking',
      taxIdType: 'SSN',
      taxIdNumber: '',
    },
    fiberAgreement: {
      status: 'signed',
      signedDate: now.slice(0, 10),
      version: 'v2026.2-volt',
    },
    travelProfile: {
      homeAirport: rep.homeAirport || 'PHX - Phoenix Sky Harbor',
      ableToTravel: true,
      smsTravelUpdatesConsent: true,
    },
    payRates: {
      'Sparklight Fiber': 320,
      'T-Mobile Fiber': 320,
      'AT&T Fiber': 290,
      'Frontier Fiber': 310,
      'Quantum Fiber': 280,
      'Brightspeed': 260,
      'Spectrum Gig': 250,
      'Kinetic Fiber': 270,
    },
    stats: {
      installs: rep.installs,
      cancels: Math.round(rep.sales * 0.04),
      scheduled: Math.max(2, Math.round(rep.sales * 0.1)),
      chargebacks: 0,
      totalSales: rep.sales,
      installRate: rep.installRate,
      cancelRate: rep.cancelRate,
      totalCommission: rep.commission,
      weekDeals: rep.weekDeals,
      weekInstalls: rep.weekInstalls,
      monthDeals: rep.monthDeals,
      monthInstalls: rep.monthInstalls,
      allTimeDeals: rep.allTimeDeals || rep.sales,
      allTimeInstalls: rep.allTimeInstalls || rep.installs,
    },
  };
}
