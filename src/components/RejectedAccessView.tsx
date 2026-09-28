import React from 'react';
import { UserProfile } from '../types';
import eclipseLogo from '../Images/EclipseLogo.JPG';
import { ShieldX, LogOut, Mail, AlertTriangle } from 'lucide-react';

interface RejectedAccessViewProps {
  user: UserProfile;
  onLogout: () => void;
}

export const RejectedAccessView: React.FC<RejectedAccessViewProps> = ({ user, onLogout }) => {
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_rgba(244,63,94,0.12),transparent_40%),linear-gradient(135deg,#020817_0%,#1a080c_50%,#020817_100%)] flex flex-col justify-center items-center p-4 sm:p-6 text-slate-100">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-3">
          <div className="relative mx-auto w-20 h-20 rounded-full border border-rose-500/40 bg-[#160a0d] shadow-[0_0_35px_rgba(244,63,94,0.2)] ring-4 ring-rose-500/20 flex items-center justify-center p-1.5">
            <img
              src={eclipseLogo}
              alt="Eclipse logo"
              className="w-full h-full rounded-full object-cover"
            />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Access Restricted
          </h1>
          <p className="text-xs text-rose-400 font-semibold tracking-wide uppercase">
            Eclipse Marketing Agency
          </p>
        </div>

        <div className="bg-slate-900/90 border border-rose-500/30 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl backdrop-blur-2xl">
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-3">
            <ShieldX className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-rose-200">
                Account Not Authorized
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Your request to access Eclipse Dashboard Pro was declined or your access has been revoked by an Administrator.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Account Email:</span>
              <span className="font-semibold text-white">{user.email}</span>
            </div>
            {user.rejectionReason && (
              <div className="pt-2 border-t border-slate-800/80 text-rose-300">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Reason:</span>
                <span>{user.rejectionReason}</span>
              </div>
            )}
          </div>

          <div className="space-y-2.5">
            <a
              href="mailto:GurpreetMultani@eclipsemarketingagency.org"
              className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors flex items-center justify-center gap-2"
            >
              <Mail className="w-4 h-4 text-emerald-400" />
              <span>Contact Administrator</span>
            </a>

            <button
              type="button"
              onClick={onLogout}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out & Try Another Account</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
