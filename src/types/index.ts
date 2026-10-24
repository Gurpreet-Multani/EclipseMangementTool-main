export type UserRole =
  | 'Field Sales Representative'
  | 'Corporate Trainer'
  | 'Team Lead'
  | 'Blitz Manager'
  | 'Regional Director'
  | 'Admin'
  | 'Manager'
  | 'Representative'
  | string;

export type ButtonActionId =
  | 'log_sale'
  | 'book_blitz'
  | 'launch_blitz'
  | 'messaging'
  | 'export_data'
  | 'course_reviews'
  | 'completed_courses'
  | 'account_approvals'
  | 'role_manager'
  | 'rbac_matrix'
  | 'edit_pay_rates'
  | 'edit_roles_titles'
  | 'cut_turf';

export type PanelSectionId =
  | 'financial_kpis'
  | 'leaderboard'
  | 'squad_pacing'
  | 'carrier_splits'
  | 'direct_deposit'
  | 'travel_profile'
  | 'hierarchy_tree'
  | 'active_blitzes'
  | 'course_authoring';

export type AppTabId = 'work' | 'blitz' | 'training' | 'profile' | 'admin_hub';

export type ButtonVisibilityState = 'enabled' | 'disabled' | 'hidden';

export interface RoleUiConfig {
  buttonStates: Partial<Record<ButtonActionId, ButtonVisibilityState>>;
  visibleTabs: AppTabId[];
  hiddenPanels: PanelSectionId[];
}

export interface RolePermissions {
  canManageAllUsers: boolean;
  canManageTeam: boolean;
  canChangeUserRolesAndTitles: boolean;
  canChangePayRates: boolean;
  canUploadCoursework: boolean;
  canLaunchStateBlitz: boolean;
  canViewAllSales: boolean;
  canViewTeamSales: boolean;
  canSubmitSales: boolean;
  canAccessTraining: boolean;
  canAccessProfile: boolean;
  canCutTurf?: boolean;
  canManageLogisticsAndBadging?: boolean;
  canNegotiateMasterAgreements?: boolean;
  canManageAgencyCashFlow?: boolean;
  canCreateRoles?: boolean;
  canEditPermissions?: boolean;
}

export interface CustomRole {
  id: string;
  name: string;
  description: string;
  permissions: RolePermissions;
  uiConfig?: RoleUiConfig;
  isCustom: boolean;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

export interface DirectDepositInfo {
  bankName: string;
  accountNumber: string;
  routingNumber: string;
  accountType: 'checking' | 'savings';
  taxIdType: 'SSN' | 'EIN';
  taxIdNumber: string;
}

export interface TravelProfile {
  homeAirport: string;
  ableToTravel: boolean;
  smsTravelUpdatesConsent: boolean;
}

export interface FiberAgreement {
  status: 'coming_soon' | 'pending' | 'signed';
  signedDate?: string;
  version: string;
}

export type ApprovalStatus = 'approved' | 'pending' | 'rejected';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  role: UserRole;
  title: string;
  approvalStatus?: ApprovalStatus;
  approvedBy?: string;
  approvedAt?: string;
  requestedAt?: string;
  rejectionReason?: string;
  managerId?: string;
  managerName?: string;
  customPermissions?: Partial<RolePermissions>;
  customButtonStates?: Partial<Record<ButtonActionId, ButtonVisibilityState>>;
  dateOfBirth: string;
  shirtSize: 'XS' | 'S' | 'M' | 'L' | 'XL' | '2XL' | '3XL';
  phone: string;
  emergencyContact: EmergencyContact;
  idPhotoUrl?: string;
  badgePhotoUrl?: string;
  directDeposit: DirectDepositInfo;
  fiberAgreement: FiberAgreement;
  travelProfile: TravelProfile;
  payRates: Record<string, number>;
  stats: {
    installs: number;
    cancels: number;
    scheduled: number;
    chargebacks: number;
    totalSales: number;
    installRate: number;
    cancelRate: number;
    totalCommission: number;
    weekDeals?: number;
    weekInstalls?: number;
    monthDeals?: number;
    monthInstalls?: number;
    allTimeDeals?: number;
    allTimeInstalls?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus = 'installed' | 'scheduled' | 'jeopardy' | 'cancelled' | 'chargeback' | 'pending';

export type CustomerSmsType = 'pre_install' | 'day_of_install' | 'post_install_checkup';

export interface CustomerSmsMessage {
  id: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  type: CustomerSmsType;
  title: string;
  messageText: string;
  scheduledForDate: string; // YYYY-MM-DD
  scheduledForTime?: string; // e.g. "09:00 AM"
  status: 'scheduled' | 'sent' | 'cancelled' | 'paused';
  sentAt?: string;
  enabled: boolean;
  notes?: string;
}

export interface CustomerSmsConfig {
  autoSmsEnabled: boolean;
  preInstallEnabled: boolean;
  dayOfInstallEnabled: boolean;
  postInstallEnabled: boolean;
  customTemplates?: {
    pre_install?: string;
    day_of_install?: string;
    post_install_checkup?: string;
  };
  messages?: CustomerSmsMessage[];
  lastDispatchedAt?: string;
}

export interface SaleOrder {
  id: string;
  orderNumber: string;
  repId: string;
  repName: string;
  repRole?: UserRole;
  uplineManagerId?: string;
  uplineManagerName?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  ispProgram: string;
  speedTier: string;
  orderDate: string;
  installDate: string;
  status: OrderStatus;
  payout: number;
  blitzId?: string;
  blitzName?: string;
  notes?: string;
  confirmationCode?: string;
  detectedCrm?: string;
  monthlyPrice?: number;
  screenshotPreviewUrl?: string;
  customerSmsConfig?: CustomerSmsConfig;
  smsMessages?: CustomerSmsMessage[];
  createdAt: string;
}

export interface BlitzEvent {
  id: string;
  title: string;
  state: string;
  city: string;
  ispPartner: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'upcoming' | 'completed';
  targetGoal: number;
  currentSales: number;
  installedCount: number;
  maxSpots: number;
  bookedCount: number;
  hotelHub: string;
  dailyPerDiem: number;
  description: string;
  leadCoordinator: string;
  bookedUserIds: string[];
}

export interface BlitzBooking {
  id: string;
  blitzId: string;
  userId: string;
  userName: string;
  userHomeAirport: string;
  state: string;
  bookedAt: string;
  status: 'confirmed' | 'waitlist' | 'checked_in';
  flightNotes?: string;
  roommatePreference?: string;
}

export interface BlitzJoinRequest {
  id: string;
  blitzId: string;
  blitzTitle: string;
  blitzState: string;
  blitzCity: string;
  blitzDates: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: UserRole;
  userHomeAirport: string;
  requestNotes: string;
  roommatePreference?: string;
  pledgedInstalls?: number;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
}

export interface RepAvailabilitySlot {
  id: string;
  userId: string;
  userName?: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: 'available' | 'unavailable' | 'tentative';
  notes?: string;
  createdAt: string;
}

export interface QuizQuestion {
  id: string;
  questionType: 'multiple_choice' | 'short_answer' | 'essay' | 'review_required';
  question: string;
  // For multiple choice
  options?: string[];
  correctAnswerIndex?: number;
  // For all types
  explanation: string;
  // For review-required questions
  requiresOwnerReview?: boolean;
  maxPoints?: number;
}

export interface CourseLesson {
  id: string;
  title: string;
  durationMinutes: number;
  videoUrl?: string; // YouTube or MP4 video URL
  content: string; // rich markdown/text notes & field scripts
  keyTakeaways: string[];
}

export interface CourseAssignment {
  id: string;
  title: string;
  instructions: string;
  deliverableType: 'written_response' | 'pitch_script' | 'field_scenario';
  maxPoints: number;
}

export interface CourseAssignmentRecord {
  id: string;
  courseId: string;
  assignedByUserId: string;
  assignedByName: string;
  assignedRoles: string[]; // Role names that should take this course
  assignedUserIds: string[]; // Specific user IDs
  dueDate?: string; // ISO date string
  priority: 'low' | 'medium' | 'high' | 'critical';
  isRequired: boolean;
  description: string; // Additional context or instructions
  createdAt: string;
  updatedAt: string;
}

export interface Course {
  id: string;
  title: string;
  category: string;
  badgeTitle: string;
  description: string;
  estimatedHours: number;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Master';
  lessons: CourseLesson[];
  assignment?: CourseAssignment;
  quiz?: QuizQuestion[];
  createdBy: string;
  authorName: string;
  published: boolean;
  enrolledCount: number;
  completedCount: number;
  // Review requirements
  requiresSubmissionReview?: boolean;
  passingGrade?: number; // Default 70 - minimum score to pass assignment
  // Assignment tracking
  assignmentRecords?: CourseAssignmentRecord[];
}

export interface QuestionReview {
  questionId: string;
  answer: string;
  score?: number;
  feedback: string;
  reviewedBy: string;
  reviewedByName: string;
  reviewedAt: string;
  status: 'approved' | 'rejected' | 'needs_revision';
}

export interface CourseSubmission {
  id: string;
  courseId: string;
  userId: string;
  userName: string;
  quizScore?: number;
  quizPassed?: boolean;
  assignmentAnswer?: string;
  assignmentGrade?: number;
  assignmentFeedback?: string;
  completedAt?: string;
  submittedAt?: string;
  quizAnswers?: Record<string, string | number>;
  status: 'in_progress' | 'submitted' | 'pending_review' | 'graded' | 'completed' | 'rejected';
  // Assignment tracking
  assignmentId?: string; // Reference to CourseAssignmentRecord
  assignedAt?: string; // When the course was assigned
  dueDate?: string; // When it's due
  isOverdue?: boolean;
  // Review tracking
  submissionReviews?: QuestionReview[]; // Answers that need owner review
  requiresOwnerReview?: boolean; // Course has review-required questions
  reviewedByUserId?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  reviewFeedback?: string;
  allReviewsApproved?: boolean; // All review-required questions approved
  // Owner comments
  ownerComments?: Array<{
    id: string;
    commentedBy: string;
    commentedByName: string;
    commentedAt: string;
    text: string;
  }>;
}

export interface BlitzNotification {
  id: string;
  userId?: string; // specific user or undefined for all
  title: string;
  message: string;
  type: 'sale' | 'blitz' | 'course' | 'system' | 'payout';
  timestamp: string;
  read: boolean;
  linkTab?: string;
}

export interface InternalMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  senderBadgePhoto?: string;
  recipientType: 'direct' | 'blitz_broadcast' | 'company_broadcast';
  recipientId: string;
  recipientName?: string;
  blitzId?: string;
  blitzTitle?: string;
  title: string;
  content: string;
  isPushAlert: boolean;
  priority: 'normal' | 'urgent' | 'blitz_dispatch';
  createdAt: string;
  readBy: string[];
}

export interface MobileReachLeaderboardEntry {
  user_id: string;
  full_name: string;
  sales: number;
  installs: number;
  rank?: number;
  carrier_breakdown?: Record<string, number>;
}

export interface MobileReachSyncStatus {
  isSyncing: boolean;
  lastSyncTime: string | null;
  nextSyncTime: string | null;
  syncIntervalHours: number;
  totalDeals: number;
  statusBreakdown: {
    installed: number;
    scheduled: number;
    jeopardy: number;
    cancelled: number;
    other: number;
  };
  carrierBreakdown: {
    sparklight: number;
    tmobile: number;
    other: number;
  };
  lastError: string | null;
  leaderboard: {
    month: MobileReachLeaderboardEntry[];
    week: MobileReachLeaderboardEntry[];
    all: MobileReachLeaderboardEntry[];
  };
  authenticatedUser: {
    id: string;
    email: string;
    fullName: string;
    role: string;
  } | null;
}
