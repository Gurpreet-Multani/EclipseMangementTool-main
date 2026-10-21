import React from 'react';
import { Eye, LogOut, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AdminPreviewBanner: React.FC = () => {
  const { isSimulating, simulatedRole, setSimulatedRole } = useAuth();

  if (!isSimulating || !simulatedRole) return null;

  return (
    <div className="sticky top-0 z-50 bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 text-white px-3 sm:px-6 pt-[calc(env(safe-area-inset-top,0px)+1.25rem)] pb-2.5 shadow-lg flex items-center justify-between text-xs font-semibold animate-in slide-in-from-top-2 duration-200">
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
};
