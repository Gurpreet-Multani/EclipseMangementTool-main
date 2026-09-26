import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import eclipseLogo from '../Images/EclipseLogo.JPG';
import { Zap, Shield, User, ArrowRight, Lock, Mail, CheckCircle2 } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { loginWithCredentials, registerUser, loginAs, users } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    if (isRegister) {
      const res = await registerUser({
        email,
        firstName,
        lastName,
        displayName: `${firstName} ${lastName}`.trim(),
      });
      if (!res.success) {
        setErrorMsg(res.error || 'Failed to create account.');
      }
    } else {
      const res = await loginWithCredentials(email, password);
      if (!res.success) {
        setErrorMsg(res.error || 'Invalid credentials.');
      }
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
          <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800">
            <button
              onClick={() => {
                setIsRegister(false);
                setErrorMsg('');
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                !isRegister
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setIsRegister(true);
                setErrorMsg('');
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                isRegister
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Register Rep
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {isRegister && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Jordan"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Hayes"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            )}

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
              <span>{isRegister ? 'Create Account & Access' : 'Sign In to Dashboard'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* 1-Click Persona Quick Access (For seamless evaluation and onboarding) */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Quick Demo Personas (One-Click Sign In)
            </span>
          </div>

          <div className="space-y-2">
            {users.slice(0, 4).map((u) => (
              <button
                key={u.id}
                onClick={() => loginAs(u.id)}
                className="w-full p-2.5 rounded-2xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 flex items-center justify-between transition-all group text-left"
              >
                <div className="flex items-center gap-2.5">
                  <img
                    src={u.badgePhotoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                    alt=""
                    className="w-8 h-8 rounded-xl object-cover ring-1 ring-emerald-500/40"
                  />
                  <div>
                    <p className="text-xs font-bold text-white group-hover:text-emerald-300">
                      {u.displayName}
                    </p>
                    <p className="text-[10px] text-slate-400">{u.title || u.role}</p>
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                    u.role === 'Admin'
                      ? 'bg-amber-400/20 text-amber-400'
                      : u.role === 'Manager'
                      ? 'bg-emerald-400/20 text-emerald-400'
                      : 'bg-cyan-400/20 text-emerald-400'
                  }`}
                >
                  {u.role}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
