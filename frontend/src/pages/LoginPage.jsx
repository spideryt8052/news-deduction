import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  ShieldCheck, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle, 
  Sparkles, 
  Shield, 
  Flame,
  KeyRound,
  RefreshCw,
  Send,
  Fingerprint,
  CheckCircle2,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DarkSoulsHoloCard } from "@designcodeio/threeui";
import "@designcodeio/threeui/style.css";

export default function LoginPage() {
  const { login, sendOtp, loginWithOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Mode: 'password' | 'otp'
  const [authMode, setAuthMode] = useState('password');

  // Common email state
  const [email, setEmail] = useState('');
  
  // Password Mode States
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // OTP Mode States
  const [otpSent, setOtpSent] = useState(false);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const otpInputRefs = useRef([]);

  // Shared status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Redirection target
  const from = location.state?.from?.pathname || null;

  // Countdown timer for OTP mode
  useEffect(() => {
    let timer;
    if (otpSent && resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpSent, resendTimer]);

  // Auto-focus first digit when OTP mode activates
  useEffect(() => {
    if (otpSent) {
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 150);
    }
  }, [otpSent]);

  const handleRedirect = (user) => {
    if (from) {
      navigate(from, { replace: true });
    } else if (user.role === 'admin') {
      navigate('/admin', { replace: true });
    } else {
      navigate('/user/panel', { replace: true });
    }
  };

  // PASSWORD SIGN IN
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }
    setError('');
    setLoading(true);

    const res = await login(email.trim().toLowerCase(), password);
    setLoading(false);

    if (res.success) {
      handleRedirect(res.user);
    } else {
      setError(res.error || 'Authentication failed. Please check your credentials.');
    }
  };

  // OTP STEP 1: Send OTP
  const handleSendOtp = async (e) => {
    e?.preventDefault();
    setError('');
    setSuccessMsg('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter a valid registered email address.');
      return;
    }

    setLoading(true);
    const res = await sendOtp(cleanEmail, 'login');
    setLoading(false);

    if (res.success) {
      setOtpSent(true);
      setResendTimer(60);
      setCanResend(false);
      setSuccessMsg(`6-digit verification code sent to ${cleanEmail}`);
    } else {
      setError(res.error || 'Failed to dispatch login code. Ensure this email is registered.');
    }
  };

  // OTP DIGIT INPUT HANDLING
  const handleDigitChange = (index, val) => {
    const cleaned = val.replace(/[^0-9]/g, '');
    const updated = [...otpDigits];

    if (cleaned.length > 1) {
      // Pasted string
      const pasted = cleaned.slice(0, 6).split('');
      pasted.forEach((ch, idx) => {
        if (idx < 6) updated[idx] = ch;
      });
      setOtpDigits(updated);
      const nextIdx = Math.min(pasted.length, 5);
      otpInputRefs.current[nextIdx]?.focus();
      return;
    }

    updated[index] = cleaned;
    setOtpDigits(updated);

    if (cleaned && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleDigitKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // OTP STEP 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const otp = otpDigits.join('');
    if (otp.length !== 6) {
      setError('Please enter all 6 digits of the verification code.');
      return;
    }

    setError('');
    setLoading(true);

    const res = await loginWithOtp(email.trim().toLowerCase(), otp);
    setLoading(false);

    if (res.success) {
      handleRedirect(res.user);
    } else {
      setError(res.error || 'Invalid or expired OTP code.');
    }
  };

  // Quick Viva & Demo Login
  const handleQuickLogin = async (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
    setLoading(true);

    const res = await login(demoEmail, demoPassword);
    setLoading(false);

    if (res.success) {
      handleRedirect(res.user);
    } else {
      setError(res.error || 'Demo login failed.');
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          
          {/* Left Column: Interactive 3D Holographic Artifact */}
          <div className="lg:col-span-6 xl:col-span-7 flex flex-col items-center">
            <div className="w-full max-w-lg lg:max-w-none space-y-3">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-500 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    Cindermane Artifact
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  Move • Drag • Double-Click to Flip
                </span>
              </div>

              {/* ThreeUI HoloCard */}
              <div className="shader-frame h-[420px] sm:h-[500px] lg:h-[590px] rounded-3xl border border-amber-500/25 shadow-2xl shadow-amber-950/40 overflow-hidden bg-[#050404]">
                <DarkSoulsHoloCard variant="cindermane" />
              </div>
            </div>
          </div>

          {/* Right Column: Sign In Form & Quick Access */}
          <div className="lg:col-span-6 xl:col-span-5 w-full max-w-md mx-auto">
            
            {/* Header Icon & Brand */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-purple-600 shadow-xl shadow-cyan-500/20 mb-3 ring-1 ring-white/20">
                <ShieldCheck className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Welcome to TruthShield
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1.5">
                Multi-Modal Fact Checking & Deepfake Defense System
              </p>
            </div>

            {/* 1-Click Demo Logins Banner */}
            <div className="mb-4 p-3 rounded-xl bg-dark-800/80 border border-cyan-500/30 backdrop-blur-sm shadow-lg shadow-cyan-500/5">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-cyan-400">
                  Viva & Quick Demo Access
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin@truthshield.com', 'admin123')}
                  disabled={loading}
                  className="py-1.5 px-3 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 hover:text-white text-xs font-medium transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Shield className="w-3.5 h-3.5 text-purple-400" />
                  <span>Admin Demo</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('user@truthshield.com', 'user123')}
                  disabled={loading}
                  className="py-1.5 px-3 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 hover:text-white text-xs font-medium transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                  <span>User Demo</span>
                </button>
              </div>
            </div>

            {/* Main Glassmorphic Form Card */}
            <div className="glass-panel p-6 sm:p-7 rounded-2xl border border-white/10 bg-dark-800/70 backdrop-blur-xl shadow-2xl relative overflow-hidden">
              
              {/* Dual Tab Mode Switcher: Password vs Email OTP */}
              <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-dark-900/90 border border-white/5 mb-5">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('password');
                    setError('');
                    setSuccessMsg('');
                  }}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    authMode === 'password'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Password</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('otp');
                    setError('');
                    setSuccessMsg('');
                  }}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    authMode === 'otp'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Fingerprint className="w-3.5 h-3.5" />
                  <span>Email OTP</span>
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div className="flex-1">{error}</div>
                </div>
              )}

              {/* Success Message */}
              {successMsg && (
                <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="flex-1">{successMsg}</div>
                </div>
              )}

              {/* ---------------- MODE 1: PASSWORD LOGIN ---------------- */}
              {authMode === 'password' && (
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@domain.com"
                        required
                        className="w-full pl-10 pr-4 py-2.5 bg-dark-900/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-slate-300">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('otp');
                          setError('');
                        }}
                        className="text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors"
                      >
                        Forgot / Sign in with OTP?
                      </button>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full pl-10 pr-10 py-2.5 bg-dark-900/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 focus:outline-none cursor-pointer"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium text-xs sm:text-sm shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Authenticating...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In with Password</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* ---------------- MODE 2: EMAIL OTP LOGIN ---------------- */}
              {authMode === 'otp' && (
                <div>
                  {!otpSent ? (
                    // OTP Step A: Enter Email to receive code
                    <form onSubmit={handleSendOtp} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                          Registered Email Address
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                            <Mail className="w-4 h-4" />
                          </div>
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@domain.com"
                            required
                            className="w-full pl-10 pr-4 py-2.5 bg-dark-900/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
                          />
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1.5">
                          We will send a 6-digit one-time login code to this email.
                        </p>
                      </div>

                      <button
                        type="submit"
                        disabled={loading || !email}
                        className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-medium text-xs sm:text-sm shadow-lg shadow-purple-500/25 transition-all flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <span>Sending Code...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            <span>Send 6-Digit Login Code</span>
                          </>
                        )}
                      </button>
                    </form>
                  ) : (
                    // OTP Step B: Enter 6 Digits
                    <form onSubmit={handleVerifyOtp} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => {
                            setOtpSent(false);
                            setOtpDigits(['', '', '', '', '', '']);
                          }}
                          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          <span>Change Email</span>
                        </button>
                        <span className="text-[11px] font-mono text-purple-400">
                          {email}
                        </span>
                      </div>

                      {/* Gmail Inbox Security Reminder */}
                      <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-center space-y-0.5">
                        <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-purple-300">
                          <Mail className="w-3.5 h-3.5 text-purple-400" />
                          <span>Code sent to your Gmail inbox</span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Please check your Gmail inbox or Spam folder for your 6-digit login code.
                        </p>
                      </div>

                      {/* 6 Digit Individual Inputs */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-2 text-center">
                          Enter 6-Digit Email Code
                        </label>
                        <div className="flex items-center justify-center gap-2 sm:gap-2.5">
                          {otpDigits.map((digit, idx) => (
                            <input
                              key={idx}
                              ref={(el) => (otpInputRefs.current[idx] = el)}
                              type="text"
                              inputMode="numeric"
                              maxLength={1}
                              value={digit}
                              onChange={(e) => handleDigitChange(idx, e.target.value)}
                              onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                              className="w-10 h-12 sm:w-11 sm:h-12 text-center text-lg sm:text-xl font-bold font-mono text-white bg-dark-900/90 border border-slate-700/90 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-400 transition-all shadow-inner"
                            />
                          ))}
                        </div>
                      </div>

                      {/* Resend Code Timer */}
                      <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                        <span>Didn't receive code?</span>
                        {canResend ? (
                          <button
                            type="button"
                            onClick={handleSendOtp}
                            disabled={loading}
                            className="text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Resend Code</span>
                          </button>
                        ) : (
                          <span className="font-mono text-slate-500">
                            Resend in {resendTimer}s
                          </span>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={loading || otpDigits.join('').length !== 6}
                        className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-medium text-xs sm:text-sm shadow-lg shadow-purple-500/25 transition-all flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <span>Verifying Code...</span>
                          </>
                        ) : (
                          <>
                            <KeyRound className="w-4 h-4" />
                            <span>Verify & Sign In</span>
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* Bottom Link to Signup */}
              <div className="mt-5 pt-4 border-t border-white/10 text-center">
                <p className="text-xs text-slate-400">
                  Don't have an account?{' '}
                  <Link
                    to="/signup"
                    className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors inline-flex items-center gap-1 group"
                  >
                    <span>Create Verified Account</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </p>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
