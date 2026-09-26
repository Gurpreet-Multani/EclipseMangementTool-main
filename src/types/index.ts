export type UserRole = 'Admin' | 'Manager' | 'Representative' | string;

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
  canCreateRoles?: boolean;
  canEditPermissions?: boolean;
}

export interface CustomRole {
  id: string;
  name: string;
  description: string;
  permissions: RolePermissions;
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

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  role: UserRole;
  title: string;
  managerId?: string;
  managerName?: string;
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
  };
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus = 'installed' | 'scheduled' | 'cancelled' | 'chargeback' | 'pending';

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
