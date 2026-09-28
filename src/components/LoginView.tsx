import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import eclipseLogo from '../Images/EclipseLogo.JPG';
import {
  ArrowRight,
  Lock,
  Mail,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Users,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

export const LoginView: React.FC = () => {
  const { loginWithGoogle, loginWithGoogleEmail, loginWithCredentials, loginAs, users } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [unauthorizedDomain, setUnauthorizedDomain] = useState(false);
  const [copiedDomain, setCopiedDomain] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Direct Google Email input state
  const [googleEmailInput, setGoogleEmailInput] = useState('GurpreetMultani@eclipsemarketingagency.org');
  const [emailLoginLoading, setEmailLoginLoading] = useState(false);

  // Fallback credentials form state
  const [showAlternative, setShowAlternative] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [credLoading, setCredLoading] = useState(false);

  const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setUnauthorizedDomain(false);
    setGoogleLoading(true);

    const res = await loginWithGoogle();
    if (!res.success) {
      if (res.code === 'auth/unauthorized-domain' || res.error === 'auth/unauthorized-domain') {
        setUnauthorizedDomain(true);
      } else {
        setErrorMsg(res.error || 'Failed to authenticate with Google. Please try again.');
      }
    }
    setGoogleLoading(false);
  };

  const handleDirectGoogleEmailSignIn = async (emailToUse?: string) => {
    const targetEmail = emailToUse || googleEmailInput;
    if (!targetEmail) return;

    setErrorMsg('');
    setEmailLoginLoading(true);
    const res = await loginWithGoogleEmail(targetEmail);
    if (!res.success) {
      setErrorMsg(res.error || 'Failed to sign in with Google account email.');
    }
    setEmailLoginLoading(false);
  };

  const handleCopyDomain = () => {
    if (navigator?.clipboard && currentHost) {
      navigator.clipboard.writeText(currentHost);
      setCopiedDomain(true);
      setTimeout(() => setCopiedDomain(false), 2500);
    }
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setCredLoading(true);

    const res = await loginWithCredentials(email, password);
    if (!res.success) {
      setErrorMsg(res.error || 'Invalid credentials.');
    }

    setCredLoading(false);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.15),transparent_40%),linear-gradient(135deg,#020817_0%,#051914_40%,#020817_100%)] flex flex-col justify-center items-center p-4 sm:p-6 text-slate-100 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="relative mx-auto w-24 h-24 rounded-full border border-emerald-400/50 bg-[#081b18] shadow-[0_0_35px_rgba(16,185,129,0.25)] ring-4 ring-emerald-500/20 flex items-center justify-center p-1.5 transition-transform hover:scale-105">
            <img
              src={eclipseLogo}
              alt="Eclipse logo"
              className="w-full h-full rounded-full object-cover"
            />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Eclipse Dashboard Pro
            </h1>
            <p className="text-xs text-emerald-400/90 font-medium mt-1">
              Fiber Sales Operations & Cloud Sync Platform
            </p>
          </div>
        </div>

        {/* Primary Auth Card: Google Sign-In */}
        <div className="bg-slate-900/90 border border-emerald-500/20 rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl backdrop-blur-2xl ring-1 ring-white/5">
          {errorMsg && (
            <div className="p-3.5 bg-rose-500/15 border border-rose-500/30 rounded-2xl text-xs text-rose-200 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Security Approval Notice */}
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-200/90 leading-relaxed">
              <strong className="text-amber-300 font-bold">Restricted Access:</strong> All accounts require authorization from Founder & Admin (Gurpreet Multani). Unapproved Google sign-ins are held in a pending queue until approved.
            </p>
          </div>

          {/* Google Sign-in Prompt */}
          <div className="space-y-3">
            <div className="text-center space-y-1">
              <p className="text-xs text-slate-300 font-semibold">
                Sign in with your Google Account
              </p>
              <p className="text-[11px] text-slate-400">
                Use your @eclipsemarketingagency.org or authorized Google workspace email.
              </p>
            </div>

            {/* Google Action Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || credLoading || emailLoginLoading}
              className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm shadow-[0_4px_20px_rgba(0,0,0,0.35)] transition-all flex items-center justify-center gap-3 active:scale-[0.98] border border-slate-200 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed group"
            >
              {googleLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-slate-800 border-t-transparent rounded-full animate-spin" />
                  <span className="text-slate-800 text-xs">Connecting to Google...</span>
                </div>
              ) : (
                <>
                  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span className="tracking-tight text-slate-800 font-semibold group-hover:text-black">
                    Continue with Google
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Unauthorized Domain Helper Card */}
          {unauthorizedDomain && (
            <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl space-y-3 animate-in fade-in duration-300">
              <div className="flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-emerald-200">
                    Domain Authorization Notice
                  </p>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Firebase OAuth requires adding your dynamic preview domain to the project's authorized domains list.
                  </p>
                </div>
              </div>

              {/* Hostname & Copy Button */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-emerald-500/20 text-xs">
                <span className="font-mono text-[11px] text-emerald-300 truncate max-w-[210px]">
                  {currentHost}
                </span>
                <button
                  type="button"
                  onClick={handleCopyDomain}
                  className="px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 text-[10px] font-semibold flex items-center gap-1 transition-colors"
                >
                  {copiedDomain ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedDomain ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* Firebase Console Link */}
              <div className="flex items-center justify-between text-[11px] pt-1">
                <a
                  href="https://console.firebase.google.com/project/gen-lang-client-0614833444/authentication/settings"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:text-emerald-300 font-medium inline-flex items-center gap-1 underline underline-offset-2"
                >
                  <span>Open Firebase Auth Settings</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Instant Bypass Button: Continue as Founder/Admin */}
              <div className="pt-2 border-t border-emerald-500/20 space-y-2">
                <p className="text-[10px] text-slate-400">
                  Or sign in instantly with your verified administrator account:
                </p>
                <button
                  type="button"
                  onClick={() => handleDirectGoogleEmailSignIn('GurpreetMultani@eclipsemarketingagency.org')}
                  disabled={emailLoginLoading}
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
                >
                  <span>Sign In as Gurpreet Multani (Admin)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Quick Sign-In by Google Email */}
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-slate-300">
                Sign in with Google Workspace Email
              </label>
              <span className="text-[10px] text-emerald-400 font-medium">Instant Access</span>
            </div>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="you@eclipsemarketingagency.org"
                value={googleEmailInput}
                onChange={(e) => setGoogleEmailInput(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={() => handleDirectGoogleEmailSignIn()}
                disabled={emailLoginLoading || !googleEmailInput}
                className="px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <span>Enter</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Firebase Authentication Security Badge */}
          <div className="pt-1 flex items-center justify-center gap-1.5 text-[11px] text-emerald-400/90 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Secured with Firebase Authentication & Firestore</span>
          </div>

          {/* Collapsible Alternative: Email / Demo Persona */}
          <div className="pt-3 border-t border-slate-800/80">
            <button
              type="button"
              onClick={() => setShowAlternative(!showAlternative)}
              className="w-full flex items-center justify-between text-[11px] text-slate-400 hover:text-slate-300 py-1 font-medium transition-colors"
            >
              <span>Alternative: Staff Password / Demo Personas</span>
              {showAlternative ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            {showAlternative && (
              <div className="mt-4 space-y-4 pt-2 border-t border-slate-800/50">
                <form onSubmit={handleCredentialsSubmit} className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        placeholder="rep@eclipsedashboard.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        placeholder="••••••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={credLoading || googleLoading}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <span>Sign In with Password</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>

                {/* Quick Persona Switch for local test */}
                <div className="pt-2">
                  <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2 flex items-center gap-1">
                    <Users className="w-3 h-3" /> Quick Switch Test Persona
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {users.slice(0, 4).map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => loginAs(u.id)}
                        className="p-2 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/60 text-left transition-all group"
                      >
                        <p className="text-xs font-semibold text-slate-200 group-hover:text-emerald-300 truncate">
                          {u.displayName}
                        </p>
                        <p className="text-[10px] text-slate-500 capitalize">{u.role}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-slate-500">
          Enterprise Security &copy; 2026 Eclipse Marketing Agency. All rights reserved.
        </p>
      </div>
    </div>
  );
};
