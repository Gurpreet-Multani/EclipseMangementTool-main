import { RoleUiConfig, ButtonActionId, ButtonVisibilityState, AppTabId, PanelSectionId } from '../types';

export const ALL_BUTTON_ACTIONS: { id: ButtonActionId; label: string; description: string; category: string }[] = [
  { id: 'log_sale', label: 'Log Fiber Sale Button', description: 'Quick action floating button and header action to record new customer sales', category: 'Sales' },
  { id: 'book_blitz', label: 'Book Blitz Trip', description: 'Ability for users to join and book flights/hotels for state blitz operations', category: 'Blitz' },
  { id: 'launch_blitz', label: 'Launch New State Blitz', description: 'Creation and scheduling of multi-state deployment operations', category: 'Blitz' },
  { id: 'messaging', label: 'Dispatch & Internal Messaging', description: 'Access to direct messages, squad communications, and blitz push alerts', category: 'Communication' },
  { id: 'export_data', label: 'Export Sales CSV/Excel', description: 'Downloading raw customer and commission datasets to CSV/Excel', category: 'Reporting' },
  { id: 'course_reviews', label: 'Grade Pending Submissions', description: 'Reviewing and grading representative written pitches and exam answers', category: 'Training' },
  { id: 'completed_courses', label: 'Completed Coursework Log', description: 'Viewing rep training diplomas and posting executive feedback', category: 'Training' },
  { id: 'account_approvals', label: 'Account Approvals Whitelist', description: 'Authorizing new team members and managing Google sign-in access', category: 'Governance' },
  { id: 'role_manager', label: 'Role & Permission Manager', description: 'Accessing role creation, button customization, and visual hierarchy controls', category: 'Governance' },
  { id: 'rbac_matrix', label: 'RBAC Security Matrix', description: 'Viewing full 16-point role-based access control matrix', category: 'Governance' },
  { id: 'edit_pay_rates', label: 'Edit Pay Rates & Commission', description: 'Modifying carrier commission compensation scales per representative', category: 'Financial' },
  { id: 'edit_roles_titles', label: 'Assign Roles & Titles', description: 'Promoting team members and assigning custom or hierarchy roles', category: 'Governance' },
  { id: 'cut_turf', label: 'Turf Cutting & Street Grids', description: 'Assigning neighborhood turf grids and door-to-door boundaries', category: 'Field Operations' },
];

export const ALL_TABS: { id: AppTabId; label: string; description: string }[] = [
  { id: 'work', label: 'My Work & Sales', description: 'Daily production dashboard, sales logs, and pacing analytics' },
  { id: 'blitz', label: 'Blitz Operations Hub', description: 'State blitzes, flight hubs, hotel lodging, and per-diem tracking' },
  { id: 'training', label: 'Training Academy', description: 'Video courses, pitch drills, quizzes, and carrier certifications' },
  { id: 'profile', label: 'My Profile & Badging', description: 'Official badges, travel profile, direct deposit, and hierarchy tree' },
  { id: 'admin_hub', label: 'Master Admin Control', description: 'Executive command room, user control, and system role architecture' },
];

export const ALL_PANELS: { id: PanelSectionId; label: string; description: string }[] = [
  { id: 'financial_kpis', label: 'Company-Wide Financial KPIs', description: 'Gross revenue, carrier commissions, and agency margin breakdown' },
  { id: 'leaderboard', label: 'Team Leaderboard & Rankings', description: 'Top producers, national standings, and blitz hero badges' },
  { id: 'squad_pacing', label: 'Squad Pacing & Door Velocity', description: 'Hourly doors knocked, conversion ratios, and squad stats' },
  { id: 'carrier_splits', label: 'Carrier Breakdown (AT&T, Frontier, etc.)', description: 'Volume splits across all fiber internet service providers' },
  { id: 'direct_deposit', label: 'Direct Deposit & Banking Tab', description: 'Bank routing numbers, account types, and tax identification' },
  { id: 'travel_profile', label: 'Travel Profile & Flight Hubs', description: 'Home airport, travel eligibility, and flight preferences' },
  { id: 'hierarchy_tree', label: 'Visual Hierarchy Tree', description: 'Interactive organizational tree mapping all reporting tiers' },
  { id: 'active_blitzes', label: 'Active State Blitz Feed', description: 'Live deployment statuses and city hotel locations' },
  { id: 'course_authoring', label: 'Course Authoring Console', description: 'Tools to publish new video lessons, quizzes, and rubrics' },
];

export const DEFAULT_ROLE_UI_CONFIGS: Record<string, RoleUiConfig> = {
  Admin: {
    buttonStates: {
      log_sale: 'enabled',
      book_blitz: 'enabled',
      launch_blitz: 'enabled',
      messaging: 'enabled',
      export_data: 'enabled',
      course_reviews: 'enabled',
      completed_courses: 'enabled',
      account_approvals: 'enabled',
      role_manager: 'enabled',
      rbac_matrix: 'enabled',
      edit_pay_rates: 'enabled',
      edit_roles_titles: 'enabled',
      cut_turf: 'enabled',
    },
    visibleTabs: ['work', 'blitz', 'training', 'profile', 'admin_hub'],
    hiddenPanels: [],
  },
  Owner: {
    buttonStates: {
      log_sale: 'enabled',
      book_blitz: 'enabled',
      launch_blitz: 'enabled',
      messaging: 'enabled',
      export_data: 'enabled',
      course_reviews: 'enabled',
      completed_courses: 'enabled',
      account_approvals: 'enabled',
      role_manager: 'enabled',
      rbac_matrix: 'enabled',
      edit_pay_rates: 'enabled',
      edit_roles_titles: 'enabled',
      cut_turf: 'enabled',
    },
    visibleTabs: ['work', 'blitz', 'training', 'profile', 'admin_hub'],
    hiddenPanels: [],
  },
  'Regional Director': {
    buttonStates: {
      log_sale: 'enabled',
      book_blitz: 'enabled',
      launch_blitz: 'enabled',
      messaging: 'enabled',
      export_data: 'enabled',
      course_reviews: 'enabled',
      completed_courses: 'enabled',
      account_approvals: 'disabled',
      role_manager: 'disabled',
      rbac_matrix: 'enabled',
      edit_pay_rates: 'enabled',
      edit_roles_titles: 'enabled',
      cut_turf: 'enabled',
    },
    visibleTabs: ['work', 'blitz', 'training', 'profile'],
    hiddenPanels: [],
  },
  'Blitz Manager': {
    buttonStates: {
      log_sale: 'enabled',
      book_blitz: 'enabled',
      launch_blitz: 'enabled',
      messaging: 'enabled',
      export_data: 'enabled',
      course_reviews: 'enabled',
      completed_courses: 'enabled',
      account_approvals: 'hidden',
      role_manager: 'hidden',
      rbac_matrix: 'enabled',
      edit_pay_rates: 'disabled',
      edit_roles_titles: 'enabled',
      cut_turf: 'enabled',
    },
    visibleTabs: ['work', 'blitz', 'training', 'profile'],
    hiddenPanels: ['financial_kpis'],
  },
  'Team Lead': {
    buttonStates: {
      log_sale: 'enabled',
      book_blitz: 'enabled',
      launch_blitz: 'disabled',
      messaging: 'enabled',
      export_data: 'enabled',
      course_reviews: 'disabled',
      completed_courses: 'enabled',
      account_approvals: 'hidden',
      role_manager: 'hidden',
      rbac_matrix: 'enabled',
      edit_pay_rates: 'hidden',
      edit_roles_titles: 'disabled',
      cut_turf: 'enabled',
    },
    visibleTabs: ['work', 'blitz', 'training', 'profile'],
    hiddenPanels: ['financial_kpis', 'carrier_splits'],
  },
  'Corporate Trainer': {
    buttonStates: {
      log_sale: 'enabled',
      book_blitz: 'enabled',
      launch_blitz: 'hidden',
      messaging: 'enabled',
      export_data: 'enabled',
      course_reviews: 'enabled',
      completed_courses: 'enabled',
      account_approvals: 'hidden',
      role_manager: 'hidden',
      rbac_matrix: 'enabled',
      edit_pay_rates: 'hidden',
      edit_roles_titles: 'hidden',
      cut_turf: 'disabled',
    },
    visibleTabs: ['training', 'work', 'blitz', 'profile'],
    hiddenPanels: ['financial_kpis', 'carrier_splits'],
  },
  'Field Sales Representative': {
    buttonStates: {
      log_sale: 'enabled',
      book_blitz: 'enabled',
      launch_blitz: 'hidden',
      messaging: 'enabled',
      export_data: 'disabled',
      course_reviews: 'hidden',
      completed_courses: 'hidden',
      account_approvals: 'hidden',
      role_manager: 'hidden',
      rbac_matrix: 'hidden',
      edit_pay_rates: 'hidden',
      edit_roles_titles: 'hidden',
      cut_turf: 'hidden',
    },
    visibleTabs: ['work', 'blitz', 'training', 'profile'],
    hiddenPanels: ['financial_kpis', 'squad_pacing', 'carrier_splits'],
  },
};

export function getDefaultUiConfigForRole(roleName: string): RoleUiConfig {
  const normalized = roleName.trim();
  if (DEFAULT_ROLE_UI_CONFIGS[normalized]) {
    return DEFAULT_ROLE_UI_CONFIGS[normalized];
  }
  
  // Fuzzy match
  const lower = normalized.toLowerCase();
  if (lower.includes('admin') || lower.includes('owner')) return DEFAULT_ROLE_UI_CONFIGS.Admin;
  if (lower.includes('regional director')) return DEFAULT_ROLE_UI_CONFIGS['Regional Director'];
  if (lower.includes('blitz manager') || lower === 'manager') return DEFAULT_ROLE_UI_CONFIGS['Blitz Manager'];
  if (lower.includes('team lead')) return DEFAULT_ROLE_UI_CONFIGS['Team Lead'];
  if (lower.includes('trainer')) return DEFAULT_ROLE_UI_CONFIGS['Corporate Trainer'];
  
  // Default fallback for any custom or new role
  return {
    buttonStates: {
      log_sale: 'enabled',
      book_blitz: 'enabled',
      launch_blitz: 'disabled',
      messaging: 'enabled',
      export_data: 'disabled',
      course_reviews: 'hidden',
      completed_courses: 'enabled',
      account_approvals: 'hidden',
      role_manager: 'hidden',
      rbac_matrix: 'enabled',
      edit_pay_rates: 'hidden',
      edit_roles_titles: 'hidden',
      cut_turf: 'disabled',
    },
    visibleTabs: ['work', 'blitz', 'training', 'profile'],
    hiddenPanels: ['financial_kpis'],
  };
}
