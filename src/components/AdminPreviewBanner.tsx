import React from 'react';
import { Eye, LogOut, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AdminPreviewBannerProps {
  onOpenRbacModal?: () => void;
}

export const AdminPreviewBanner: React.FC<AdminPreviewBannerProps> = ({ onOpenRbacModal }) => {
  const { isSimulating, simulatedRole, setSimulatedRole, isImpersonating, currentUser, switchBackToAdmin } = useAuth();

  // 1. Role Simulation Mode takes top priority if active
  if (isSimulating && simulatedRole) {
    return (
      <div className="relative z-40 bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 text-white px-3 sm:px-6 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] pb-2 shadow-md flex items-center justify-between text-xs font-semibold animate-in slide-in-from-top-2 duration-200">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded-lg bg-black/20">
            <Eye className="w-3.5 h-3.5 text-white" />
          </span>
          <span>
            <strong className="font-extrabold uppercase tracking-wide">Live Role Simulator:</strong> Viewing website as{' '}
            <span className="underline decoration-white/60 font-black">{simulatedRole}</span>
          </span>
          <span className="hidden md:inline-block px-2 py-0.5 rounded-full bg-black/25 text-[10px] font-mono text-amber-100">
            All buttons, tabs, and panels adapt to this role's rules
          </span>
        </div>

        <button
          onClick={() => setSimulatedRole(null)}
          className="px-2.5 py-1 rounded-lg bg-black/40 hover:bg-black/60 text-white border border-white/20 text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          title="Exit Simulator and return to Full Executive Control"
        >
          <LogOut className="w-3 h-3" />
          <span>Exit Simulation</span>
        </button>
      </div>
    );
  }

  // 2. Switched Persona Mode (testing other users across hierarchy)
  if (isImpersonating && currentUser) {
    return (
      <div className="relative z-40 bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white px-3 sm:px-6 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] pb-2 shadow-lg flex flex-wrap items-center justify-between gap-2 text-xs font-semibold animate-in slide-in-from-top-2 duration-200 border-b border-emerald-500/30">
        <div className="flex items-center gap-2 min-w-0">
          <span className="p-1 rounded-lg bg-black/30 shrink-0">
            <Eye className="w-3.5 h-3.5 text-emerald-300 animate-pulse" />
          </span>
          <span className="truncate">
            <strong className="font-extrabold uppercase tracking-wide text-emerald-300">Persona View:</strong>{' '}
            Viewing app as <span className="underline decoration-emerald-300 font-black text-white">{currentUser.displayName}</span>{' '}
            <span className="text-emerald-200 font-normal">({currentUser.role})</span>
          </span>
          <span className="hidden md:inline-block px-2 py-0.5 rounded-full bg-black/30 text-[10px] font-mono text-emerald-200">
            Testing hierarchy & dashboard
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onOpenRbacModal && (
            <button
              onClick={onOpenRbacModal}
              className="px-2.5 py-1 rounded-lg bg-black/40 hover:bg-black/60 text-white border border-white/20 text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Open RBAC Persona Switcher to choose another team member"
            >
              <Users className="w-3 h-3 text-cyan-300" />
              <span>Switch Persona</span>
            </button>
          )}

          <button
            onClick={switchBackToAdmin}
            className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-slate-950 text-[11px] font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            title="Revert back to Gurpreet Multani (Founder & Admin View)"
          >
            <LogOut className="w-3 h-3 text-slate-950" />
            <span>Return to Gurpreet (Admin)</span>
          </button>
        </div>
      </div>
    );
  }

  return null;
};
