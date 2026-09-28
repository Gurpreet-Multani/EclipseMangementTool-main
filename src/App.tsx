import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider, useData } from './context/DataContext';
import { DeviceShell } from './components/DeviceShell';
import { Navbar } from './components/Navbar';
import { TabBar } from './components/TabBar';
import { WorkView } from './components/WorkView';
import { BlitzBookingView } from './components/BlitzBookingView';
import { TrainingView } from './components/TrainingView';
import { ProfileView } from './components/ProfileView';
import { NewSaleModal } from './components/NewSaleModal';
import { BadgeModal } from './components/BadgeModal';
import { RbacMatrixModal } from './components/RbacMatrixModal';
import { RoleManagementModal } from './components/RoleManagementModal';
import { InternalMessagingModal } from './components/InternalMessagingModal';
import { PushNotificationToast } from './components/PushNotificationToast';
import { PendingReviewsModal } from './components/PendingReviewsModal';
import { CompletedCoursesModal } from './components/CompletedCoursesModal';
import { LoginView } from './components/LoginView';
import { PendingApprovalView } from './components/PendingApprovalView';
import { RejectedAccessView } from './components/RejectedAccessView';
import { AccessApprovalsModal } from './components/AccessApprovalsModal';

const MainAppContent: React.FC = () => {
  const { currentUser, authLoading, customRoles, createRole, updateRole, deleteRole, logout, refreshCurrentUserProfile } = useAuth();
  const { courses, getAllSubmissionsPendingReview, getCompletedSubmissions } = useData();
  const [currentTab, setCurrentTab] = useState<string>('work');
  const [showNewSaleModal, setShowNewSaleModal] = useState<boolean>(false);
  const [showBadgeModal, setShowBadgeModal] = useState<boolean>(false);
  const [showRbacModal, setShowRbacModal] = useState<boolean>(false);
  const [showRoleManagementModal, setShowRoleManagementModal] = useState<boolean>(false);
  const [showPendingReviewsModal, setShowPendingReviewsModal] = useState<boolean>(false);
  const [showCompletedCoursesModal, setShowCompletedCoursesModal] = useState<boolean>(false);
  const [showApprovalsModal, setShowApprovalsModal] = useState<boolean>(false);

  // Internal Messaging & Push Dispatch State
  const [showMessagingModal, setShowMessagingModal] = useState<boolean>(false);
  const [messagingInitialBlitzId, setMessagingInitialBlitzId] = useState<string | undefined>(undefined);
  const [messagingInitialRecipientId, setMessagingInitialRecipientId] = useState<string | undefined>(undefined);
  const [messagingInitialMessageId, setMessagingInitialMessageId] = useState<string | undefined>(undefined);

  const handleOpenMessaging = (options?: { blitzId?: string; recipientId?: string; messageId?: string }) => {
    setMessagingInitialBlitzId(options?.blitzId);
    setMessagingInitialRecipientId(options?.recipientId);
    setMessagingInitialMessageId(options?.messageId);
    setShowMessagingModal(true);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#020817] flex flex-col items-center justify-center text-slate-200">
        <div className="w-10 h-10 border-3 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin mb-4" />
        <p className="text-xs font-semibold text-slate-400 tracking-wide uppercase">
          Verifying Eclipse Security Session...
        </p>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginView />;
  }

  // Account Approval Gating
  const userApprovalStatus = currentUser.approvalStatus || 'approved';
  if (userApprovalStatus === 'pending') {
    return (
      <PendingApprovalView
        user={currentUser}
        onRefreshStatus={refreshCurrentUserProfile}
        onLogout={logout}
      />
    );
  }

  if (userApprovalStatus === 'rejected') {
    return (
      <RejectedAccessView
        user={currentUser}
        onLogout={logout}
      />
    );
  }

  return (
    <DeviceShell>
      <div className="flex-1 flex flex-col min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.12),transparent_30%),linear-gradient(135deg,#020817_0%,#051914_30%,#020817_100%)] text-slate-100 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-15%,rgba(52,211,153,0.14),rgba(10,10,10,0))]"></div>
          <div className="absolute top-8 left-1/4 w-56 h-56 bg-emerald-500/8 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-1/4 w-72 h-72 bg-teal-500/8 rounded-full blur-3xl"></div>
          <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.02),rgba(148,163,184,0))]"></div>
        </div>
        <div className="relative z-10 flex-1 flex flex-col">
        {/* iOS Native Push Notification Banner */}
        <PushNotificationToast
          onOpenMessage={(msgId) => handleOpenMessaging({ messageId: msgId })}
        />

        {/* Sticky Dynamic Navbar */}
        <Navbar
          onOpenNewSale={() => setShowNewSaleModal(true)}
          onNavigateTab={(tab) => setCurrentTab(tab)}
          onOpenRbacModal={() => setShowRbacModal(true)}
          onOpenRoleManagementModal={() => setShowRoleManagementModal(true)}
          onOpenMessaging={() => handleOpenMessaging()}
          onOpenPendingReviews={() => setShowPendingReviewsModal(true)}
          onOpenCompletedCourses={() => setShowCompletedCoursesModal(true)}
          onOpenApprovals={() => setShowApprovalsModal(true)}
        />

        {/* Tab Views */}
        <main className="flex-1 w-full overflow-y-auto">
          {currentTab === 'work' && (
            <WorkView
              onOpenNewSale={() => setShowNewSaleModal(true)}
              onOpenDirectMessage={(repId) => handleOpenMessaging({ recipientId: repId })}
            />
          )}
          {currentTab === 'blitz' && (
            <BlitzBookingView
              onOpenMessagingForBlitz={(blitzId) => handleOpenMessaging({ blitzId })}
            />
          )}
          {currentTab === 'training' && <TrainingView />}
          {currentTab === 'profile' && (
            <ProfileView onOpenBadgeModal={() => setShowBadgeModal(true)} />
          )}
        </main>

        {/* iOS Native Bottom Navigation TabBar */}
        <TabBar
          currentTab={currentTab}
          onSelectTab={(tab) => setCurrentTab(tab)}
          onOpenNewSale={() => setShowNewSaleModal(true)}
        />

        {/* New Sale Modal */}
        {showNewSaleModal && (
          <NewSaleModal onClose={() => setShowNewSaleModal(false)} />
        )}

        {/* Official Security Badge Modal */}
        {showBadgeModal && (
          <BadgeModal onClose={() => setShowBadgeModal(false)} />
        )}

        {/* RBAC Security & Permissions Matrix Modal */}
        {showRbacModal && (
          <RbacMatrixModal onClose={() => setShowRbacModal(false)} />
        )}

        {/* Role Management Modal (Admin Only) */}
        {showRoleManagementModal && (
          <RoleManagementModal
            onClose={() => setShowRoleManagementModal(false)}
            roles={customRoles}
            onCreateRole={createRole}
            onUpdateRole={updateRole}
            onDeleteRole={deleteRole}
          />
        )}

        {/* Internal Messaging & Push Dispatch Modal */}
        {showMessagingModal && (
          <InternalMessagingModal
            onClose={() => {
              setShowMessagingModal(false);
              setMessagingInitialBlitzId(undefined);
              setMessagingInitialRecipientId(undefined);
              setMessagingInitialMessageId(undefined);
            }}
            initialBlitzId={messagingInitialBlitzId}
            initialRecipientId={messagingInitialRecipientId}
            initialMessageId={messagingInitialMessageId}
          />
        )}

        {/* Pending Course Reviews Modal */}
        {showPendingReviewsModal && (
          <PendingReviewsModal
            isOpen={showPendingReviewsModal}
            onClose={() => setShowPendingReviewsModal(false)}
            pendingSubmissions={getAllSubmissionsPendingReview()}
            courses={courses}
          />
        )}

        {/* Completed Courses Modal */}
        {showCompletedCoursesModal && (
          <CompletedCoursesModal
            isOpen={showCompletedCoursesModal}
            onClose={() => setShowCompletedCoursesModal(false)}
            completedSubmissions={getCompletedSubmissions()}
            courses={courses}
          />
        )}

        {/* Access Approvals & Whitelist Modal */}
        {showApprovalsModal && (
          <AccessApprovalsModal onClose={() => setShowApprovalsModal(false)} />
        )}
        </div>
      </div>
    </DeviceShell>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <MainAppContent />
      </DataProvider>
    </AuthProvider>
  );
}
