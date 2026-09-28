import React, { useState } from 'react';
import { UserProfile } from '../types';
import { useAuth } from '../context/AuthContext';
import eclipseLogo from '../Images/EclipseLogo.JPG';
import {
  Clock,
  ShieldAlert,
  RefreshCw,
  LogOut,
  Mail,
  User,
  ShieldCheck,
  CheckCircle2,
  Lock,
} from 'lucide-react';

interface PendingApprovalViewProps {
  user: UserProfile;
  onRefreshStatus: () => Promise<void>;
  onLogout: () => void;
}

export const PendingApprovalView: React.FC<PendingApprovalViewProps> = ({
  user,
  onRefreshStatus,
  onLogout,
}) => {
  const { loginAs, users } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [refreshedNotice, setRefreshedNotice] = useState<string | null>(null);

  const handleRefresh = async () => {
    setRefreshing(true);
    setRefreshedNotice(null);
    await onRefreshStatus();
    setTimeout(() => {
      setRefreshing(false);
      setRefreshedNotice('Status checked. Still pending approval from an Administrator.');
    }, 600);
  };

  const formattedDate = user.requestedAt
    ? new Date(user.requestedAt).toLocaleString([], {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : new Date().toLocaleDateString();

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_rgba(245,158,11,0.12),transparent_40%),linear-gradient(135deg,#020817_0%,#091512_50%,#020817_100%)] flex flex-col justify-center items-center p-4 sm:p-6 text-slate-100 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="relative mx-auto w-20 h-20 rounded-full border border-amber-500/40 bg-[#0a1614] shadow-[0_0_35px_rgba(245,158,11,0.2)] ring-4 ring-amber-500/20 flex items-center justify-center p-1.5">
            <img
              src={eclipseLogo}
              alt="Eclipse logo"
              className="w-full h-full rounded-full object-cover"
            />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Eclipse Marketing Agency
            </h1>
            <p className="text-xs text-amber-400 font-semibold mt-0.5 tracking-wide uppercase">
              Field Operations & Fiber Sales Network
            </p>
          </div>
        </div>

        {/* Pending Card */}
        <div className="bg-slate-900/90 border border-amber-500/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl backdrop-blur-2xl ring-1 ring-white/5">
          {/* Status Banner */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5 animate-pulse" />
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-amber-200">
                Account Pending Administrator Approval
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Your Google account has been registered. Before you can access proprietary door turf, sales dashboards, and compensation tools, an Administrator or Company Founder must authorize your account.
              </p>
            </div>
          </div>

          {/* User Profile Card */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Submitted Account Details
            </p>
            <div className="flex items-center gap-3.5">
              <div className="relative">
                <img
                  src={
                    user.badgePhotoUrl ||
                    user.idPhotoUrl ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
                  }
                  alt={user.displayName}
                  className="w-12 h-12 rounded-2xl object-cover ring-2 ring-amber-400/40"
                />
                <span className="absolute -bottom-1 -right-1 p-0.5 bg-amber-500 rounded-full text-slate-950">
                  <Lock className="w-2.5 h-2.5" />
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-white truncate">{user.displayName}</h3>
                <p className="text-xs text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  <span>{user.email}</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Requested Role</span>
                <span className="font-semibold text-slate-300 capitalize">{user.role || 'Representative'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Requested Date</span>
                <span className="font-semibold text-slate-300">{formattedDate}</span>
              </div>
            </div>
          </div>

          {/* Refresh Notice */}
          {refreshedNotice && (
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 text-center animate-in fade-in duration-200">
              {refreshedNotice}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-1">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Checking Status with Cloud...' : 'Check Approval Status'}</span>
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out & Use Different Account</span>
            </button>
          </div>

          {/* Security policy footnote */}
          <div className="pt-2 border-t border-slate-800/80 text-center space-y-1">
            <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Contact Administrator: GurpreetMultani@eclipsemarketingagency.org</span>
            </p>
          </div>

          {/* Fast Switch for Admin Testing */}
          <div className="pt-2 border-t border-slate-800/50">
            <p className="text-[10px] text-slate-500 text-center mb-2">
              (Testing Mode: Switch back to Admin persona to manage this approval request)
            </p>
            <div className="flex justify-center gap-2">
              <button
                type="button"
                onClick={() => loginAs('user_owner_gurpreet')}
                className="px-3 py-1.5 rounded-lg bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 text-amber-300 text-[11px] font-semibold transition-colors"
              >
                Log In as Gurpreet Multani (Admin)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
