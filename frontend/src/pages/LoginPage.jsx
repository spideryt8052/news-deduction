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
  KeyRound,
  RefreshCw,
  Send,
  Fingerprint,
  CheckCircle2,
  ArrowLeft,
  Key,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, sendOtp, loginWithOtp, forgotPassword, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Mode: 'password' | 'otp' | 'forgot'
  const [authMode, setAuthMode] = useState('password');

  // Common email state
  const [email, setEmail] = useState('');
  
  // Password Mode States
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // OTP Mode States (Login / Auto-Register)
  const [otpSent, setOtpSent] = useState(false);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [cloudNoticeCode, setCloudNoticeCode] = useState(null);
  const [isNewUserOtp, setIsNewUserOtp] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const otpInputRefs = useRef([]);

  // Forgot Password States
  const [forgotStep, setForgotStep] = useState(1); // 1: email, 2: otp + new password
  const [forgotOtpDigits, setForgotOtpDigits] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [forgotCloudNoticeCode, setForgotCloudNoticeCode] = useState(null);
  const [forgotTimer, setForgotTimer] = useState(60);
  const [canResendForgot, setCanResendForgot] = useState(false);
  const forgotOtpRefs = useRef([]);

  // Shared status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Redirection target
  const from = location.state?.returnTo || location.state?.from?.pathname || null;

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

  // Countdown timer for Forgot Password mode
  useEffect(() => {
    let timer;
    if (forgotStep === 2 && forgotTimer > 0) {
      timer = setInterval(() => {
        setForgotTimer((prev) => {
          if (prev <= 1) {
            setCanResendForgot(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [forgotStep, forgotTimer]);

  // Auto-focus first digit when OTP mode activates
  useEffect(() => {
    if (otpSent) {
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 150);
    }
  }, [otpSent]);

  // Auto-focus first digit when Forgot Step 2 activates
  useEffect(() => {
    if (forgotStep === 2) {
      setTimeout(() => {
        forgotOtpRefs.current[0]?.focus();
      }, 150);
    }
  }, [forgotStep]);

  const handleRedirect = (user) => {
    if (from) {
      navigate(from, { replace: true });
    } else if (user?.role === 'admin') {
      navigate('/admin', { replace: true });
    } else {
      navigate('/user/panel', { replace: true });
    }
  };

  // ==========================================
  // MODE 1: PASSWORD SIGN IN
  // ==========================================
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
      setError(res.error || 'Authentication failed. Please verify your email & password or use "Reset Password".');
    }
  };

  // ==========================================
  // MODE 2: EMAIL OTP (LOGIN & AUTO-REGISTER)
  // ==========================================
  const handleSendOtp = async (e) => {
    e?.preventDefault();
    setError('');
    setSuccessMsg('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    const res = await sendOtp(cleanEmail, 'login');
    setLoading(false);

    if (res.success) {
      setOtpSent(true);
      setResendTimer(60);
      setCanResend(false);
      setCloudNoticeCode(res.cloud_notice_code || null);
      setIsNewUserOtp(!!res.is_new_user);
      if (res.is_new_user) {
        setSuccessMsg(`Welcome! 6-digit confirmation code generated for new account: ${cleanEmail}`);
      } else {
        setSuccessMsg(`6-digit verification code dispatched to ${cleanEmail}`);
      }
    } else {
      setError(res.error || 'Failed to dispatch login code. Please try again.');
    }
  };

  const handleDigitChange = (index, val) => {
    const cleaned = val.replace(/[^0-9]/g, '');
    const updated = [...otpDigits];

    if (cleaned.length > 1) {
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

  // ==========================================
  // MODE 3: FORGOT / RESET PASSWORD
  // ==========================================
  const handleForgotSendOtp = async (e) => {
    e?.preventDefault();
    setError('');
    setSuccessMsg('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter a valid registered email address.');
      return;
    }

    setLoading(true);
    const res = await forgotPassword(cleanEmail);
    setLoading(false);

    if (res.success) {
      setForgotStep(2);
      setForgotTimer(60);
      setCanResendForgot(false);
      setForgotOtpDigits(['', '', '', '', '', '']);
      setForgotCloudNoticeCode(res.cloud_notice_code || null);
      setSuccessMsg(`Password reset verification code dispatched to ${cleanEmail}`);
    } else {
      setError(res.error || 'Failed to dispatch password reset code. Please ensure this email is registered.');
    }
  };

  const handleForgotDigitChange = (index, val) => {
    const cleaned = val.replace(/[^0-9]/g, '');
    const updated = [...forgotOtpDigits];

    if (cleaned.length > 1) {
      const pasted = cleaned.slice(0, 6).split('');
      pasted.forEach((ch, idx) => {
        if (idx < 6) updated[idx] = ch;
      });
      setForgotOtpDigits(updated);
      const nextIdx = Math.min(pasted.length, 5);
      forgotOtpRefs.current[nextIdx]?.focus();
      return;
    }

    updated[index] = cleaned;
    setForgotOtpDigits(updated);

    if (cleaned && index < 5) {
      forgotOtpRefs.current[index + 1]?.focus();
    }
  };

  const handleForgotDigitKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !forgotOtpDigits[index] && index > 0) {
      forgotOtpRefs.current[index - 1]?.focus();
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    const otp = forgotOtpDigits.join('');
    if (otp.length !== 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }
    if (!newPassword || newPassword.length < 4) {
      setError('New password must be at least 4 characters long.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match. Please verify your new password.');
      return;
    }

    setError('');
    setLoading(true);

    const res = await resetPassword(email.trim().toLowerCase(), otp, newPassword);
    setLoading(false);

    if (res.success) {
      handleRedirect(res.user);
    } else {
      setError(res.error || 'Password reset failed. Code may be invalid or expired.');
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center px-4 py-8 sm:py-12 relative overflow-hidden">
      
      {/* Background Ambient Glow Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-sky-500/10 via-blue-600/10 to-indigo-600/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="w-full max-w-xl mx-auto">
        
        {/* Header Icon & Brand */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 via-blue-600 to-indigo-600 shadow-xl shadow-sky-500/20 mb-3 ring-1 ring-white/20">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Welcome to TruthShield
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5">
            Verified Identity & Automated Misinformation Defense Platform
          </p>
        </div>

        {/* Main Glassmorphic Form Card */}
        <div className="glass-panel p-6 sm:p-7 rounded-2xl border border-white/10 bg-dark-800/70 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          
          {/* Triple Tab Mode Switcher: Password | Email OTP | Forgot Password */}
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-dark-900/90 border border-white/5 mb-5">
            <button
              type="button"
              onClick={() => {
                setAuthMode('password');
                setError('');
                setSuccessMsg('');
              }}
              className={`py-2 px-2 sm:px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
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
              className={`py-2 px-2 sm:px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                authMode === 'otp'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Fingerprint className="w-3.5 h-3.5" />
              <span>Email OTP</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthMode('forgot');
                setForgotStep(1);
                setError('');
                setSuccessMsg('');
              }}
              className={`py-2 px-2 sm:px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                authMode === 'forgot'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>Reset Pass</span>
            </button>
          </div>

          {/* Global Error Banner */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{error}</div>
            </div>
          )}

          {/* Global Success Banner */}
          {successMsg && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{successMsg}</div>
            </div>
          )}

          {/* ============================================================ */}
          {/* MODE 1: PASSWORD LOGIN                                       */}
          {/* ============================================================ */}
          {authMode === 'password' && (
            <form onSubmit={handlePasswordSubmit} autoComplete="off" className="space-y-4">
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
                    autoComplete="off"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your registered email"
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
                      setAuthMode('forgot');
                      setForgotStep(1);
                      setError('');
                      setSuccessMsg('');
                    }}
                    className="text-[11px] text-amber-400 hover:text-amber-300 font-medium transition-colors cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
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

          {/* ============================================================ */}
          {/* MODE 2: EMAIL OTP (LOGIN & AUTO-REGISTER)                    */}
          {/* ============================================================ */}
          {authMode === 'otp' && (
            <div>
              {!otpSent ? (
                // OTP Step A: Enter Email
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-slate-300">
                        Email Address
                      </label>
                      <span className="text-[10px] text-purple-400 font-medium">
                        Instant Passwordless Access
                      </span>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        autoComplete="off"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter email to sign in or register"
                        required
                        className="w-full pl-10 pr-4 py-2.5 bg-dark-900/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-purple-400" />
                      <span>Works for existing accounts & automatically registers new users.</span>
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
                        setCloudNoticeCode(null);
                      }}
                      className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Change Email</span>
                    </button>
                    <span className="text-[11px] font-mono text-purple-400 font-semibold">
                      {email} {isNewUserOtp && '(New User)'}
                    </span>
                  </div>

                  {/* Cloud Notice Code Banner (Fallback when cloud SMTP ports are blocked or Resend domain restricted) */}
                  {cloudNoticeCode ? (
                    <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/35 text-center space-y-1.5 shadow-md">
                      <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-300">
                        <AlertCircle className="w-4 h-4 text-amber-400" />
                        <span>Cloud Verification Code Notice</span>
                      </div>
                      <p className="text-[11px] text-slate-300">
                        Cloud mail delivery restricted. Your 6-digit code is:
                      </p>
                      <div className="font-mono text-2xl font-black text-amber-300 tracking-widest bg-dark-900/80 py-1.5 px-3 rounded-lg border border-amber-500/40 inline-block">
                        {cloudNoticeCode}
                      </div>
                      <p className="text-[10px] text-slate-400">
                        (Enter this code below to proceed immediately)
                      </p>
                    </div>
                  ) : (
                    /* Real Gmail Inbox Security Reminder */
                    <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-center space-y-0.5">
                      <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-purple-300">
                        <Mail className="w-3.5 h-3.5 text-purple-400" />
                        <span>Code sent to your Gmail inbox</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Please check your Gmail inbox or Spam folder for your 6-digit login code.
                      </p>
                    </div>
                  )}

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

          {/* ============================================================ */}
          {/* MODE 3: FORGOT / RESET PASSWORD                              */}
          {/* ============================================================ */}
          {authMode === 'forgot' && (
            <div>
              {forgotStep === 1 ? (
                // Step 1: Enter email for reset
                <form onSubmit={handleForgotSendOtp} className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-slate-300">
                        Registered Email Address
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('password');
                          setError('');
                        }}
                        className="text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
                      >
                        Remember password?
                      </button>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        autoComplete="off"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your registered email"
                        required
                        className="w-full pl-10 pr-4 py-2.5 bg-dark-900/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1.5">
                      We will dispatch a 6-digit verification code to reset your account password.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !email}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-medium text-xs sm:text-sm shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Sending Reset Code...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Send Password Reset Code</span>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                // Step 2: Enter OTP + New Password
                <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        setForgotStep(1);
                        setForgotOtpDigits(['', '', '', '', '', '']);
                        setForgotCloudNoticeCode(null);
                      }}
                      className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Change Email</span>
                    </button>
                    <span className="text-[11px] font-mono text-amber-400 font-semibold">
                      {email}
                    </span>
                  </div>

                  {/* Cloud Notice Code Banner (Fallback when cloud SMTP is restricted) */}
                  {forgotCloudNoticeCode ? (
                    <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/35 text-center space-y-1 shadow-md">
                      <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-300">
                        <AlertCircle className="w-4 h-4 text-amber-400" />
                        <span>Password Reset Code</span>
                      </div>
                      <p className="text-[11px] text-slate-300">
                        Your 6-digit password reset code is:
                      </p>
                      <div className="font-mono text-xl font-black text-amber-300 tracking-widest bg-dark-900/80 py-1 px-3 rounded-lg border border-amber-500/40 inline-block">
                        {forgotCloudNoticeCode}
                      </div>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-center space-y-0.5">
                      <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-amber-300">
                        <Mail className="w-3.5 h-3.5 text-amber-400" />
                        <span>Reset code sent to your email</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Check your Gmail inbox or Spam folder for the 6-digit reset code.
                      </p>
                    </div>
                  )}

                  {/* 6 Digit Verification Input */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 text-center">
                      Enter 6-Digit Reset Code
                    </label>
                    <div className="flex items-center justify-center gap-2 sm:gap-2.5">
                      {forgotOtpDigits.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={(el) => (forgotOtpRefs.current[idx] = el)}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleForgotDigitChange(idx, e.target.value)}
                          onKeyDown={(e) => handleForgotDigitKeyDown(idx, e)}
                          className="w-10 h-12 sm:w-11 sm:h-12 text-center text-lg sm:text-xl font-bold font-mono text-white bg-dark-900/90 border border-slate-700/90 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-400 transition-all shadow-inner"
                        />
                      ))}
                    </div>
                  </div>

                  {/* New Password Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Min 4 characters"
                          required
                          className="w-full pl-3 pr-9 py-2 bg-dark-900/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-500 hover:text-slate-300"
                        >
                          {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Confirm New Password
                      </label>
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="Re-enter password"
                        required
                        className="w-full px-3 py-2 bg-dark-900/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Resend Code Timer */}
                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                    <span>Didn't receive code?</span>
                    {canResendForgot ? (
                      <button
                        type="button"
                        onClick={handleForgotSendOtp}
                        disabled={loading}
                        className="text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Resend Code</span>
                      </button>
                    ) : (
                      <span className="font-mono text-slate-500">
                        Resend in {forgotTimer}s
                      </span>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading || forgotOtpDigits.join('').length !== 6 || !newPassword}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-medium text-xs sm:text-sm shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Resetting Password...</span>
                      </>
                    ) : (
                      <>
                        <Key className="w-4 h-4" />
                        <span>Reset Password & Sign In</span>
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
  );
}
