import React, { useState } from 'react';
import { UserProfile } from '../types';
import {
  Users,
  ChevronDown,
  ChevronRight,
  Shield,
  Award,
  Crown,
  Briefcase,
  Flame,
  ArrowRight,
  Sparkles,
  Search,
  Maximize2,
  Minimize2,
  Info
} from 'lucide-react';

interface VisualHierarchyTreeProps {
  users: UserProfile[];
  currentUserId?: string;
  onSelectUser?: (userId: string) => void;
}

export const VisualHierarchyTree: React.FC<VisualHierarchyTreeProps> = ({
  users,
  currentUserId,
  onSelectUser,
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    root: true,
    regional: true,
    blitz: true,
    teamlead: true,
  });
  const [filterRole, setFilterRole] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const toggleNode = (nodeKey: string) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [nodeKey]: !prev[nodeKey],
    }));
  };

  // Organize users by canonical tiers:
  // 1. Regional Directors / Founders / Admins
  const regionalDirectors = users.filter((u) => {
    const roleLower = (u.role || '').toLowerCase();
    return (
      roleLower.includes('regional director') ||
      roleLower.includes('director') ||
      roleLower === 'admin' ||
      roleLower === 'owner' ||
      u.title?.toLowerCase().includes('founder')
    );
  });

  // 2. Blitz Managers
  const blitzManagers = users.filter((u) => {
    const roleLower = (u.role || '').toLowerCase();
    const isDirector =
      roleLower.includes('regional director') ||
      roleLower.includes('director') ||
      roleLower === 'admin' ||
      roleLower === 'owner';
    return !isDirector && (roleLower.includes('blitz manager') || roleLower === 'manager');
  });

  // 3. Team Leads
  const teamLeads = users.filter((u) => {
    const roleLower = (u.role || '').toLowerCase();
    return roleLower.includes('team lead');
  });

  // 4. Corporate Trainers & Field Reps
  const corporateTrainers = users.filter((u) => {
    const roleLower = (u.role || '').toLowerCase();
    return roleLower.includes('corporate trainer') || roleLower.includes('junior lead');
  });

  const fieldReps = users.filter((u) => {
    const roleLower = (u.role || '').toLowerCase();
    return (
      !roleLower.includes('regional director') &&
      !roleLower.includes('director') &&
      roleLower !== 'admin' &&
      roleLower !== 'owner' &&
      !roleLower.includes('blitz manager') &&
      roleLower !== 'manager' &&
      !roleLower.includes('team lead') &&
      !roleLower.includes('corporate trainer') &&
      !roleLower.includes('junior lead')
    );
  });

  // Helper to get subordinates for a specific manager
  const getSubordinatesOf = (managerId: string) => {
    return users.filter((u) => u.managerId === managerId);
  };

  const getRoleBadgeStyle = (role: string) => {
    const r = role.toLowerCase();
    if (r.includes('regional director') || r === 'admin' || r === 'owner') {
      return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
    }
    if (r.includes('blitz manager') || r === 'manager') {
      return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    }
    if (r.includes('team lead')) {
      return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
    }
    if (r.includes('corporate trainer') || r.includes('junior lead')) {
      return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    }
    return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
  };

  return (
    <div className="bg-slate-950/70 border border-slate-800 rounded-3xl p-4 sm:p-6 space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
              Organizational Chart & Hierarchy
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-white mt-0.5 flex items-center gap-2">
            <span>Visual Team Command Structure</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Live interactive chain of command displaying reporting relationships from Regional Directors down through Blitz Managers, Team Leads, Corporate Trainers, and Field Representatives.
          </p>
        </div>

        {/* Legend / Role Badges */}
        <div className="flex flex-wrap items-center gap-1.5 self-start md:self-auto text-[10px]">
          <span className="px-2 py-0.5 rounded-lg border font-bold uppercase bg-rose-500/10 text-rose-300 border-rose-500/30">
            Regional Director
          </span>
          <span className="text-slate-600 font-mono">→</span>
          <span className="px-2 py-0.5 rounded-lg border font-bold uppercase bg-amber-500/10 text-amber-300 border-amber-500/30">
            Blitz Manager
          </span>
          <span className="text-slate-600 font-mono">→</span>
          <span className="px-2 py-0.5 rounded-lg border font-bold uppercase bg-purple-500/10 text-purple-300 border-purple-500/30">
            Team Lead
          </span>
          <span className="text-slate-600 font-mono">→</span>
          <span className="px-2 py-0.5 rounded-lg border font-bold uppercase bg-emerald-500/10 text-emerald-300 border-emerald-500/30">
            Trainer
          </span>
          <span className="text-slate-600 font-mono">→</span>
          <span className="px-2 py-0.5 rounded-lg border font-bold uppercase bg-cyan-500/10 text-cyan-300 border-cyan-500/30">
            Field Rep
          </span>
        </div>
      </div>

      {/* Tier Overview Cards: Span of Control */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
        <div className="p-3 rounded-2xl bg-slate-900/80 border border-rose-500/20 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-rose-400">Tier 1: Executive</span>
            <Crown className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <p className="font-bold text-white text-sm">Regional Directors</p>
          <p className="text-[10px] text-slate-400">Multiple Blitz Managers & entire fiber footprint expansion</p>
        </div>

        <div className="p-3 rounded-2xl bg-slate-900/80 border border-amber-500/20 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-amber-400">Tier 2: Hub Lead</span>
            <Briefcase className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <p className="font-bold text-white text-sm">Blitz Managers</p>
          <p className="text-[10px] text-slate-400">4+ Reps + Team Leads; turf cutting & logistics</p>
        </div>

        <div className="p-3 rounded-2xl bg-slate-900/80 border border-purple-500/20 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-purple-400">Tier 3: Squad Lead</span>
            <Users className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <p className="font-bold text-white text-sm">Team Leads</p>
          <p className="text-[10px] text-slate-400">2–4 Rep Squads; morning atmosphere & field coaching</p>
        </div>

        <div className="p-3 rounded-2xl bg-slate-900/80 border border-cyan-500/20 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-cyan-400">Tier 4: Field Production</span>
            <Flame className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <p className="font-bold text-white text-sm">Trainers & Reps</p>
          <p className="text-[10px] text-slate-400">Direct sales closing, customer orders & team building</p>
        </div>
      </div>

      {/* Visual Hierarchy Tree Canvas */}
      <div className="overflow-x-auto pb-4">
        <div className="min-w-[680px] space-y-6">
          {/* LEVEL 1: REGIONAL DIRECTORS (ROOT LEVEL) */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
                Level 1 Executive
              </span>
              <span className="text-xs font-bold text-slate-300">
                Regional Directors ({regionalDirectors.length})
              </span>
            </div>

            {regionalDirectors.map((director) => {
              const directorSubordinates = blitzManagers.filter(
                (bm) => bm.managerId === director.id || !bm.managerId
              );

              return (
                <div key={director.id} className="relative pl-0 sm:pl-2 space-y-4">
                  {/* Director Card */}
                  <div
                    onClick={() => onSelectUser?.(director.id)}
                    className={`p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-rose-950/20 to-slate-900 border ${
                      currentUserId === director.id
                        ? 'border-rose-400 ring-2 ring-rose-500/30'
                        : 'border-rose-500/40 hover:border-rose-400'
                    } flex flex-wrap items-center justify-between gap-4 cursor-pointer transition-all shadow-lg group`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={
                            director.badgePhotoUrl ||
                            director.idPhotoUrl ||
                            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
                          }
                          alt=""
                          className="w-12 h-12 rounded-2xl object-cover ring-2 ring-rose-400/50"
                        />
                        <span className="absolute -bottom-1 -right-1 p-0.5 bg-rose-500 text-slate-950 rounded-md">
                          <Crown className="w-3 h-3 stroke-[2.5px]" />
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-white group-hover:text-rose-300 transition-colors">
                            {director.displayName}
                          </h4>
                          <span className="px-2 py-0.2 rounded-md text-[9px] font-black uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            {director.role}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{director.title}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1 font-mono">
                          <span>{director.email}</span>
                          <span>•</span>
                          <span className="text-rose-400 font-semibold">{director.stats?.installs || 0} Career Installs</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        Direct Command Span
                      </span>
                      <span className="text-xs font-bold text-white font-mono">
                        {directorSubordinates.length} Blitz Operations Hub{directorSubordinates.length === 1 ? '' : 's'}
                      </span>
                    </div>
                  </div>

                  {/* LEVEL 2: BLITZ MANAGERS (Connected vertically via tree line) */}
                  <div className="ml-4 sm:ml-8 pl-4 sm:pl-6 border-l-2 border-rose-500/30 space-y-4">
                    <div className="flex items-center gap-2 pt-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Level 2 Operations
                      </span>
                      <span className="text-xs font-bold text-slate-300">
                        Subordinate Blitz Managers ({directorSubordinates.length})
                      </span>
                    </div>

                    {directorSubordinates.map((bm) => {
                      const bmTeamLeads = teamLeads.filter((tl) => tl.managerId === bm.id);
                      const directRepReports = [...corporateTrainers, ...fieldReps].filter(
                        (r) => r.managerId === bm.id
                      );

                      return (
                        <div key={bm.id} className="relative space-y-4">
                          {/* Connector node branch */}
                          <div className="absolute -left-4 sm:-left-6 top-6 w-4 sm:w-6 h-0.5 bg-amber-500/40"></div>

                          {/* Blitz Manager Card */}
                          <div
                            onClick={() => onSelectUser?.(bm.id)}
                            className={`p-3.5 rounded-2xl bg-gradient-to-r from-slate-900 via-amber-950/20 to-slate-900 border ${
                              currentUserId === bm.id
                                ? 'border-amber-400 ring-2 ring-amber-500/30'
                                : 'border-amber-500/40 hover:border-amber-400'
                            } flex flex-wrap items-center justify-between gap-3 cursor-pointer transition-all shadow-md group`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <img
                                  src={
                                    bm.badgePhotoUrl ||
                                    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80'
                                  }
                                  alt=""
                                  className="w-11 h-11 rounded-xl object-cover ring-2 ring-amber-400/50"
                                />
                                <span className="absolute -bottom-1 -right-1 p-0.5 bg-amber-500 text-slate-950 rounded-md">
                                  <Briefcase className="w-2.5 h-2.5 stroke-[2.5px]" />
                                </span>
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h5 className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                                    {bm.displayName}
                                  </h5>
                                  <span className="px-1.5 py-0.2 rounded text-[8px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                    {bm.role}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-400">{bm.title}</p>
                                <p className="text-[10px] text-slate-500 font-mono">
                                  Reports to: <strong className="text-rose-400 font-medium">{director.displayName}</strong>
                                </p>
                              </div>
                            </div>

                            <div className="text-right text-[11px]">
                              <span className="text-[9px] text-slate-400 uppercase font-bold block">
                                Assigned Squads
                              </span>
                              <span className="font-mono text-amber-300 font-bold">
                                {bmTeamLeads.length} Team Lead{bmTeamLeads.length === 1 ? '' : 's'} + {directRepReports.length} Direct Rep{directRepReports.length === 1 ? '' : 's'}
                              </span>
                            </div>
                          </div>

                          {/* LEVEL 3: TEAM LEADS */}
                          <div className="ml-4 sm:ml-8 pl-4 sm:pl-6 border-l-2 border-amber-500/30 space-y-3">
                            <div className="flex items-center gap-2">
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                Level 3 Squad Leads
                              </span>
                              <span className="text-[11px] font-bold text-slate-400">
                                Frontline Squad Leaders under {bm.displayName}
                              </span>
                            </div>

                            {bmTeamLeads.map((tl) => {
                              const squadMembers = [...corporateTrainers, ...fieldReps].filter(
                                (r) => r.managerId === tl.id
                              );

                              return (
                                <div key={tl.id} className="relative space-y-3">
                                  {/* Connector node branch */}
                                  <div className="absolute -left-4 sm:-left-6 top-5 w-4 sm:w-6 h-0.5 bg-purple-500/40"></div>

                                  {/* Team Lead Card */}
                                  <div
                                    onClick={() => onSelectUser?.(tl.id)}
                                    className={`p-3 rounded-xl bg-slate-900/90 border ${
                                      currentUserId === tl.id
                                        ? 'border-purple-400 ring-2 ring-purple-500/30'
                                        : 'border-purple-500/30 hover:border-purple-400'
                                    } flex flex-wrap items-center justify-between gap-3 cursor-pointer transition-all shadow-sm group`}
                                  >
                                    <div className="flex items-center gap-2.5">
                                      <img
                                        src={
                                          tl.badgePhotoUrl ||
                                          'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80'
                                        }
                                        alt=""
                                        className="w-9 h-9 rounded-lg object-cover ring-1 ring-purple-400/50"
                                      />
                                      <div>
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-xs font-bold text-white group-hover:text-purple-300">
                                            {tl.displayName}
                                          </span>
                                          <span className="px-1 py-0.2 rounded text-[8px] font-black uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                            Team Lead
                                          </span>
                                        </div>
                                        <p className="text-[10px] text-slate-400">{tl.title}</p>
                                      </div>
                                    </div>

                                    <div className="text-right text-[10px]">
                                      <span className="text-slate-400 block font-semibold">Turf Squad Size</span>
                                      <span className="font-mono text-purple-300 font-bold">
                                        {squadMembers.length} Reps in Squad
                                      </span>
                                    </div>
                                  </div>

                                  {/* LEVEL 4: SQUAD MEMBERS (Corporate Trainers & Field Sales Reps) */}
                                  <div className="ml-4 sm:ml-8 pl-4 sm:pl-6 border-l-2 border-purple-500/20 space-y-2">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      {squadMembers.map((rep) => (
                                        <div
                                          key={rep.id}
                                          onClick={() => onSelectUser?.(rep.id)}
                                          className={`p-2.5 rounded-xl bg-slate-950 border ${
                                            currentUserId === rep.id
                                              ? 'border-emerald-400 ring-1 ring-emerald-500/30'
                                              : 'border-slate-800 hover:border-slate-700'
                                          } flex items-center justify-between gap-2 cursor-pointer transition-all`}
                                        >
                                          <div className="flex items-center gap-2 min-w-0">
                                            <img
                                              src={
                                                rep.badgePhotoUrl ||
                                                'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80'
                                              }
                                              alt=""
                                              className="w-7 h-7 rounded-lg object-cover ring-1 ring-slate-700"
                                            />
                                            <div className="min-w-0">
                                              <p className="text-[11px] font-bold text-white truncate">
                                                {rep.displayName}
                                              </p>
                                              <span
                                                className={`text-[8px] font-black uppercase px-1 py-0.2 rounded border ${getRoleBadgeStyle(
                                                  rep.role
                                                )}`}
                                              >
                                                {rep.role}
                                              </span>
                                            </div>
                                          </div>
                                          <div className="text-right text-[10px] font-mono text-slate-400 shrink-0">
                                            <span>{rep.stats?.installs || 0} Installs</span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}

                            {/* Direct reps under Blitz Manager without a Team Lead */}
                            {directRepReports.length > 0 && (
                              <div className="space-y-2 pt-1">
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                                  Direct Squad Members under {bm.displayName}
                                </span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {directRepReports.map((rep) => (
                                    <div
                                      key={rep.id}
                                      onClick={() => onSelectUser?.(rep.id)}
                                      className={`p-2.5 rounded-xl bg-slate-950 border ${
                                        currentUserId === rep.id
                                          ? 'border-cyan-400 ring-1 ring-cyan-500/30'
                                          : 'border-slate-800 hover:border-slate-700'
                                      } flex items-center justify-between gap-2 cursor-pointer transition-all`}
                                    >
                                      <div className="flex items-center gap-2 min-w-0">
                                        <img
                                          src={
                                            rep.badgePhotoUrl ||
                                            'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80'
                                          }
                                          alt=""
                                          className="w-7 h-7 rounded-lg object-cover ring-1 ring-slate-700"
                                        />
                                        <div className="min-w-0">
                                          <p className="text-[11px] font-bold text-white truncate">
                                            {rep.displayName}
                                          </p>
                                          <span
                                            className={`text-[8px] font-black uppercase px-1 py-0.2 rounded border ${getRoleBadgeStyle(
                                              rep.role
                                            )}`}
                                          >
                                            {rep.role}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="text-right text-[10px] font-mono text-slate-400 shrink-0">
                                        <span>{rep.stats?.installs || 0} Installs</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
