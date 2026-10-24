import React from 'react';
import {
  BarChart3,
  MapPin,
  GraduationCap,
  UserCircle2,
  Plus,
  Lock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AppTabId } from '../types';

interface TabBarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenNewSale: () => void;
}

export const TabBar: React.FC<TabBarProps> = ({ currentTab, onSelectTab, onOpenNewSale }) => {
  const { isTabVisible, isButtonVisible, isButtonDisabled } = useAuth();

  const allAvailableTabs: { id: AppTabId; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'work', label: 'My Work', icon: BarChart3 },
    { id: 'blitz', label: 'Blitz Hub', icon: MapPin },
    { id: 'training', label: 'Training', icon: GraduationCap },
    { id: 'profile', label: 'Profile', icon: UserCircle2 },
  ];

  // Filter tabs by role configuration
  const visibleTabs = allAvailableTabs.filter((t) => isTabVisible(t.id));

  const showSaleBtn = isButtonVisible('log_sale');
  const saleBtnDisabled = isButtonDisabled('log_sale');

  // Determine split for center floating sale button
  const half = Math.ceil(visibleTabs.length / 2);
  const leftTabs = showSaleBtn ? visibleTabs.slice(0, half) : visibleTabs;
  const rightTabs = showSaleBtn ? visibleTabs.slice(half) : [];

  const renderTabButton = (tab: { id: AppTabId; label: string; icon: React.FC<{ className?: string }> }) => {
    const Icon = tab.icon;
    const isActive = currentTab === tab.id;

    return (
      <button
        key={tab.id}
        type="button"
        onClick={() => onSelectTab(tab.id)}
        aria-label={tab.label}
        aria-current={isActive ? 'page' : undefined}
        className={`relative flex-1 min-w-0 min-h-[48px] sm:min-h-[52px] py-1 px-1 sm:px-2 rounded-xl flex flex-col items-center justify-center transition-all duration-200 cursor-pointer select-none group ${
          isActive
            ? 'text-emerald-300 font-bold bg-emerald-500/12 ring-1 ring-emerald-500/25 shadow-sm shadow-emerald-500/10'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 font-medium'
        }`}
      >
        {/* Subtle luminous active indicator dot/bar */}
        {isActive && (
          <span className="absolute top-1 w-6 sm:w-8 h-0.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)] animate-in fade-in zoom-in-50 duration-200" />
        )}

        <Icon
          className={`w-5 h-5 sm:w-5 sm:h-5 transition-transform duration-200 ${
            isActive
              ? 'text-emerald-400 stroke-[2.4px] scale-105 drop-shadow-[0_0_6px_rgba(52,211,153,0.4)]'
              : 'text-slate-400 group-hover:text-slate-200 stroke-2 group-hover:scale-105'
          }`}
        />

        <span
          className={`text-[10px] sm:text-[11px] tracking-tight leading-none mt-1 truncate max-w-full transition-colors ${
            isActive ? 'text-emerald-300 font-extrabold' : 'text-slate-400 group-hover:text-slate-200'
          }`}
        >
          {tab.label}
        </span>
      </button>
    );
  };

  return (
    <nav
      aria-label="Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none select-none sm:bottom-3 sm:px-4"
    >
      <div className="pointer-events-auto max-w-lg sm:max-w-xl md:max-w-2xl mx-auto bg-slate-950/95 sm:bg-slate-900/95 backdrop-blur-2xl border-t sm:border border-slate-800/90 sm:rounded-2xl px-2 sm:px-4 pt-1.5 pb-[max(env(safe-area-inset-bottom,0px),0.65rem)] sm:pt-2 sm:pb-2 shadow-[0_-8px_32px_rgba(0,0,0,0.6)] sm:shadow-[0_16px_40px_rgba(0,0,0,0.7)] sm:ring-1 sm:ring-white/5 transition-all">
        <div className="flex items-center justify-between gap-1 sm:gap-2">
          {/* Left Tabs (or all tabs if sale button hidden) */}
          <div className="flex items-center flex-1 justify-around gap-1">
            {leftTabs.map(renderTabButton)}
          </div>

          {/* Elevated Center Floating Sale Button */}
          {showSaleBtn && (
            <div className="flex flex-col items-center justify-center shrink-0 px-1 sm:px-2 -mt-5 sm:-mt-6 group">
              <button
                type="button"
                onClick={saleBtnDisabled ? undefined : onOpenNewSale}
                disabled={saleBtnDisabled}
                title={
                  saleBtnDisabled
                    ? 'Sale logging disabled for this role by Administrator'
                    : 'Log New Fiber Sale (Manual or Screenshot Scanner)'
                }
                aria-label={saleBtnDisabled ? 'Sale Logging Disabled' : 'Log New Fiber Sale'}
                className={`w-12 h-12 sm:w-13 sm:h-13 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 active:scale-95 cursor-pointer ring-4 ring-slate-950 sm:ring-slate-900 ${
                  saleBtnDisabled
                    ? 'bg-slate-800 text-slate-500 opacity-60 cursor-not-allowed shadow-none'
                    : 'bg-gradient-to-tr from-emerald-500 via-teal-400 to-emerald-400 text-slate-950 shadow-[0_6px_24px_rgba(16,185,129,0.5)] hover:shadow-[0_8px_30px_rgba(16,185,129,0.7)] hover:scale-105'
                }`}
              >
                {saleBtnDisabled ? (
                  <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 stroke-2" />
                ) : (
                  <Plus className="w-5 h-5 sm:w-6 sm:h-6 stroke-[3px] text-slate-950 transition-transform group-hover:rotate-90 duration-300" />
                )}
              </button>
              <span
                className={`text-[9px] sm:text-[10px] font-black uppercase tracking-wider mt-1 drop-shadow-sm select-none ${
                  saleBtnDisabled ? 'text-slate-500' : 'text-emerald-400'
                }`}
              >
                New Sale
              </span>
            </div>
          )}

          {/* Right Tabs */}
          {showSaleBtn && rightTabs.length > 0 && (
            <div className="flex items-center flex-1 justify-around gap-1">
              {rightTabs.map(renderTabButton)}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
