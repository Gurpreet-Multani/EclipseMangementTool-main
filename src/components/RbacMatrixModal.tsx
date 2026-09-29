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
} from 'lucide-react';
import { UserRole } from '../types';

interface RbacMatrixModalProps {
  onClose: () => void;
}

export const RbacMatrixModal: React.FC<RbacMatrixModalProps> = ({ onClose }) => {
  const { currentUser, loginAs, users, isAdmin, createUserByAdmin } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'Field Sales Representative' as UserRole,
    title: 'Level 1 Field Sales Representative',
    managerId: 'user_rep_jordan',
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

        {/* Quick Role Switcher for Testing All 5 Roles */}
        {isAdmin && (
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Test Switch Personas Across Hierarchy:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <button
                onClick={() => loginAs('user_owner_gurpreet')}
                className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-rose-500/30 text-left transition-all group"
              >
                <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-rose-400/20 text-rose-400 block mb-1">
                  Director
                </span>
                <p className="text-[11px] font-bold text-white group-hover:text-rose-300 truncate">
                  Gurpreet Multani
                </p>
                <p className="text-[9px] text-slate-500 truncate">Regional Director</p>
              </button>

              <button
                onClick={() => loginAs('user_mgr_marcus')}
                className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-amber-500/30 text-left transition-all group"
              >
                <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-amber-400/20 text-amber-400 block mb-1">
                  Blitz Mgr
                </span>
                <p className="text-[11px] font-bold text-white group-hover:text-amber-300 truncate">
                  Marcus Vance
                </p>
                <p className="text-[9px] text-slate-500 truncate">Blitz Manager</p>
              </button>

              <button
                onClick={() => loginAs('user_rep_jordan')}
                className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-purple-500/30 text-left transition-all group"
              >
                <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-purple-400/20 text-purple-400 block mb-1">
                  Level 3
                </span>
                <p className="text-[11px] font-bold text-white group-hover:text-purple-300 truncate">
                  Jordan Hayes
                </p>
                <p className="text-[9px] text-slate-500 truncate">Team Lead</p>
              </button>

              <button
                onClick={() => loginAs('user_rep_elena')}
                className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-emerald-500/30 text-left transition-all group"
              >
                <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-emerald-400/20 text-emerald-400 block mb-1">
                  Level 2
                </span>
                <p className="text-[11px] font-bold text-white group-hover:text-emerald-300 truncate">
                  Elena Rivera
                </p>
                <p className="text-[9px] text-slate-500 truncate">Corporate Trainer</p>
              </button>

              <button
                onClick={() => loginAs('user_rep_tyler')}
                className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-cyan-500/30 text-left transition-all group"
              >
                <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-cyan-400/20 text-cyan-400 block mb-1">
                  Level 1
                </span>
                <p className="text-[11px] font-bold text-white group-hover:text-cyan-300 truncate">
                  Tyler Chen
                </p>
                <p className="text-[9px] text-slate-500 truncate">Field Sales Rep</p>
              </button>
            </div>
          </div>
        )}

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
                {users.map((u) => (
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
