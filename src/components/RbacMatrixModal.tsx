import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Check, X, Lock, Users, DollarSign, GraduationCap, MapPin, Zap } from 'lucide-react';

interface RbacMatrixModalProps {
  onClose: () => void;
}

export const RbacMatrixModal: React.FC<RbacMatrixModalProps> = ({ onClose }) => {
  const { currentUser, loginAs, users } = useAuth();

  const matrix = [
    {
      feature: 'Change User Titles & Roles',
      admin: true,
      manager: true,
      representative: false,
      note: 'Protected: Only Admin or Manager can assign job titles and system roles',
    },
    {
      feature: 'Change ISP Commission Pay Rates',
      admin: true,
      manager: true,
      representative: false,
      note: 'Protected: Only Admin or Manager can modify carrier payout schedules',
    },
    {
      feature: 'Upload & Create Training Coursework',
      admin: true,
      manager: true,
      representative: false,
      note: 'Managers & Admins can author lessons, videos, assignments & quizzes',
    },
    {
      feature: 'Launch New State Blitzes & Hotel Hubs',
      admin: true,
      manager: true,
      representative: false,
      note: 'Territory creation and per diem configuration',
    },
    {
      feature: 'Manage Team & Assign Reps',
      admin: true,
      manager: true,
      representative: false,
      note: 'View squad performance and manage subordinate reps',
    },
    {
      feature: 'Access Training Materials & Take Exams',
      admin: true,
      manager: true,
      representative: true,
      note: 'All roles have full access to study modules, scripts, and exams',
    },
    {
      feature: 'Track Sales & Log Customer Orders',
      admin: true,
      manager: true,
      representative: true,
      note: 'Track orders, calculate commissions, and record door sales',
    },
    {
      feature: 'Manage Personal Profile & Direct Deposit',
      admin: true,
      manager: true,
      representative: true,
      note: 'Bank details, emergency contacts, travel profile & security badge',
    },
    {
      feature: 'Full System Control & User Directory Delete',
      admin: true,
      manager: false,
      representative: false,
      note: 'Exclusive to Admin role',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 max-w-3xl w-full max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
              Access Governance & Security Architecture
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
            Role-Based Access Control (RBAC) System
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Enforced across Firebase Firestore security rules, server validation, and interactive UI states.
          </p>
        </div>

        {/* Current Active Role Card */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src={currentUser?.badgePhotoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
              alt=""
              className="w-10 h-10 rounded-xl object-cover ring-2 ring-emerald-500/40"
            />
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Active Session:</span>
              <p className="text-xs font-bold text-white">{currentUser?.displayName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Current Role:</span>
            <span
              className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider ${
                currentUser?.role?.toLowerCase() === 'admin' || currentUser?.role?.toLowerCase() === 'owner'
                  ? 'bg-amber-400/20 text-amber-400 border border-amber-400/30'
                  : currentUser?.role?.toLowerCase() === 'manager'
                  ? 'bg-emerald-400/20 text-emerald-400 border border-emerald-400/30'
                  : 'bg-cyan-400/20 text-emerald-400 border border-emerald-400/30'
              }`}
            >
              {currentUser?.role}
            </span>
          </div>
        </div>

        {/* Quick Role Switcher for Testing */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Test Switch Personas by Role:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {/* Admin Persona */}
            <button
              onClick={() => loginAs('user_owner_gurpreet')}
              className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-amber-500/30 text-left transition-all group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-white group-hover:text-amber-300">
                  Gurpreet Multani
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-amber-400/20 text-amber-400">
                  Admin
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Full system control, pay rates, all users</p>
            </button>

            {/* Manager Persona */}
            <button
              onClick={() => loginAs('user_mgr_marcus')}
              className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-purple-500/30 text-left transition-all group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-white group-hover:text-emerald-300">
                  Marcus Vance
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-400/20 text-emerald-400">
                  Manager
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Upload coursework, team & pay management</p>
            </button>

            {/* Representative Persona */}
            <button
              onClick={() => loginAs('user_rep_jordan')}
              className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-emerald-500/30 text-left transition-all group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-white group-hover:text-emerald-300">
                  Jordan Hayes
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-cyan-400/20 text-emerald-400">
                  Representative
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Sales tracking, training, profile & badge</p>
            </button>
          </div>
        </div>

        {/* Permissions Comparison Table */}
        <div className="border border-slate-800 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Capability / Operation</th>
                <th className="py-3 px-3 text-center text-amber-400">Admin</th>
                <th className="py-3 px-3 text-center text-emerald-400">Manager</th>
                <th className="py-3 px-3 text-center text-emerald-400">Representative</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
              {matrix.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30">
                  <td className="py-3 px-4">
                    <span className="font-semibold text-white block">{row.feature}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">{row.note}</span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    {row.admin ? (
                      <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
                        <X className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {row.manager ? (
                      <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
                        <X className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {row.representative ? (
                      <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
                        <X className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
          >
            Close Matrix
          </button>
        </div>
      </div>
    </div>
  );
};
