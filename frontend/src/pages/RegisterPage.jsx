import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ArrowLeft,
  AlertCircle, 
  CheckCircle2, 
  Sparkles, 
  KeyRound, 
  RefreshCw, 
  Send,
  Zap,
  LockKeyhole,
  Check,
  Fingerprint
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { registerWithOtp, sendOtp } = useAuth();
  const navigate = useNavigate();

  // Step 1: form details, Step 2: 6-digit OTP verification
  const [step, setStep] = useState(1);

  // Form inputs
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // OTP inputs (6 individual boxes)
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [demoCode, setDemoCode] = useState(null);
  const otpInputRefs = useRef([]);

  // States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Password strength analysis
  const hasMinLen = password.length >= 8;
  const hasNumOrSym = /[0-9!@#$%^&*]/.test(password);
  const passwordsMatch = password && confirmPassword && password === confirmPassword;

  // Countdown timer for OTP resend
  useEffect(() => {
    let timer;
    if (step === 2 && resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer(prev => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, resendTimer]);

  // Auto-focus first OTP digit when entering Step 2
  useEffect(() => {
    if (step === 2) {
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 150);
    }
  }, [step]);

  // STEP 1: Validate input and send 6-digit verification code to email
  const handleInitiateVerification = async (e) => {
    e.preventDefault();
    setError('');

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    if (!cleanName || !cleanEmail || !password || !confirmPassword) {
      setError('Please fill in all required fields.');
      return;
    }
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setError('Please provide a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify your password entry.');
      return;
    }

    setLoading(true);

    try {
      const resp = await sendOtp(cleanEmail, 'register');
      setLoading(false);

      if (resp.success) {
        if (resp.preview_code) {
          setDemoCode(resp.preview_code);
        }
        setResendTimer(60);
        setCanResend(false);
        setStep(2);
      } else {
        setError(resp.error || 'Failed to send verification code. Please check your email and try again.');
      }
    } catch (err) {
      setLoading(false);
      setError('Error dispatching verification code. Please check server connectivity.');
    }
  };

  // OTP box input handling (auto-focus next, backspace, and paste support)
  const handleOtpChange = (index, value) => {
    // Only accept numeric digit
    const cleaned = value.replace(/[^0-9]/g, '');
    const newDigits = [...otpDigits];

    if (cleaned.length > 1) {
      // Pasted multi-character string
      const pastedDigits = cleaned.slice(0, 6).split('');
      pastedDigits.forEach((digit, i) => {
        if (i < 6) newDigits[i] = digit;
      });
      setOtpDigits(newDigits);
      const nextIndex = Math.min(pastedDigits.length, 5);
      otpInputRefs.current[nextIndex]?.focus();
      return;
    }

    newDigits[index] = cleaned;
    setOtpDigits(newDigits);

    // Auto-advance cursor to next input box
    if (cleaned && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text/plain').replace(/[^0-9]/g, '');
    if (!pasted) return;

    const newDigits = [...otpDigits];
    const chars = pasted.slice(0, 6).split('');
    chars.forEach((c, idx) => {
      newDigits[idx] = c;
    });
    setOtpDigits(newDigits);
    const targetIdx = Math.min(chars.length, 5);
    otpInputRefs.current[targetIdx]?.focus();
  };

  // Auto-fill convenience button
  const handleAutoFillDemoCode = () => {
    if (demoCode && demoCode.length === 6) {
      setOtpDigits(demoCode.split(''));
      otpInputRefs.current[5]?.focus();
    }
  };

  // STEP 2: Verify OTP and finalize user registration
  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    const fullOtp = otpDigits.join('');

    if (fullOtp.length !== 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    setError('');
    setLoading(true);

    const res = await registerWithOtp(
      name.trim(),
      email.trim().toLowerCase(),
      password,
      fullOtp
    );

    setLoading(false);

    if (res.success) {
      navigate('/user/panel', { replace: true });
    } else {
      setError(res.error || 'Verification failed. The code may be incorrect or expired.');
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (!canResend || loading) return;
    setError('');
    setLoading(true);

    const resp = await sendOtp(email.trim().toLowerCase(), 'register');
    setLoading(false);

    if (resp.success) {
      if (resp.preview_code) {
        setDemoCode(resp.preview_code);
      }
      setResendTimer(60);
      setCanResend(false);
      setOtpDigits(['', '', '', '', '', '']);
      otpInputRefs.current[0]?.focus();
    } else {
      setError(resp.error || 'Could not resend code. Please wait a moment and try again.');
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      
      {/* Background Ambient Glow Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-cyan-500/10 via-blue-600/10 to-purple-600/10 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse duration-1000" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none -z-10" />

      <div className="w-full max-w-xl">
        
        {/* Top Floating Security Shield */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-3">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 p-[1.5px] shadow-2xl shadow-cyan-500/30">
              <div className="w-full h-full bg-dark-900/90 rounded-[22px] backdrop-blur-xl flex items-center justify-center">
                <ShieldCheck className="w-10 h-10 text-cyan-400 animate-pulse" />
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 p-1 bg-cyan-500 text-dark-900 rounded-full shadow-lg ring-2 ring-dark-900">
              <Zap className="w-3.5 h-3.5 fill-current" />
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            <span>Truth</span><span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-500">Shield</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-md mx-auto">
            Verified Identity & Automated Misinformation Defense Platform
          </p>

          {/* Stepper Progress Indicator */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              step === 1 
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/20' 
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            }`}>
              {step > 1 ? <Check className="w-3.5 h-3.5" /> : <span className="w-4 h-4 rounded-full bg-cyan-500 text-dark-900 flex items-center justify-center text-[10px] font-bold">1</span>}
              <span>Account Setup</span>
            </div>

            <div className="w-6 h-[1px] bg-slate-700" />

            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              step === 2 
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/20 animate-pulse' 
                : 'bg-dark-800 text-slate-500 border border-white/5'
            }`}>
              <span className="w-4 h-4 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center text-[10px] font-bold">2</span>
              <span>Email Verification (OTP)</span>
            </div>
          </div>
        </div>

        {/* Main Glassmorphic Container */}
        <div className="relative rounded-3xl bg-dark-800/80 border border-white/10 backdrop-blur-2xl p-6 sm:p-10 shadow-2xl shadow-black/80">
          
          {/* Subtle top rainbow line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-70" />

          {/* Global Alert Notification */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-3 animate-shake">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{error}</div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 1: ACCOUNT DETAILS INPUT                                */}
          {/* ============================================================ */}
          {step === 1 && (
            <form onSubmit={handleInitiateVerification} className="space-y-4">
              
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Full Name</span>
                  <span className="text-[10px] text-slate-500 font-normal">Real name or alias</span>
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-cyan-400 transition-colors">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Yaseen Jamshed"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-dark-900/90 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500 transition-all shadow-inner"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Email Address</span>
                  <span className="text-[10px] text-cyan-400 font-medium">OTP Code Will Be Sent Here</span>
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-cyan-400 transition-colors">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-dark-900/90 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500 transition-all shadow-inner"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-cyan-400 transition-colors">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-10 pr-10 py-3 bg-dark-900/90 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500 transition-all shadow-inner"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-cyan-400 transition-colors">
                      <LockKeyhole className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-10 pr-4 py-3 bg-dark-900/90 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500 transition-all shadow-inner"
                    />
                  </div>
                </div>
              </div>

              {/* Password Quality Indicator */}
              {password && (
                <div className="p-3 bg-dark-900/60 rounded-xl border border-white/5 space-y-1.5 text-[11px]">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${hasMinLen ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                    <span className={hasMinLen ? 'text-emerald-300' : 'text-slate-400'}>At least 8 characters</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${hasNumOrSym ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                    <span className={hasNumOrSym ? 'text-emerald-300' : 'text-slate-400'}>Includes number or symbol</span>
                  </div>
                  {confirmPassword && (
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${passwordsMatch ? 'bg-emerald-400' : 'bg-rose-500'}`} />
                      <span className={passwordsMatch ? 'text-emerald-300' : 'text-rose-400'}>
                        {passwordsMatch ? 'Passwords match' : 'Passwords do not match yet'}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Security Pill */}
              <div className="flex items-center gap-2 py-2 px-3 rounded-xl bg-cyan-950/40 border border-cyan-500/20 text-cyan-300/90 text-xs">
                <Fingerprint className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>To prevent bots, we will email you a 6-digit confirmation code.</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/25 transition-all transform active:scale-[0.99] flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Sending Security Code...</span>
                  </>
                ) : (
                  <>
                    <span>Send Verification Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ============================================================ */}
          {/* STEP 2: GOOGLE-STYLE 6-DIGIT EMAIL OTP VERIFICATION          */}
          {/* ============================================================ */}
          {step === 2 && (
            <form onSubmit={handleVerifyAndRegister} className="space-y-6">
              
              <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mb-1">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white">
                  Enter 6-Digit Email Code
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  We've sent a one-time security code to:
                  <br />
                  <span className="text-cyan-300 font-semibold">{email}</span>
                </p>

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-[11px] text-slate-400 hover:text-cyan-400 inline-flex items-center gap-1 transition-colors cursor-pointer mt-1"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Change email address</span>
                </button>
              </div>

              {/* Dev / Interactive Auto-Fill Demo Code Banner */}
              {demoCode && (
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-cyan-950/70 to-blue-950/70 border border-cyan-500/30 text-center space-y-1.5 shadow-md">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-cyan-300">
                    <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                    <span>Instant Verification Code:</span>
                    <span className="font-mono text-base font-extrabold text-white tracking-widest px-2 py-0.5 rounded bg-cyan-500/20 border border-cyan-500/40">
                      {demoCode}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAutoFillDemoCode}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 underline font-medium cursor-pointer"
                  >
                    Click to auto-fill code into boxes
                  </button>
                </div>
              )}

              {/* 6 Individual OTP Boxes with Auto-focus & Paste */}
              <div 
                className="flex items-center justify-center gap-2 sm:gap-3 py-2"
                onPaste={handleOtpPaste}
              >
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={el => (otpInputRefs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="w-11 h-14 sm:w-14 sm:h-16 text-center text-xl sm:text-2xl font-black bg-dark-900 border-2 border-slate-700 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/20 text-white rounded-2xl transition-all shadow-inner outline-none select-none"
                  />
                ))}
              </div>

              {/* Verify & Register Submit Button */}
              <button
                type="submit"
                disabled={loading || otpDigits.join('').length !== 6}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 hover:from-emerald-400 hover:via-teal-500 hover:to-cyan-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all transform active:scale-[0.99] flex items-center justify-center gap-2 text-sm disabled:opacity-40 cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Code & Creating Account...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verify Email & Create Account</span>
                  </>
                )}
              </button>

              {/* Resend Code Options */}
              <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/5">
                <span>Didn't receive the email?</span>
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={loading}
                    className="text-cyan-400 hover:text-cyan-300 font-bold transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Resend Code</span>
                  </button>
                ) : (
                  <span className="text-slate-500 font-mono">
                    Resend in <strong className="text-slate-400">{resendTimer}s</strong>
                  </span>
                )}
              </div>
            </form>
          )}

          {/* Footer Card Navigation */}
          <div className="mt-6 pt-5 border-t border-white/5 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <span>Already have an account?</span>
            <Link 
              to="/login" 
              className="text-cyan-400 hover:text-cyan-300 font-bold hover:underline transition-all"
            >
              Sign in here
            </Link>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-8 grid grid-cols-3 gap-3 text-center">
          <div className="p-3 rounded-2xl bg-dark-800/40 border border-white/5">
            <div className="text-cyan-400 font-bold text-xs">Email Verified</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Zero Spam Accounts</div>
          </div>
          <div className="p-3 rounded-2xl bg-dark-800/40 border border-white/5">
            <div className="text-purple-400 font-bold text-xs">AI Powered</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Gemini + Groq</div>
          </div>
          <div className="p-3 rounded-2xl bg-dark-800/40 border border-white/5">
            <div className="text-emerald-400 font-bold text-xs">Full Provenance</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Claim Tracing</div>
          </div>
        </div>

      </div>
    </div>
  );
}
