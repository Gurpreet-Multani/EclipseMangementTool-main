import React, { useState } from 'react';
import { MobileReachSyncStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { RefreshCw, ExternalLink, Trophy, CheckCircle2, Clock, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';

interface MobileReachSyncBannerProps {
  status: MobileReachSyncStatus | null;
  onSyncNow: () => Promise<{ success: boolean; count: number; message: string }>;
  onOpenLeaderboard: () => void;
}

export const MobileReachSyncBanner: React.FC<MobileReachSyncBannerProps> = ({
  status,
  onSyncNow,
  onOpenLeaderboard,
}) => {
  const { currentUser } = useAuth();
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const handleSyncClick = async () => {
    setIsManualSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await onSyncNow();
      if (res.success) {
        setSyncFeedback(`Successfully synchronized ${res.count} deals!`);
      } else {
        setSyncFeedback(res.message || 'Sync failed');
      }
    } catch (err: any) {
      setSyncFeedback(err.message || 'Sync encountered an error');
    } finally {
      setIsManualSyncing(false);
      setTimeout(() => setSyncFeedback(null), 5000);
    }
  };

  const isSyncing = status?.isSyncing || isManualSyncing;
  const totalDeals = status?.totalDeals || 0;
  const breakdown = status?.statusBreakdown || { installed: 0, scheduled: 0, jeopardy: 0, cancelled: 0, other: 0 };
  const carriers = status?.carrierBreakdown || { sparklight: 0, tmobile: 0, other: 0 };

  const formatLastSync = (iso?: string | null) => {
    if (!iso) return 'Synchronizing...';
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' (' + d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ')';
    } catch {
      return iso;
    }
  };

  return (
    <div className="bg-gradient-to-r from-slate-900/95 via-emerald-950/20 to-slate-900/95 border border-emerald-500/30 rounded-2xl p-3.5 sm:p-4 shadow-lg shadow-emerald-950/20 relative overflow-hidden transition-all">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
        {/* Left Section: Service Identity & Status */}
        <div className="space-y-1.5 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              24/7 D2D Cloud Pipeline
            </div>

            <span className="text-xs font-black text-white flex items-center gap-1">
              MobileReach D2D Cloud Sync
            </span>

            <a
              href="https://d2d.mobilereach.store"
              target="_blank"
              rel="noreferrer"
              className="text-[10px] font-mono text-slate-400 hover:text-emerald-400 inline-flex items-center gap-0.5 transition-colors"
              title="Open MobileReach Web Portal"
            >
              d2d.mobilereach.store
              <ExternalLink className="w-2.5 h-2.5" />
            </a>

            {currentUser && (
              <span className="text-[10px] font-semibold text-slate-400">
                • Rep: <strong className="text-slate-200">{currentUser.displayName || 'Authorized Representative'}</strong>
              </span>
            )}
          </div>

          <div className="text-[11px] text-slate-300 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>
              Auto-updating <strong className="text-emerald-400">once a day (24/7)</strong> with live deals, statuses & leaderboard.
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              Last sync: <strong className="text-slate-200">{formatLastSync(status?.lastSyncTime)}</strong>
            </span>
          </div>

          {/* Quick Metrics Pills */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-800 text-slate-200 border border-slate-700">
              📦 {totalDeals} Total Deals
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-emerald-950/60 text-emerald-300 border border-emerald-500/40">
              ✅ {breakdown.installed} Installed
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-cyan-950/60 text-cyan-300 border border-cyan-500/40">
              📅 {breakdown.scheduled} Scheduled
            </span>
            {breakdown.jeopardy > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-amber-950/60 text-amber-300 border border-amber-500/40 flex items-center gap-1" title="Deals in jeopardy requiring technician reschedule">
                <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />
                {breakdown.jeopardy} Jeopardy
              </span>
            )}
            {breakdown.cancelled > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-rose-950/60 text-rose-300 border border-rose-500/40">
                ❌ {breakdown.cancelled} Cancelled
              </span>
            )}
            <span className="text-[10px] font-mono text-slate-400 px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800">
              ⚡ Sparklight: {carriers.sparklight} | T-Mobile: {carriers.tmobile}
            </span>
          </div>

          {syncFeedback && (
            <div className="text-[11px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 rounded-xl px-2.5 py-1 inline-flex items-center gap-1.5 animate-in fade-in">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{syncFeedback}</span>
            </div>
          )}
        </div>

        {/* Right Section: Action Controls */}
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-center shrink-0">
          <button
            type="button"
            onClick={onOpenLeaderboard}
            className="px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 hover:border-amber-400 flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            title="Inspect real MobileReach Leaderboard rankings across Month, Week & All-Time"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Leaderboard ({status?.leaderboard?.all?.length || 0})</span>
          </button>

          <button
            type="button"
            onClick={handleSyncClick}
            disabled={isSyncing}
            className={`px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer ${
              isSyncing
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40 opacity-80 cursor-wait'
                : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 shadow-emerald-500/20'
            }`}
            title="Trigger instant sync with d2d.mobilereach.store now"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
