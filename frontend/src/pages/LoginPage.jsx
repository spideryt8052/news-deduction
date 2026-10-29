import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, Sparkles, Shield, Flame } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DarkSoulsHoloCard } from "@designcodeio/threeui";
import "@designcodeio/threeui/style.css";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // From state or default based on role
  const from = location.state?.from?.pathname || null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }
    setError('');
    setLoading(true);

    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      if (from) {
        navigate(from, { replace: true });
      } else if (res.user.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/user/panel', { replace: true });
      }
    } else {
      setError(res.error || 'Authentication failed. Please check your credentials.');
    }
  };

  const handleQuickLogin = async (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
    setLoading(true);

    const res = await login(demoEmail, demoPassword);
    setLoading(false);

    if (res.success) {
      if (res.user.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/user/panel', { replace: true });
      }
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

              {/* Exact configured ThreeUI usage */}
              <div className="shader-frame h-[420px] sm:h-[500px] lg:h-[590px] rounded-3xl border border-amber-500/25 shadow-2xl shadow-amber-950/40 overflow-hidden bg-[#050404]">
                <DarkSoulsHoloCard
                  variant="cindermane"
                />
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
                Sign in to access your analysis dashboard and verification tools
              </p>
            </div>

            {/* 1-Click Demo Logins Banner */}
            <div className="mb-5 p-3.5 rounded-xl bg-dark-800/80 border border-cyan-500/30 backdrop-blur-sm shadow-lg shadow-cyan-500/5">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-cyan-400">
                  Viva & Demo Quick Access
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
              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div className="flex-1">{error}</div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
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
                      placeholder="admin@truthshield.com"
                      required
                      className="w-full pl-10 pr-4 py-2 bg-dark-900/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      Password
                    </label>
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
                      className="w-full pl-10 pr-10 py-2 bg-dark-900/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 focus:outline-none"
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
                      <span>Sign In</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              {/* Bottom Link to Signup */}
              <div className="mt-5 pt-4 border-t border-white/10 text-center">
                <p className="text-xs text-slate-400">
                  Don't have an account?{' '}
                  <Link
                    to="/signup"
                    className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
                  >
                    Create Account
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
