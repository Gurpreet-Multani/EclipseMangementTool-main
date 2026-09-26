import React from 'react';
import { BarChart3, MapPin, GraduationCap, UserCircle2, Plus } from 'lucide-react';

interface TabBarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenNewSale: () => void;
}

export const TabBar: React.FC<TabBarProps> = ({ currentTab, onSelectTab, onOpenNewSale }) => {
  const tabs = [
    { id: 'work', label: 'My Work', icon: BarChart3 },
    { id: 'blitz', label: 'Blitz Hub', icon: MapPin },
    { id: 'training', label: 'Training', icon: GraduationCap },
    { id: 'profile', label: 'My Profile', icon: UserCircle2 },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800/80 px-1.5 py-1.25 sm:px-4 safe-area-pb">
      <div className="max-w-md mx-auto flex items-end justify-around relative gap-1">
        {tabs.slice(0, 2).map((tab) => {
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

        <div className="flex flex-col items-center -mt-4 mx-0.5 shrink-0">
          <button
            onClick={onOpenNewSale}
            className="w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-emerald-500 via-teal-500 to-indigo-600 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/40 ring-3 ring-slate-950 hover:scale-105 active:scale-95 transition-transform"
            aria-label="New Sale"
          >
            <Plus className="w-4 h-4 sm:w-6 sm:h-6 stroke-[3px]" />
          </button>
          <span className="text-[7px] sm:text-[8px] text-emerald-400 font-bold uppercase tracking-wider mt-1">Sale</span>
        </div>

        {tabs.slice(2).map((tab) => {
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
