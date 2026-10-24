import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Shield,
  Check,
  X,
  Lock,
  Users,
  DollarSign,
  GraduationCap,
  MapPin,
  Zap,
  Building,
  Briefcase,
  TrendingUp,
  UserCheck,
  Compass,
  Search,
  Sparkles,
  RotateCcw,
  ArrowRight,
  Eye,
  Layers,
} from 'lucide-react';
import { UserRole } from '../types';

interface RbacMatrixModalProps {
  onClose: () => void;
}

export const RbacMatrixModal: React.FC<RbacMatrixModalProps> = ({ onClose }) => {
  const { currentUser, loginAs, users, isAdmin, actualIsAdmin, isImpersonating, switchBackToAdmin, createUserByAdmin } = useAuth();
  const [personaSearch, setPersonaSearch] = useState('');
  const [personaRoleFilter, setPersonaRoleFilter] = useState<'all' | 'director' | 'blitz_mgr' | 'team_lead' | 'trainer' | 'rep'>('all');
  const [switchFeedback, setSwitchFeedback] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'Field Sales Representative' as UserRole,
    title: 'Level 1 Field Sales Representative',
    managerId: 'user_owner_gurpreet',
  });
  const [createStatus, setCreateStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateStatus(null);

    const result = await createUserByAdmin(formData);
    if (!result.success) {
      setCreateStatus({ type: 'error', message: result.error || 'Failed to create user.' });
      return;
    }

    setCreateStatus({ type: 'success', message: 'User created successfully in Eclipse Directory.' });
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: 'Field Sales Representative',
      title: 'Level 1 Field Sales Representative',
      managerId: 'user_rep_jordan',
    });
  };

  const roleDefinitions = [
    {
      level: 'Level 1',
      title: 'Field Sales Representative',
      badge: 'Entry Level',
      color: 'border-cyan-500/30 text-cyan-400 bg-cyan-500/10',
      summary: 'New sales representatives joining the company to sell direct-to-consumer fiber.',
      responsibilities: [
        'Direct door-to-door customer presentations & orders',
        'Sales pipeline logging, install tracking & cancellations',
        'Attend morning atmosphere & script training academy',
        'Direct deposit payout & travel profile management',
      ],
      squadScope: 'Individual Contributor',
    },
    {
      level: 'Level 2',
      title: 'Corporate Trainer / Junior Lead',
      badge: 'Management Track',
      color: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
      summary: 'High performers actively building their own sales organization to step into management.',
      responsibilities: [
        'Personal sales production & direct door selling',
        'Field shadowing & new rep onboarding',
        'Contribute to internal academy training coursework & scripts',
        'Participate in morning pitch practice atmosphere',
      ],
      squadScope: '1–2 Mentees (Building Team)',
    },
    {
      level: 'Level 3',
      title: 'Team Lead',
      badge: 'Squad Leader',
      color: 'border-purple-500/30 text-purple-400 bg-purple-500/10',
      summary: 'Runs atmosphere, coaches in the field, and directs a daily turf squad.',
      responsibilities: [
        'Lead morning atmosphere, announcements & live pitch rehearsals',
        'Conduct field coaching & ride-alongs with subordinate reps',
        'Manage a dedicated squad of 2–4 reps in daily assigned turf',
        'Track real-time squad completion rates & evening checkout',
      ],
      squadScope: 'Dedicated Squad of 2–4 Reps',
    },
    {
      level: 'Executive',
      title: 'Blitz Manager',
      badge: 'Operations Hub Lead',
      color: 'border-amber-500/30 text-amber-400 bg-amber-500/10',
      summary: 'Plans, books, and executes high-velocity market blitzes across geographic footprints.',
      responsibilities: [
        'Book, plan, and execute market blitzes across target geographic footprints',
        'Directly oversee 4+ reps plus subordinate Team Leads',
        'Turf cutting, street allocation & grid mapping',
        'Hotel hub booking, per diem administration & flight logistics',
        'Vendor badging, credential approvals & Channel Manager ISP reporting',
      ],
      squadScope: '4+ Reps + Subordinate Team Leads',
    },
    {
      level: 'Senior Exec',
      title: 'Regional Director',
      badge: 'Executive Leadership',
      color: 'border-rose-500/30 text-rose-400 bg-rose-500/10',
      summary: 'Enterprise executive overseeing multiple blitz managers, footprints, and financial structure.',
      responsibilities: [
        'Oversee multiple Blitz Managers across state corridors',
        'Negotiate master aggregator contract structures & ISP carrier tiers',
        'Manage agency cash flow, escrow accounts & override payouts',
        'Identify & expand into brand new fiber footprint markets',
        'Final authorization on system-wide access & RBAC directory',
      ],
      squadScope: 'Multi-Market / Multi-Blitz Footprint',
    },
  ];

  const matrix = [
    {
      feature: 'Master Aggregator Contracts & ISP Deal Structures',
      rep: false,
      trainer: false,
      lead: false,
      blitzMgr: false,
      director: true,
      note: 'Exclusive to Regional Directors: negotiation of carrier contracts & aggregate revenue margins',
    },
    {
      feature: 'Manage Agency Cash Flow & Financial Overrides',
      rep: false,
      trainer: false,
      lead: false,
      blitzMgr: false,
      director: true,
      note: 'Protected: P&L management, agency treasury, and executive compensation',
    },
    {
      feature: 'Expand into New Fiber Footprints',
      rep: false,
      trainer: false,
      lead: false,
      blitzMgr: false,
      director: true,
      note: 'Authorizes new state blitz market expansions and carrier partnerships',
    },
    {
      feature: 'Book, Plan & Execute Market Blitzes',
      rep: false,
      trainer: false,
      lead: false,
      blitzMgr: true,
      director: true,
      note: 'Creation of state blitzes, targets, dates, and per diem structures',
    },
    {
      feature: 'Turf Cutting & Street Grid Allocations',
      rep: false,
      trainer: false,
      lead: false,
      blitzMgr: true,
      director: true,
      note: 'Partitioning carrier lit maps, street assigning, and territory governance',
    },
    {
      feature: 'Hotel/Travel Logistics & Vendor Badging Approvals',
      rep: false,
      trainer: false,
      lead: false,
      blitzMgr: true,
      director: true,
      note: 'Coordinating hotel blocks, flight logistics, and official carrier badge credentials',
    },
    {
      feature: 'Channel Manager Reporting & Daily KPI Tracking',
      rep: false,
      trainer: false,
      lead: false,
      blitzMgr: true,
      director: true,
      note: 'Daily reconciliation reports to telecom carrier channel leads',
    },
    {
      feature: 'Lead Morning Atmosphere & Pitch Practice Rehearsals',
      rep: false,
      trainer: false,
      lead: true,
      blitzMgr: true,
      director: true,
      note: 'Direct morning energy, announcements, objections breakdown, and script practice',
    },
    {
      feature: 'Manage Field Squad & Track Completion Rates',
      rep: false,
      trainer: false,
      lead: true,
      blitzMgr: true,
      director: true,
      note: 'Oversee 2-4 reps in daily assigned turf with live checkout tracking',
    },
    {
      feature: 'Author Internal Training Academy Coursework',
      rep: false,
      trainer: true,
      lead: true,
      blitzMgr: true,
      director: true,
      note: 'Create curriculum, video lessons, quiz assessments, and script modules',
    },
    {
      feature: 'Field Coaching & New Rep Shadowing',
      rep: false,
      trainer: true,
      lead: true,
      blitzMgr: true,
      director: true,
      note: 'Guide newer reps door-to-door, build mentoring teams, and demonstrate closing',
    },
    {
      feature: 'Log Sales Orders & Track Personal Pipeline',
      rep: true,
      trainer: true,
      lead: true,
      blitzMgr: true,
      director: true,
      note: 'Available to all tiers: order entry, commission calculator, and door sales stats',
    },
    {
      feature: 'Access Training Academy, Scripts & Exam Certifications',
      rep: true,
      trainer: true,
      lead: true,
      blitzMgr: true,
      director: true,
      note: 'Comprehensive library access to all carrier certification coursework',
    },
  ];

  const handleSwitchPersona = async (userId: string, userName: string, userRole: string) => {
    await loginAs(userId);
    setSwitchFeedback(`Switched view to ${userName} (${userRole})`);
    setTimeout(() => {
      setSwitchFeedback(null);
    }, 3000);
  };

  const categorizeRole = (roleStr: string = ''): 'director' | 'blitz_mgr' | 'team_lead' | 'trainer' | 'rep' => {
    const r = roleStr.toLowerCase();
    if (r === 'admin' || r === 'owner' || r.includes('director') || r.includes('executive')) return 'director';
    if (r.includes('blitz manager') || r.includes('blitz mgr') || r === 'manager') return 'blitz_mgr';
    if (r.includes('team lead') || r.includes('squad leader')) return 'team_lead';
    if (r.includes('corporate trainer') || r.includes('trainer') || r.includes('junior lead')) return 'trainer';
    return 'rep';
  };

  const getRoleStyling = (roleStr: string = '') => {
    const cat = categorizeRole(roleStr);
    switch (cat) {
      case 'director':
        return {
          tier: 'Director / Executive',
          badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          hoverBorder: 'hover:border-rose-500/60',
          activeStyle: 'border-rose-500 ring-2 ring-rose-500/50 bg-gradient-to-br from-rose-950/40 to-slate-950 shadow-[0_0_15px_rgba(244,63,94,0.25)]',
        };
      case 'blitz_mgr':
        return {
          tier: 'Blitz Manager',
          badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          hoverBorder: 'hover:border-amber-500/60',
          activeStyle: 'border-amber-500 ring-2 ring-amber-500/50 bg-gradient-to-br from-amber-950/40 to-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.25)]',
        };
      case 'team_lead':
        return {
          tier: 'Level 3 Team Lead',
          badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
          hoverBorder: 'hover:border-purple-500/60',
          activeStyle: 'border-purple-500 ring-2 ring-purple-500/50 bg-gradient-to-br from-purple-950/40 to-slate-950 shadow-[0_0_15px_rgba(168,85,247,0.25)]',
        };
      case 'trainer':
        return {
          tier: 'Level 2 Trainer',
          badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          hoverBorder: 'hover:border-emerald-500/60',
          activeStyle: 'border-emerald-500 ring-2 ring-emerald-500/50 bg-gradient-to-br from-emerald-950/40 to-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.25)]',
        };
      case 'rep':
      default:
        return {
          tier: 'Level 1 Sales Rep',
          badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
          hoverBorder: 'hover:border-cyan-500/60',
          activeStyle: 'border-cyan-500 ring-2 ring-cyan-500/50 bg-gradient-to-br from-cyan-950/40 to-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.25)]',
        };
    }
  };

  const sortedUsers = [...users].sort((a, b) => {
    // Gurpreet Multani always first
    const aIsGurpreet = a.id === 'user_owner_gurpreet' || (a.email || '').toLowerCase().includes('gurpreet');
    const bIsGurpreet = b.id === 'user_owner_gurpreet' || (b.email || '').toLowerCase().includes('gurpreet');
    if (aIsGurpreet && !bIsGurpreet) return -1;
    if (!aIsGurpreet && bIsGurpreet) return 1;

    const rankWeights: Record<string, number> = {
      director: 5,
      blitz_mgr: 4,
      team_lead: 3,
      trainer: 2,
      rep: 1,
    };
    const catA = categorizeRole(a.role);
    const catB = categorizeRole(b.role);
    if (rankWeights[catA] !== rankWeights[catB]) {
      return (rankWeights[catB] || 0) - (rankWeights[catA] || 0);
    }
    return (a.displayName || '').localeCompare(b.displayName || '');
  });

  const filteredUsers = sortedUsers.filter((u) => {
    if (personaRoleFilter !== 'all' && categorizeRole(u.role) !== personaRoleFilter) {
      return false;
    }
    if (personaSearch.trim()) {
      const q = personaSearch.toLowerCase().trim();
      const matchName = (u.displayName || '').toLowerCase().includes(q);
      const matchRole = (u.role || '').toLowerCase().includes(q);
      const matchTitle = (u.title || '').toLowerCase().includes(q);
      const matchEmail = (u.email || '').toLowerCase().includes(q);
      return matchName || matchRole || matchTitle || matchEmail;
    }
    return true;
  });

  const roleCounts = {
    all: users.length,
    director: users.filter((u) => categorizeRole(u.role) === 'director').length,
    blitz_mgr: users.filter((u) => categorizeRole(u.role) === 'blitz_mgr').length,
    team_lead: users.filter((u) => categorizeRole(u.role) === 'team_lead').length,
    trainer: users.filter((u) => categorizeRole(u.role) === 'trainer').length,
    rep: users.filter((u) => categorizeRole(u.role) === 'rep').length,
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 max-w-4xl w-full max-h-[92vh] overflow-y-auto space-y-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
              Eclipse Governance & Career Ladder
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
            Enterprise Multi-Role Hierarchy
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Standardized 5-tier organizational structure defining responsibilities, squad spans of control, and operational authorities across sales blitz operations.
          </p>
        </div>

        {/* 5-Tier Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {roleDefinitions.map((r, i) => (
            <div
              key={i}
              className={`p-4 rounded-2xl bg-slate-950 border ${
                currentUser?.role?.toLowerCase().includes(r.title.toLowerCase())
                  ? 'border-emerald-500/60 ring-1 ring-emerald-500/30'
                  : 'border-slate-800/80'
              } flex flex-col justify-between space-y-3 transition-all`}
            >
              <div>
                <div className="flex items-center justify-between gap-1.5 mb-1.5">
                  <span className="text-[10px] font-bold uppercase text-slate-400">{r.level}</span>
                  <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase border ${r.color}`}>
                    {r.badge}
                  </span>
                </div>
                <h3 className="text-sm font-black text-white">{r.title}</h3>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">{r.summary}</p>
              </div>

              <div className="pt-2 border-t border-slate-900 space-y-1.5 text-[11px] text-slate-300">
                <p className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1">
                  <Users className="w-3 h-3 text-slate-400" />
                  <span>Scope: {r.squadScope}</span>
                </p>
                <ul className="space-y-1">
                  {r.responsibilities.slice(0, 3).map((item, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 text-[10.5px] text-slate-400">
                      <span className="text-emerald-400 text-xs leading-none">•</span>
                      <span className="leading-tight">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Active Persona Banner */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src={
                currentUser?.badgePhotoUrl ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
              }
              alt=""
              className="w-10 h-10 rounded-xl object-cover ring-2 ring-emerald-500/40"
            />
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Active Session:</span>
              <p className="text-xs font-bold text-white">{currentUser?.displayName}</p>
              <p className="text-[10px] text-slate-400">{currentUser?.title}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Assigned Role:</span>
            <span className="px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              {currentUser?.role}
            </span>
          </div>
        </div>

        {/* Test Switch Personas Across Hierarchy (All Users in Database) */}
        <div className="space-y-3 bg-slate-950 p-4 sm:p-5 rounded-2xl border border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                <label className="text-xs font-black text-white uppercase tracking-wider block">
                  Test Switch Personas Across Hierarchy ({users.length} Team Members)
                </label>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Switch seamlessly into any team member's active profile to test their exact UI tabs, work orders, sales pipeline, and permissions.
              </p>
            </div>

            {/* Quick Return to Gurpreet / Founder */}
            {currentUser?.id !== 'user_owner_gurpreet' && (
              <button
                type="button"
                onClick={() => handleSwitchPersona('user_owner_gurpreet', 'Gurpreet Multani', 'Chief Executive & Founder')}
                className="shrink-0 px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-rose-950/40 border border-white/20 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Return to Gurpreet (Founder / Admin)</span>
              </button>
            )}
          </div>

          {/* Switch Feedback Toast */}
          {switchFeedback && (
            <div className="px-3 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-between animate-in fade-in">
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                {switchFeedback}
              </span>
              <span className="text-[10px] text-emerald-400/80 font-normal">Active session updated</span>
            </div>
          )}

          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search team members by name, title, role, or email..."
                value={personaSearch}
                onChange={(e) => setPersonaSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              {personaSearch && (
                <button
                  type="button"
                  onClick={() => setPersonaSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-[11px]">
              <button
                type="button"
                onClick={() => setPersonaRoleFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition-all ${
                  personaRoleFilter === 'all'
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                All ({roleCounts.all})
              </button>
              <button
                type="button"
                onClick={() => setPersonaRoleFilter('director')}
                className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition-all ${
                  personaRoleFilter === 'director'
                    ? 'bg-rose-500/30 text-rose-300 border border-rose-500/50'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                Directors ({roleCounts.director})
              </button>
              <button
                type="button"
                onClick={() => setPersonaRoleFilter('blitz_mgr')}
                className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition-all ${
                  personaRoleFilter === 'blitz_mgr'
                    ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                Blitz Mgrs ({roleCounts.blitz_mgr})
              </button>
              <button
                type="button"
                onClick={() => setPersonaRoleFilter('team_lead')}
                className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition-all ${
                  personaRoleFilter === 'team_lead'
                    ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                Team Leads ({roleCounts.team_lead})
              </button>
              <button
                type="button"
                onClick={() => setPersonaRoleFilter('trainer')}
                className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition-all ${
                  personaRoleFilter === 'trainer'
                    ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                Trainers ({roleCounts.trainer})
              </button>
              <button
                type="button"
                onClick={() => setPersonaRoleFilter('rep')}
                className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition-all ${
                  personaRoleFilter === 'rep'
                    ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                Reps ({roleCounts.rep})
              </button>
            </div>
          </div>

          {/* User Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-[360px] overflow-y-auto pr-1">
            {filteredUsers.map((u) => {
              const isActive = currentUser?.id === u.id;
              const styling = getRoleStyling(u.role);
              const initials = (u.displayName || 'U')
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase();

              return (
                <div
                  key={u.id}
                  onClick={() => !isActive && handleSwitchPersona(u.id, u.displayName, u.role)}
                  className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between gap-2.5 ${
                    isActive
                      ? styling.activeStyle
                      : `bg-slate-900/80 hover:bg-slate-800/90 border-slate-800 ${styling.hoverBorder} cursor-pointer group`
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${styling.badgeBg}`}>
                        {styling.tier}
                      </span>
                      {isActive ? (
                        <span className="px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wide bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Active View
                        </span>
                      ) : (
                        <span className="text-[8px] text-slate-500 uppercase font-semibold">Click to Switch</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-0.5">
                      {u.badgePhotoUrl ? (
                        <img
                          src={u.badgePhotoUrl}
                          alt={u.displayName}
                          className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-700 shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-black text-slate-300 shrink-0">
                          {initials}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs font-bold truncate ${isActive ? 'text-white' : 'text-slate-200 group-hover:text-white'}`}>
                          {u.displayName}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {u.title || u.role}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                    <span className="text-slate-500 truncate max-w-[130px]">
                      {u.email || u.id}
                    </span>
                    {isActive ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Current
                      </span>
                    ) : (
                      <span className="text-slate-400 group-hover:text-emerald-300 font-bold flex items-center gap-0.5 transition-colors">
                        View <ArrowRight className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredUsers.length === 0 && (
              <div className="col-span-full py-8 text-center text-slate-500 text-xs">
                No team members found matching "{personaSearch}".
              </div>
            )}
          </div>
        </div>

        {/* Detailed Permissions Comparison Matrix */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
              Governance & Operational Authority Matrix
            </h3>
            <span className="text-[10px] text-slate-500">5 Tiers Mapped</span>
          </div>

          <div className="border border-slate-800 rounded-2xl overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300 min-w-[700px]">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[9px] font-bold tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Responsibility / Operation</th>
                  <th className="py-3 px-2 text-center text-cyan-400">L1 Rep</th>
                  <th className="py-3 px-2 text-center text-emerald-400">L2 Trainer</th>
                  <th className="py-3 px-2 text-center text-purple-400">L3 Team Lead</th>
                  <th className="py-3 px-2 text-center text-amber-400">Blitz Mgr</th>
                  <th className="py-3 px-2 text-center text-rose-400">Regional Dir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                {matrix.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-4">
                      <span className="font-semibold text-white block text-xs">{row.feature}</span>
                      <span className="text-[10px] text-slate-400 block">{row.note}</span>
                    </td>
                    {/* Rep */}
                    <td className="py-2 px-2 text-center">
                      {row.rep ? (
                        <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                          <Check className="w-3 h-3" />
                        </span>
                      ) : (
                        <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-600 flex items-center justify-center mx-auto">
                          <X className="w-3 h-3" />
                        </span>
                      )}
                    </td>
                    {/* Trainer */}
                    <td className="py-2 px-2 text-center">
                      {row.trainer ? (
                        <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                          <Check className="w-3 h-3" />
                        </span>
                      ) : (
                        <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-600 flex items-center justify-center mx-auto">
                          <X className="w-3 h-3" />
                        </span>
                      )}
                    </td>
                    {/* Team Lead */}
                    <td className="py-2 px-2 text-center">
                      {row.lead ? (
                        <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                          <Check className="w-3 h-3" />
                        </span>
                      ) : (
                        <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-600 flex items-center justify-center mx-auto">
                          <X className="w-3 h-3" />
                        </span>
                      )}
                    </td>
                    {/* Blitz Manager */}
                    <td className="py-2 px-2 text-center">
                      {row.blitzMgr ? (
                        <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                          <Check className="w-3 h-3" />
                        </span>
                      ) : (
                        <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-600 flex items-center justify-center mx-auto">
                          <X className="w-3 h-3" />
                        </span>
                      )}
                    </td>
                    {/* Regional Director */}
                    <td className="py-2 px-2 text-center">
                      {row.director ? (
                        <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                          <Check className="w-3 h-3" />
                        </span>
                      ) : (
                        <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-600 flex items-center justify-center mx-auto">
                          <X className="w-3 h-3" />
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Admin Quick User Creation */}
        {isAdmin && (
          <div className="border border-slate-800 rounded-2xl p-4 bg-slate-950/40 space-y-3">
            <div>
              <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Executive Admin Console</p>
              <h3 className="text-sm font-bold text-white">Direct Provision User with Role</h3>
            </div>

            {createStatus && (
              <div
                className={`text-xs rounded-xl px-3 py-2 border ${
                  createStatus.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}
              >
                {createStatus.message}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                required
                placeholder="First name"
                value={formData.firstName}
                onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
              <input
                type="text"
                required
                placeholder="Last name"
                value={formData.lastName}
                onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
              <input
                type="email"
                required
                placeholder="Email address"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 sm:col-span-2"
              />
              <input
                type="password"
                required
                placeholder="Initial password"
                value={formData.password}
                onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
              <select
                value={formData.role}
                onChange={(e) => {
                  const r = e.target.value as UserRole;
                  const defaultTitles: Record<string, string> = {
                    'Field Sales Representative': 'Level 1 Field Sales Representative',
                    'Corporate Trainer': 'Level 2 Corporate Trainer & Junior Lead',
                    'Team Lead': 'Level 3 Team Lead',
                    'Blitz Manager': 'Senior Blitz Manager & Operations Lead',
                    'Regional Director': 'Regional Director',
                  };
                  setFormData((prev) => ({ ...prev, role: r, title: defaultTitles[r] || prev.title }));
                }}
                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Field Sales Representative">Level 1: Field Sales Representative</option>
                <option value="Corporate Trainer">Level 2: Corporate Trainer / Junior Lead</option>
                <option value="Team Lead">Level 3: Team Lead</option>
                <option value="Blitz Manager">Blitz Manager</option>
                <option value="Regional Director">Regional Director</option>
              </select>
              <input
                type="text"
                placeholder="Title"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
              <select
                value={formData.managerId}
                onChange={(e) => setFormData((prev) => ({ ...prev, managerId: e.target.value }))}
                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="user_owner_gurpreet">
                  Gurpreet Multani (Founder & Chief Executive - Direct)
                </option>
                {users
                  .filter((u) => u.id !== 'user_owner_gurpreet' && (u.role === 'Admin' || u.role === 'Regional Director' || u.role === 'Blitz Manager' || u.role === 'Team Lead' || u.role === 'Manager'))
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.displayName} ({u.role})
                    </option>
                  ))}
              </select>

              <button
                type="submit"
                className="sm:col-span-2 mt-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/20"
              >
                Create & Assign to Directory
              </button>
            </form>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer transition-colors"
          >
            Close Hierarchy View
          </button>
        </div>
      </div>
    </div>
  );
};
