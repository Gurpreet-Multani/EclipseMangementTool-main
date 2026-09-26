import React, { useEffect } from 'react';
import { useData } from '../context/DataContext';
import { Bell, X, ArrowRight, Zap, Radio } from 'lucide-react';

interface PushNotificationToastProps {
  onOpenMessage: (messageId: string) => void;
}

export const PushNotificationToast: React.FC<PushNotificationToastProps> = ({ onOpenMessage }) => {
  const { activePushToast, dismissPushToast } = useData();

  useEffect(() => {
    if (!activePushToast) return;
    const timer = setTimeout(() => {
      dismissPushToast();
    }, 8000);
    return () => clearTimeout(timer);
  }, [activePushToast, dismissPushToast]);

  if (!activePushToast) return null;

  const isUrgent = activePushToast.priority === 'urgent' || activePushToast.priority === 'blitz_dispatch';

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-3 pointer-events-none animate-in fade-in slide-in-from-top-4 duration-300">
      <div
        className={`pointer-events-auto rounded-2xl p-3.5 backdrop-blur-2xl shadow-2xl border transition-all ${
          isUrgent
            ? 'bg-slate-900/95 border-rose-500/50 shadow-rose-500/20 ring-1 ring-rose-500/30'
            : 'bg-slate-900/95 border-cyan-500/40 shadow-emerald-500/15 ring-1 ring-emerald-500/30'
        }`}
      >
        {/* iOS Push Header */}
        <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-800/60 mb-2">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center">
              <Zap className="w-3 h-3 text-slate-950 font-bold" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
              Eclipse Dispatch
            </span>
            {activePushToast.priority === 'blitz_dispatch' && (
              <span className="flex items-center gap-1 text-[9px] font-black uppercase px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <Radio className="w-2.5 h-2.5 animate-pulse" />
                Live Turf
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-medium">now</span>
            <button
              onClick={dismissPushToast}
              className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Dismiss toast"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex items-start gap-3">
          {activePushToast.senderBadgePhoto ? (
            <img
              src={activePushToast.senderBadgePhoto}
              alt={activePushToast.senderName}
              className="w-9 h-9 rounded-xl object-cover ring-1 ring-slate-700 shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400 shrink-0 font-bold text-xs">
              {activePushToast.senderName.slice(0, 2).toUpperCase()}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-slate-100 truncate">
                {activePushToast.senderName}
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-600/20 text-emerald-200 font-semibold">
                {activePushToast.senderRole}
              </span>
              {activePushToast.blitzTitle && (
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 truncate max-w-[120px]">
                  {activePushToast.blitzTitle}
                </span>
              )}
            </div>

            <p className="text-xs font-semibold text-emerald-300 mt-0.5 line-clamp-1">
              {activePushToast.title}
            </p>
            <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-2 leading-relaxed">
              {activePushToast.content}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-3 flex items-center justify-end gap-2 pt-1.5 border-t border-slate-800/40">
          <button
            onClick={dismissPushToast}
            className="px-3 py-1 rounded-lg text-slate-400 hover:text-white text-[11px] font-medium transition-colors"
          >
            Dismiss
          </button>
          <button
            onClick={() => {
              const msgId = activePushToast.id;
              dismissPushToast();
              onOpenMessage(msgId);
            }}
            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-500 hover:bg-cyan-400 text-slate-950 text-[11px] font-bold transition-all shadow-sm"
          >
            <span>View Dispatch</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
