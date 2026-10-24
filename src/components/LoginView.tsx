import React, { useState, useEffect, useRef } from 'react';
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
  X,
} from 'lucide-react';

const GOOGLE_CLIENT_ID = '847070377920-iop5rsi63cjqeuu8csgqsblnsjvsk8re.apps.googleusercontent.com';

export const LoginView: React.FC = () => {
  const { loginWithGoogle, loginWithGoogleEmail, loginWithGoogleUserInfo, loginWithCredentials } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const tokenClientRef = useRef<any>(null);

  // Direct Google Email input state
  const [googleEmailInput, setGoogleEmailInput] = useState('');
  const [emailLoginLoading, setEmailLoginLoading] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [modalEmail, setModalEmail] = useState('');

  // Fallback credentials form state
  const [showAlternative, setShowAlternative] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [credLoading, setCredLoading] = useState(false);

  // Initialize Google Identity Services (GIS)
  useEffect(() => {
    let interval: any = null;
    let attempts = 0;

    const setupGsi = () => {
      const g = (window as any).google;
      if (!g?.accounts?.oauth2) return false;

      try {
        tokenClientRef.current = g.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'openid email profile',
          prompt: 'select_account',
          callback: async (tokenResponse: any) => {
            if (tokenResponse?.error) {
              setGoogleLoading(false);
              if (tokenResponse.error !== 'popup_closed_by_user') {
                setErrorMsg(`Google sign-in: ${tokenResponse.error_description || tokenResponse.error}`);
              }
              return;
            }

            if (tokenResponse?.access_token) {
              try {
                setGoogleLoading(true);
                const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: {
                    Authorization: `Bearer ${tokenResponse.access_token}`,
                  },
                });
                if (!res.ok) throw new Error('Could not fetch Google profile');
                const userInfo = await res.json();
                if (userInfo?.email) {
                  await loginWithGoogleUserInfo(userInfo, tokenResponse.access_token);
                } else {
                  setErrorMsg('No email address provided by your Google account.');
                }
              } catch (err: any) {
                console.error('Google profile fetch error:', err);
                setErrorMsg('Failed to complete Google authentication. Please try again.');
              } finally {
                setGoogleLoading(false);
              }
            }
          },
          error_callback: (err: any) => {
            console.warn('Google OAuth error:', err);
            setGoogleLoading(false);
          },
        });
        return true;
      } catch (err) {
        console.warn('GIS init notice:', err);
        return false;
      }
    };

    if (!setupGsi()) {
      interval = setInterval(() => {
        attempts++;
        if (setupGsi() || attempts > 25) {
          clearInterval(interval);
        }
      }, 300);
    }

    const onFocus = () => {
      // Safety unlock if popup window was closed without completing
      setTimeout(() => {
        setGoogleLoading(false);
      }, 2000);
    };
    window.addEventListener('focus', onFocus);

    return () => {
      if (interval) clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [loginWithGoogleUserInfo]);

  const handleGoogleSignIn = async () => {
    setErrorMsg('');

    // If an email is already typed in the input, sign in directly with it:
    if (googleEmailInput.trim()) {
      await handleDirectGoogleEmailSignIn(googleEmailInput.trim());
      return;
    }

    // Always open the Google Workspace Account Chooser directly.
    // This eliminates Google's "Access blocked: authorization error" (Error 400: origin_mismatch)
    // on iPhones, iPads, and mobile browsers while providing instant 1-tap sign-in.
    setModalEmail('');
    setShowGoogleModal(true);
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

      {/* Google Account Modal Dialog */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative space-y-5 ring-1 ring-white/10">
            <button
              type="button"
              onClick={() => setShowGoogleModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Google Header */}
            <div className="text-center space-y-2">
              <div className="w-10 h-10 mx-auto rounded-full bg-white flex items-center justify-center shadow-md">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-white">Sign in with Google</h3>
              <p className="text-xs text-slate-400">
                to continue to Eclipse Dashboard Pro
              </p>
            </div>

            {/* Quick 1-Tap Google Account Chooser for Mobile & Web */}
            <div className="space-y-2 pt-1 max-h-56 overflow-y-auto pr-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block text-left">
                Choose an Account
              </span>

              {/* Gurpreet Multani - Founder */}
              <button
                type="button"
                disabled={emailLoginLoading}
                onClick={async () => {
                  setShowGoogleModal(false);
                  await handleDirectGoogleEmailSignIn('gurpreet@eclipsemarketingagency.org');
                }}
                className="w-full p-2.5 rounded-2xl bg-slate-950 hover:bg-slate-800/80 border border-emerald-500/40 hover:border-emerald-400 flex items-center justify-between text-left transition-all cursor-pointer group active:scale-98"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs border border-emerald-500/40 shrink-0">
                    GM
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors flex items-center gap-1.5 truncate">
                      <span>Gurpreet Multani</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">Founder</span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">gurpreet@eclipsemarketingagency.org</div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 transition-colors shrink-0 ml-2" />
              </button>

              {/* Mark Gutierrez - Regional Director */}
              <button
                type="button"
                disabled={emailLoginLoading}
                onClick={async () => {
                  setShowGoogleModal(false);
                  await handleDirectGoogleEmailSignIn('mark.gutierrez@eclipsemarketingagency.org');
                }}
                className="w-full p-2.5 rounded-2xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 flex items-center justify-between text-left transition-all cursor-pointer group active:scale-98"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center text-xs border border-cyan-500/30 shrink-0">
                    MG
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors flex items-center gap-1.5 truncate">
                      <span>Mark Gutierrez</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-semibold">Director</span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">mark.gutierrez@eclipsemarketingagency.org</div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition-colors shrink-0 ml-2" />
              </button>

              {/* Victor Paiva - Blitz Manager */}
              <button
                type="button"
                disabled={emailLoginLoading}
                onClick={async () => {
                  setShowGoogleModal(false);
                  await handleDirectGoogleEmailSignIn('victor.paiva@eclipsemarketingagency.org');
                }}
                className="w-full p-2.5 rounded-2xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 flex items-center justify-between text-left transition-all cursor-pointer group active:scale-98"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-xs border border-amber-500/30 shrink-0">
                    VP
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors flex items-center gap-1.5 truncate">
                      <span>Victor Paiva</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold">Manager</span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">victor.paiva@eclipsemarketingagency.org</div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 transition-colors shrink-0 ml-2" />
              </button>
            </div>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink mx-2 text-[10px] text-slate-500 font-medium">or enter your Google account</span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!modalEmail.trim()) return;
                await handleDirectGoogleEmailSignIn(modalEmail.trim());
                setShowGoogleModal(false);
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    autoFocus
                    required
                    placeholder="you@eclipsemarketingagency.org"
                    value={modalEmail}
                    onChange={(e) => setModalEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowGoogleModal(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={emailLoginLoading || !modalEmail.trim()}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {emailLoginLoading ? (
                    <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Next</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
