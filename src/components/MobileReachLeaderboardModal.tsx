import React, { useState } from 'react';
import { MobileReachLeaderboardEntry, MobileReachSyncStatus } from '../types';
import { Award, Trophy, Users, Search, X, CheckCircle2, TrendingUp, Sparkles, ExternalLink } from 'lucide-react';

interface MobileReachLeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  syncStatus: MobileReachSyncStatus | null;
  currentUserEmail?: string;
}

export const MobileReachLeaderboardModal: React.FC<MobileReachLeaderboardModalProps> = ({
  isOpen,
  onClose,
  syncStatus,
  currentUserEmail,
}) => {
  const [period, setPeriod] = useState<'month' | 'week' | 'all'>('month');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const currentList: MobileReachLeaderboardEntry[] = syncStatus?.leaderboard?.[period] || [];

  const filteredList = currentList.filter((item) =>
    item.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const top3 = currentList.slice(0, 3);

  const isCurrentUser = (name: string) => {
    return name.toLowerCase().includes('gurpreet') || name.toLowerCase().includes('multani');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/10">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white">MobileReach Portal Leaderboard</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Live Sync
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Official real rankings synchronized 24/7 from{' '}
                <a
                  href="https://d2d.mobilereach.store"
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-400 hover:underline inline-flex items-center gap-0.5"
                >
                  d2d.mobilereach.store
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters and Timeframe Bar */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 self-start">
            <button
              onClick={() => setPeriod('month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                period === 'month'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-sm font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              This Month ({syncStatus?.leaderboard?.month?.length || 0})
            </button>
            <button
              onClick={() => setPeriod('week')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                period === 'week'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-sm font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              This Week ({syncStatus?.leaderboard?.week?.length || 0})
            </button>
            <button
              onClick={() => setPeriod('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                period === 'all'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-sm font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All-Time ({syncStatus?.leaderboard?.all?.length || 0})
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search sales rep..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Podium for top 3 */}
        {top3.length > 0 && !searchQuery && (
          <div className="p-4 sm:p-6 bg-gradient-to-b from-slate-900/90 to-slate-950 border-b border-slate-800">
            <div className="text-center text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">
              Top Performers • {period === 'month' ? 'Current Month' : period === 'week' ? 'Current Week' : 'All-Time'}
            </div>
            <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-2xl mx-auto">
              {top3.map((rep, idx) => {
                const medals = ['🥇', '🥈', '🥉'];
                const cardGradients = [
                  'border-amber-400/50 bg-gradient-to-b from-amber-500/15 via-slate-900 to-slate-950 shadow-amber-500/10',
                  'border-slate-400/50 bg-gradient-to-b from-slate-400/15 via-slate-900 to-slate-950',
                  'border-amber-700/50 bg-gradient-to-b from-amber-700/15 via-slate-900 to-slate-950',
                ];
                const isYou = isCurrentUser(rep.full_name);

                return (
                  <div
                    key={rep.user_id || idx}
                    className={`p-3 sm:p-4 rounded-2xl border text-center relative flex flex-col items-center shadow-lg transition-transform hover:-translate-y-0.5 ${cardGradients[idx]}`}
                  >
                    <div className="text-2xl mb-1">{medals[idx]}</div>
                    <div className="font-mono text-[10px] text-slate-400 font-bold mb-1">
                      Rank #{idx + 1}
                    </div>
                    <h4 className="text-xs sm:text-sm font-black text-white truncate max-w-full flex items-center justify-center gap-1">
                      {rep.full_name}
                      {isYou && (
                        <span className="text-[9px] px-1.5 py-0.2 bg-emerald-500 text-slate-950 font-black rounded-full uppercase">
                          YOU
                        </span>
                      )}
                    </h4>
                    <div className="mt-2 text-center">
                      <div className="text-base sm:text-xl font-black text-emerald-400">
                        {rep.installs || 0}{' '}
                        <span className="text-[10px] text-slate-400 font-normal">installs</span>
                      </div>
                      <div className="text-[11px] font-semibold text-slate-300">
                        {rep.sales || 0} total sales
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Scrollable Leaderboard Table */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2">
          {filteredList.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No sales representatives found matching your search.
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-12 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <span className="col-span-1 text-center">Rank</span>
                <span className="col-span-5 sm:col-span-6">Sales Specialist</span>
                <span className="col-span-3 sm:col-span-2 text-right">Total Deals</span>
                <span className="col-span-3 text-right">Verified Installs</span>
              </div>

              {filteredList.map((entry, idx) => {
                const isYou = isCurrentUser(entry.full_name);
                const rankNumber = entry.rank || idx + 1;
                const installRate = entry.sales > 0 ? Math.round((entry.installs / entry.sales) * 100) : 0;

                return (
                  <div
                    key={entry.user_id || `${entry.full_name}_${idx}`}
                    className={`grid grid-cols-12 items-center px-3 py-2.5 rounded-xl border transition-all ${
                      isYou
                        ? 'bg-emerald-950/40 border-emerald-500/50 shadow-md shadow-emerald-500/10'
                        : rankNumber <= 3
                        ? 'bg-slate-900/90 border-slate-700/70 hover:border-slate-600'
                        : 'bg-slate-900/50 border-slate-800/60 hover:bg-slate-900/80'
                    }`}
                  >
                    <div className="col-span-1 text-center font-mono font-bold text-xs">
                      {rankNumber === 1 ? '🥇' : rankNumber === 2 ? '🥈' : rankNumber === 3 ? '🥉' : `#${rankNumber}`}
                    </div>

                    <div className="col-span-5 sm:col-span-6 flex items-center gap-1.5 truncate">
                      <span className="text-xs sm:text-sm font-bold text-white truncate">
                        {entry.full_name}
                      </span>
                      {isYou ? (
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 flex-shrink-0">
                          YOU
                        </span>
                      ) : entry.full_name.toLowerCase().includes('isaac') && entry.full_name.toLowerCase().includes('garza') ? (
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-purple-500/25 text-purple-200 border border-purple-500/40 flex-shrink-0">
                          Team Lead
                        </span>
                      ) : entry.full_name.toLowerCase().includes('dwayne') && entry.full_name.toLowerCase().includes('williams') ? (
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-cyan-500/25 text-cyan-200 border border-cyan-500/40 flex-shrink-0">
                          Field Rep
                        </span>
                      ) : entry.full_name.toLowerCase().includes('austen') && entry.full_name.toLowerCase().includes('asbury') ? (
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-amber-500/25 text-amber-200 border border-amber-500/40 flex-shrink-0">
                          #1 Closer
                        </span>
                      ) : null}
                    </div>

                    <div className="col-span-3 sm:col-span-2 text-right">
                      <span className="text-xs sm:text-sm font-bold text-slate-200">
                        {entry.sales}
                      </span>
                      <span className="text-[10px] text-slate-500 block">deals</span>
                    </div>

                    <div className="col-span-3 text-right">
                      <span className="text-xs sm:text-sm font-black text-emerald-400">
                        {entry.installs}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-medium">
                        {installRate}% rate
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              Synchronized 24/7 with MobileReach D2D Cloud • Total: {currentList.length} ranked agents
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer self-end sm:self-auto"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
