import React from 'react';
import {
  BarChart3,
  MapPin,
  GraduationCap,
  UserCircle2,
  Plus,
  Shield,
  Lock
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

  // Determine split for center floating sale button
  const half = Math.ceil(visibleTabs.length / 2);
  const leftTabs = visibleTabs.slice(0, half);
  const rightTabs = visibleTabs.slice(half);

  const showSaleBtn = isButtonVisible('log_sale');
  const saleBtnDisabled = isButtonDisabled('log_sale');

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800/80 px-1.5 py-1.25 sm:px-4 safe-area-pb">
      <div className="max-w-md mx-auto flex items-end justify-around relative gap-1">
        {/* Left Tabs */}
        {leftTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 min-w-0 py-1 rounded-lg transition-all ${
                isActive ? 'text-emerald-400 font-semibold bg-emerald-500/8' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-4 h-4 sm:w-5 sm:h-5 mb-0.5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
              <span className="text-[8px] sm:text-[10px] tracking-tight truncate">{tab.label}</span>
            </button>
          );
        })}

        {/* Floating Center Sale Button (If Visible) */}
        {showSaleBtn && (
          <div className="flex flex-col items-center -mt-4 mx-0.5 shrink-0">
            <button
              onClick={saleBtnDisabled ? undefined : onOpenNewSale}
              disabled={saleBtnDisabled}
              className={`w-11 h-11 sm:w-14 sm:h-14 rounded-full flex items-center justify-center ring-3 ring-slate-950 transition-all ${
                saleBtnDisabled
                  ? 'bg-slate-800 text-slate-500 opacity-60 cursor-not-allowed'
                  : 'bg-gradient-to-tr from-emerald-500 via-teal-500 to-indigo-600 text-slate-950 shadow-lg shadow-emerald-500/40 hover:scale-105 active:scale-95'
              }`}
              title={saleBtnDisabled ? 'Sale Logging disabled for this role by Administrator' : 'Log New Fiber Sale'}
              aria-label="New Sale"
            >
              {saleBtnDisabled ? (
                <Lock className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5px] text-slate-400" />
              ) : (
                <Plus className="w-4 h-4 sm:w-6 sm:h-6 stroke-[3px]" />
              )}
            </button>
            <span
              className={`text-[7px] sm:text-[8px] font-bold uppercase tracking-wider mt-1 ${
                saleBtnDisabled ? 'text-slate-500' : 'text-emerald-400'
              }`}
            >
              Sale
            </span>
          </div>
        )}

        {/* Right Tabs */}
        {rightTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 min-w-0 py-1 rounded-lg transition-all ${
                isActive ? 'text-emerald-400 font-semibold bg-emerald-500/8' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-4 h-4 sm:w-5 sm:h-5 mb-0.5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
              <span className="text-[8px] sm:text-[10px] tracking-tight truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
