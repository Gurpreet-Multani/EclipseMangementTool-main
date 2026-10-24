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
} from 'lucide-react';

export const LoginView: React.FC = () => {
  const { loginWithGoogle, loginWithGoogleEmail, loginWithCredentials } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Direct Google Email input state
  const [googleEmailInput, setGoogleEmailInput] = useState('');
  const [emailLoginLoading, setEmailLoginLoading] = useState(false);

  // Fallback credentials form state
  const [showAlternative, setShowAlternative] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [credLoading, setCredLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setGoogleLoading(true);

    // If email is already provided in the input, sign in directly with it:
    if (googleEmailInput.trim()) {
      await handleDirectGoogleEmailSignIn(googleEmailInput.trim());
      setGoogleLoading(false);
      return;
    }

    // Attempt Firebase Google Popup sign-in
    const res = await loginWithGoogle();
    if (res.success) {
      setGoogleLoading(false);
      return;
    }

    if (res.code === 'auth/popup-closed-by-user') {
      setErrorMsg('Google sign-in popup was closed. Enter your Google email below to continue.');
      setGoogleLoading(false);
      return;
    }

    // When popups or domain redirects are restricted, prompt for the email
    setErrorMsg('Please enter your Google Workspace email address below to sign in:');
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
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.15),transparent_40%),linear-gradient(135deg,#020817_0%,#051914_40%,#020817_100%)] flex flex-col justify-center items-center px-4 pt-[max(env(safe-area-inset-top,0px),1.5rem)] pb-[max(env(safe-area-inset-bottom,0px),1.5rem)] sm:p-6 text-slate-100 relative overflow-hidden">
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

          {/* Google Sign-in Options */}
          <div className="space-y-4">
            <div className="text-center space-y-1">
              <p className="text-xs text-slate-300 font-semibold">
                Sign in with your Google Account
              </p>
              <p className="text-[11px] text-slate-400">
                Official single sign-on for Eclipse Marketing Agency team members
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
                  <span className="text-slate-800 text-xs">Authenticating with Google...</span>
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

            {/* Divider */}
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink mx-3 text-[11px] text-slate-500 font-medium">or enter Google Workspace email</span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>

            {/* Direct Google Workspace Email Entry */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    placeholder="name@eclipsemarketingagency.org"
                    value={googleEmailInput}
                    onChange={(e) => setGoogleEmailInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleDirectGoogleEmailSignIn();
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleDirectGoogleEmailSignIn()}
                  disabled={emailLoginLoading || !googleEmailInput.trim()}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-emerald-500/20 active:scale-95 shrink-0"
                >
                  {emailLoginLoading ? (
                    <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Security Badge */}
          <div className="pt-1 flex items-center justify-center gap-1.5 text-[11px] text-emerald-400/90 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Secured with Firebase Authentication & Firestore</span>
          </div>

          {/* Collapsible Alternative: Email & Password */}
          <div className="pt-3 border-t border-slate-800/80">
            <button
              type="button"
              onClick={() => setShowAlternative(!showAlternative)}
              className="w-full flex items-center justify-between text-[11px] text-slate-400 hover:text-slate-300 py-1 font-medium transition-colors"
            >
              <span>Alternative: Staff Password Sign In</span>
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
