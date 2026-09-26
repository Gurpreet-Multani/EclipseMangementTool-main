import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import eclipseLogo from '../Images/EclipseLogo.JPG';
import { ArrowRight, Lock, Mail } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { loginWithCredentials } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const res = await loginWithCredentials(email, password);
    if (!res.success) {
      setErrorMsg(res.error || 'Invalid credentials.');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 text-slate-100">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="relative mx-auto w-20 h-20 rounded-full border border-[#d8a978]/60 bg-[#0f1412] shadow-[0_0_30px_rgba(214,168,114,0.2)] ring-3 ring-[#d8a978]/25 flex items-center justify-center">
            <img
              src={eclipseLogo}
              alt="Eclipse logo"
              className="w-[72px] h-[72px] rounded-full object-cover"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Eclipse Dashboard Pro
          </h1>
          <p className="text-xs text-slate-400">
            Field Sales, State Operations & Synchronized Cloud Platform
          </p>
        </div>

        {/* Credentials Form Box */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl backdrop-blur-xl">
          <div className="p-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-[11px] text-emerald-200">
            Sign in with your assigned account credentials. New users must be created by an Admin in the RBAC system.
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="rep@eclipsedashboard.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5 active:scale-95"
            >
              <span>Sign In to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
