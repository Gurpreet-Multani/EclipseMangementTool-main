import React from 'react';

interface DeviceShellProps {
  children: React.ReactNode;
}

export const DeviceShell: React.FC<DeviceShellProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <div className="bg-[linear-gradient(90deg,rgba(5,18,15,0.98),rgba(7,26,20,0.9),rgba(5,18,15,0.98))] backdrop-blur-md border-b border-emerald-500/20 px-4 py-2 flex items-center justify-between text-xs z-50 shadow-[0_1px_0_rgba(16,185,129,0.1)]">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)] animate-pulse"></span>
          <span className="font-semibold text-emerald-200 tracking-[0.18em] uppercase text-[9px] sm:text-[10px] truncate">
            Eclipse Synchronized Cloud Node
          </span>
          <span className="hidden sm:inline-block text-slate-400 font-mono text-[9px]">
            • Firestore v11 Sync
          </span>
        </div>
      </div>

      <div className="flex-1 w-full min-h-0 flex flex-col">{children}</div>
    </div>
  );
};
