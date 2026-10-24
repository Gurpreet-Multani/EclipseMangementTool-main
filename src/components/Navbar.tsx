import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import eclipseLogo from '../Images/EclipseLogo.JPG';
import {
  Bell,
  Zap,
  Shield,
  User,
  ChevronDown,
  CheckCircle,
  Check,
  LogOut,
  PlusCircle,
  KeyRound,
  Lock,
  MessageSquare,
  Clock,
  UserCheck,
  UserPlus,
  RotateCcw,
} from 'lucide-react';

interface NavbarProps {
  onOpenNewSale: () => void;
  onNavigateTab: (tab: string) => void;
  onOpenRbacModal: () => void;
  onOpenRoleManagementModal: () => void;
  onOpenMessaging: () => void;
  onOpenPendingReviews: () => void;
  onOpenCompletedCourses: () => void;
  onOpenApprovals: (tab?: 'pending' | 'preapprove' | 'active') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenNewSale,
  onNavigateTab,
  onOpenRbacModal,
  onOpenRoleManagementModal,
  onOpenMessaging,
  onOpenPendingReviews,
  onOpenCompletedCourses,
  onOpenApprovals,
}) => {
  const {
    currentUser,
    logout,
    isAdmin,
    isManager,
    isRepresentative,
    pendingApprovalsCount,
    isButtonVisible,
    isButtonDisabled,
    actualIsAdmin,
    effectiveRole,
    isSimulating,
    loginAs,
    switchBackToAdmin,
  } = useAuth();
  const { notifications, messages, markNotificationRead, clearAllNotifications, getAllSubmissionsPendingReview, getCompletedSubmissions } = useData();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = (e?: Event) => {
      let scrollY = window.scrollY || document.documentElement.scrollTop || 0;
      if (e?.target && e.target !== window && e.target !== document) {
        const targetEl = e.target as HTMLElement;
        if (typeof targetEl?.scrollTop === 'number') {
          scrollY = Math.max(scrollY, targetEl.scrollTop);
        }
      }
      setIsScrolled(scrollY > 15);
    };

    window.addEventListener('scroll', handleScroll, { capture: true, passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll, { capture: true } as any);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const unreadMessagesCount = messages.filter(
    (m) => currentUser && !m.readBy?.includes(currentUser.id)
  ).length;
  const pendingReviewsCount = getAllSubmissionsPendingReview().length;

  return (
    <header
      className={`sticky top-0 z-30 transition-all duration-300 ease-in-out px-3 sm:px-6 pb-2.5 ${
        isSimulating
          ? 'pt-2.5'
          : 'pt-[calc(env(safe-area-inset-top,0px)+1.5rem)] sm:pt-3.5'
      } ${
        isScrolled
          ? 'bg-[linear-gradient(180deg,rgba(2,8,23,0.98),rgba(4,22,18,0.95))] backdrop-blur-xl border-b border-emerald-500/20 shadow-[0_10px_30px_rgba(2,6,23,0.35)]'
          : 'bg-[#020817] border-b border-slate-800/90 shadow-none'
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-3">
        {/* Brand & Badge */}
        <div className="flex items-center gap-2 min-w-0 shrink-0">
          <div className="relative flex items-center justify-center w-8 h-8 sm:w-11 sm:h-11 rounded-full border border-emerald-400/80 bg-slate-900 shadow-md ring-2 ring-emerald-500/30 shrink-0">
            <img
              src={eclipseLogo}
              alt="Eclipse logo"
              className="w-7 h-7 sm:w-10 sm:h-10 rounded-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-black text-sm sm:text-base tracking-tight text-white truncate drop-shadow-sm">Eclipse</span>
              <span className="text-[8px] sm:text-[10px] uppercase font-black tracking-[0.16em] px-1.5 py-0.5 rounded bg-emerald-500/25 text-emerald-300 border border-emerald-400/50 shadow-sm shrink-0">
                PRO
              </span>
            </div>
            <p className="text-[9px] sm:text-[10px] text-slate-300 font-medium hidden sm:block truncate">
              Field Sales & State Blitz Operations
            </p>
          </div>
        </div>

        {/* Right Action Icons & Persona Switcher */}
        <div className="flex items-center justify-end gap-1.5 sm:gap-2.5 flex-nowrap min-w-0 shrink-0">
          {/* RBAC Security Info Button */}
          {isButtonVisible('rbac_matrix') && (
            <button
              onClick={isButtonDisabled('rbac_matrix') ? undefined : onOpenRbacModal}
              disabled={isButtonDisabled('rbac_matrix')}
              className={`hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs transition-all shadow-md ${
                isButtonDisabled('rbac_matrix')
                  ? 'bg-slate-900/40 border-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                  : 'bg-slate-800/95 hover:bg-slate-700 border-slate-600/90 text-white font-medium ring-1 ring-white/5'
              }`}
              title={isButtonDisabled('rbac_matrix') ? 'RBAC Access View disabled for this role by Administrator' : 'Inspect Role-Based Access Control (RBAC) Permissions'}
            >
              <Shield className={`w-4 h-4 stroke-[2.2px] ${isButtonDisabled('rbac_matrix') ? 'text-slate-500' : 'text-emerald-300 drop-shadow-[0_0_6px_rgba(52,211,153,0.4)]'}`} />
              <span className="hidden md:inline font-bold">RBAC Access</span>
              <span
                className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wide border shadow-sm ${
                  currentUser?.role?.includes('Regional Director') || isAdmin
                    ? 'bg-rose-500/25 text-rose-200 border-rose-400/50'
                    : currentUser?.role?.includes('Blitz Manager')
                    ? 'bg-amber-500/25 text-amber-200 border-amber-400/50'
                    : currentUser?.role?.includes('Team Lead')
                    ? 'bg-purple-500/25 text-purple-200 border-purple-400/50'
                    : currentUser?.role?.includes('Corporate Trainer')
                    ? 'bg-emerald-500/25 text-emerald-200 border-emerald-400/50'
                    : 'bg-cyan-500/25 text-cyan-200 border-cyan-400/50'
                }`}
              >
                {effectiveRole}
              </span>
            </button>
          )}

          {/* Role Management Button (Owner/Admin Controller) */}
          {(isAdmin || actualIsAdmin) && isButtonVisible('role_manager') && (
            <button
              onClick={isButtonDisabled('role_manager') ? undefined : onOpenRoleManagementModal}
              disabled={isButtonDisabled('role_manager')}
              className={`hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs transition-all shadow-md ${
                isButtonDisabled('role_manager')
                  ? 'bg-slate-900/40 border-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                  : 'bg-indigo-950/95 hover:bg-indigo-900 border-indigo-500/70 text-indigo-100 font-bold ring-1 ring-indigo-400/20'
              }`}
              title={isButtonDisabled('role_manager') ? 'Role Manager disabled for this role by Administrator' : 'Master Control Room: Create & customize roles, disable/hide buttons'}
            >
              <KeyRound className="w-4 h-4 stroke-[2.2px] text-indigo-300" />
              <span className="hidden md:inline font-bold">Master Controls</span>
            </button>
          )}

          {/* Quick Action: Log Fiber Sale on Web Layout */}
          {isButtonVisible('log_sale') && (
            <button
              onClick={isButtonDisabled('log_sale') ? undefined : onOpenNewSale}
              disabled={isButtonDisabled('log_sale')}
              className={`hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all shadow-md ${
                isButtonDisabled('log_sale')
                  ? 'bg-slate-800 border border-slate-700 text-slate-500 cursor-not-allowed opacity-60'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/30 hover:scale-[1.02]'
              }`}
              title={isButtonDisabled('log_sale') ? 'Log Sale action disabled for this role by Administrator' : 'Log New Fiber Sale Order'}
            >
              {isButtonDisabled('log_sale') ? <Lock className="w-3.5 h-3.5 text-slate-500" /> : <PlusCircle className="w-4 h-4 stroke-[2.5px] text-slate-950" />}
              <span>Log Fiber Sale</span>
            </button>
          )}

          {/* Internal Messaging / Dispatch Center */}
          {isButtonVisible('messaging') && (
            <button
              onClick={isButtonDisabled('messaging') ? undefined : onOpenMessaging}
              disabled={isButtonDisabled('messaging')}
              className={`relative p-2.5 rounded-xl border transition-all shadow-md ${
                isButtonDisabled('messaging')
                  ? 'bg-slate-900/40 border-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                  : 'bg-slate-800/95 hover:bg-slate-700 border-slate-600/90 text-white ring-1 ring-white/5'
              }`}
              title={isButtonDisabled('messaging') ? 'Messaging disabled for this role by Administrator' : 'Open Blitz Communications & Direct Messages'}
              aria-label="Internal Messages"
            >
              <MessageSquare className={`w-4 h-4 stroke-[2.2px] ${isButtonDisabled('messaging') ? 'text-slate-500' : 'text-emerald-300'}`} />
              {unreadMessagesCount > 0 && !isButtonDisabled('messaging') && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-slate-950 font-black text-[9px] rounded-full flex items-center justify-center ring-2 ring-slate-950 shadow-md">
                  {unreadMessagesCount}
                </span>
              )}
            </button>
          )}

          {/* Pending Course Reviews Button */}
          {(isAdmin || isManager) && isButtonVisible('course_reviews') && (
            <button
              onClick={isButtonDisabled('course_reviews') ? undefined : onOpenPendingReviews}
              disabled={isButtonDisabled('course_reviews')}
              className={`hidden sm:flex relative p-2.5 rounded-xl border transition-all shadow-md ${
                isButtonDisabled('course_reviews')
                  ? 'bg-slate-900/40 border-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                  : 'bg-slate-800/95 hover:bg-slate-700 border-slate-600/90 text-white ring-1 ring-white/5'
              }`}
              title={isButtonDisabled('course_reviews') ? 'Course reviews disabled for this role by Administrator' : 'Review pending course submissions'}
              aria-label="Pending Reviews"
            >
              <Clock className={`w-4 h-4 stroke-[2.2px] ${isButtonDisabled('course_reviews') ? 'text-slate-500' : 'text-amber-300'}`} />
              {pendingReviewsCount > 0 && !isButtonDisabled('course_reviews') && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-slate-950 font-black text-[9px] rounded-full flex items-center justify-center ring-2 ring-slate-950 shadow-md animate-pulse">
                  {pendingReviewsCount}
                </span>
              )}
            </button>
          )}

          {/* Completed Courses Button */}
          {(isAdmin || isManager) && isButtonVisible('completed_courses') && (
            <button
              onClick={isButtonDisabled('completed_courses') ? undefined : onOpenCompletedCourses}
              disabled={isButtonDisabled('completed_courses')}
              className={`hidden sm:flex relative p-2.5 rounded-xl border transition-all shadow-md ${
                isButtonDisabled('completed_courses')
                  ? 'bg-slate-900/40 border-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                  : 'bg-slate-800/95 hover:bg-slate-700 border-slate-600/90 text-white ring-1 ring-white/5'
              }`}
              title={isButtonDisabled('completed_courses') ? 'Completed coursework view disabled for this role by Administrator' : 'View completed coursework and add comments'}
              aria-label="Completed Coursework"
            >
              <CheckCircle className={`w-4 h-4 stroke-[2.2px] ${isButtonDisabled('completed_courses') ? 'text-slate-500' : 'text-emerald-300'}`} />
            </button>
          )}

          {/* Account Approvals Button for Admin */}
          {(isAdmin || actualIsAdmin) && isButtonVisible('account_approvals') && (
            <button
              onClick={isButtonDisabled('account_approvals') ? undefined : () => onOpenApprovals('pending')}
              disabled={isButtonDisabled('account_approvals')}
              className={`hidden sm:flex relative p-2.5 rounded-xl border transition-all shadow-md ${
                isButtonDisabled('account_approvals')
                  ? 'bg-slate-900/40 border-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                  : 'bg-amber-950/90 hover:bg-amber-900 border-amber-500/70 text-amber-200 ring-1 ring-amber-400/20'
              }`}
              title={isButtonDisabled('account_approvals') ? 'Account approvals disabled for this role by Administrator' : 'Manage Account Approvals & Google Whitelist'}
              aria-label="Account Approvals"
            >
              <UserCheck className={`w-4 h-4 stroke-[2.2px] ${isButtonDisabled('account_approvals') ? 'text-slate-500' : 'text-amber-300'}`} />
              {pendingApprovalsCount > 0 && !isButtonDisabled('account_approvals') && (
                <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-amber-500 text-slate-950 font-black text-[9px] rounded-full flex items-center justify-center ring-2 ring-slate-950 shadow-md animate-pulse">
                  {pendingApprovalsCount}
                </span>
              )}
            </button>
          )}

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifMenu(!showNotifMenu);
                setShowUserMenu(false);
              }}
              className="relative p-2.5 rounded-xl bg-slate-800/95 hover:bg-slate-700 border border-slate-600/90 text-white transition-all shadow-md ring-1 ring-white/5"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white font-bold text-[9px] rounded-full flex items-center justify-center ring-2 ring-slate-950 animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Panel */}
            {showNotifMenu && (
              <div className="absolute right-0 mt-2 w-[calc(100vw-1.5rem)] max-w-sm sm:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-100">Live Field Updates</span>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-400">
                      {unreadCount} new
                    </span>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={clearAllNotifications}
                      className="text-xs text-slate-400 hover:text-emerald-400 transition-colors"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-500">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => {
                          markNotificationRead(notif.id);
                          if (notif.linkTab) onNavigateTab(notif.linkTab);
                          setShowNotifMenu(false);
                        }}
                        className={`p-3.5 hover:bg-slate-800/50 cursor-pointer transition-colors ${
                          !notif.read ? 'bg-cyan-950/20 border-l-2 border-emerald-400' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-semibold text-slate-200">{notif.title}</p>
                          <span className="text-[10px] text-slate-500 shrink-0">
                            {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {notif.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile / Fast Persona Switcher */}
          <div className="relative">
            <button
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowNotifMenu(false);
              }}
              className="flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-xl bg-slate-800/95 hover:bg-slate-700 border border-slate-600/90 text-white transition-all shadow-md ring-1 ring-white/5"
            >
              <div className="relative">
                <img
                  src={currentUser?.badgePhotoUrl || currentUser?.idPhotoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                  alt={currentUser?.displayName || 'User'}
                  className="w-7 h-7 rounded-lg object-cover ring-1 ring-emerald-500/50"
                />
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-slate-950 ${
                    isAdmin
                      ? 'bg-amber-400'
                      : isManager
                      ? 'bg-emerald-400'
                      : 'bg-cyan-400'
                  }`}
                />
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-semibold text-slate-200 leading-tight">
                  {currentUser?.firstName} {currentUser?.lastName}
                </p>
                <p className="text-[10px] text-slate-400 flex items-center gap-1 font-semibold">
                  <span
                    className={
                      isAdmin
                        ? 'text-amber-400'
                        : isManager
                        ? 'text-emerald-400'
                        : 'text-emerald-400'
                    }
                  >
                    {currentUser?.role}
                  </span>
                  {isAdmin && <Shield className="w-2.5 h-2.5 text-amber-400" />}
                  {isManager && <Shield className="w-2.5 h-2.5 text-emerald-400" />}
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
            </button>

            {/* Persona Switcher Dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-[calc(100vw-1.5rem)] max-w-sm sm:w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="p-3.5 bg-slate-950/70 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <img
                      src={currentUser?.badgePhotoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                      alt=""
                      className="w-10 h-10 rounded-xl object-cover ring-1 ring-emerald-500/40"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-100">{currentUser?.displayName}</p>
                      <p className="text-[11px] text-slate-400">{currentUser?.title}</p>
                      <span
                        className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                          isAdmin
                            ? 'bg-amber-400/20 text-amber-400 border border-amber-400/30'
                            : isManager
                            ? 'bg-emerald-400/20 text-emerald-400 border border-emerald-400/30'
                            : 'bg-cyan-400/20 text-emerald-400 border border-emerald-400/30'
                        }`}
                      >
                        Role: {currentUser?.role}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-1.5 bg-slate-950/40 space-y-0.5">
                  {isAdmin && (
                    <>
                      <button
                        onClick={() => {
                          onOpenApprovals();
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-amber-300 hover:text-amber-200 hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                          <span>Manage Account Approvals</span>
                        </div>
                        {pendingApprovalsCount > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-400 text-slate-950">
                            {pendingApprovalsCount}
                          </span>
                        )}
                      </button>

                      <button
                        onClick={() => {
                          onOpenApprovals('preapprove');
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-emerald-300 hover:text-emerald-200 hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
                          <span>+ Create / Pre-Approve User</span>
                        </div>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Fiber Volt
                        </span>
                      </button>
                    </>
                  )}

                  {(isAdmin || actualIsAdmin) && isButtonVisible('role_manager') && (
                    <button
                      onClick={() => {
                        onOpenRoleManagementModal();
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-indigo-300 hover:text-indigo-200 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Master Controls (Roles & Permissions)</span>
                    </button>
                  )}

                  {(isAdmin || isManager) && isButtonVisible('course_reviews') && (
                    <button
                      onClick={() => {
                        onOpenPendingReviews();
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-amber-300 hover:text-amber-200 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>Pending Course Reviews</span>
                      </div>
                      {pendingReviewsCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-400 text-slate-950">
                          {pendingReviewsCount}
                        </span>
                      )}
                    </button>
                  )}

                  {(isAdmin || isManager) && isButtonVisible('completed_courses') && (
                    <button
                      onClick={() => {
                        onOpenCompletedCourses();
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-emerald-300 hover:text-emerald-200 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Completed Coursework & Submissions</span>
                    </button>
                  )}

                  {currentUser?.id !== 'user_owner_gurpreet' && (
                    <button
                      onClick={() => {
                        loginAs('user_owner_gurpreet');
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-amber-300 hover:text-amber-200 hover:bg-amber-500/10 rounded-lg transition-colors border border-amber-500/30"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                      <span>Return to Gurpreet (Admin)</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      onOpenRbacModal();
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-emerald-300 hover:text-emerald-200 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5" />
                      <span>Switch Personas & RBAC Matrix</span>
                    </div>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      All Users
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      onNavigateTab('profile');
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>View Full Profile & Bank Details</span>
                  </button>
                  <button
                    onClick={() => {
                      logout();
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 rounded-lg transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
