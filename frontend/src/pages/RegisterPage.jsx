import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, User, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all required fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setError('');
    setLoading(true);

    const res = await register(name.trim(), email.trim(), password);
    setLoading(false);

    if (res.success) {
      navigate('/user/panel', { replace: true });
    } else {
      setError(res.error || 'Registration failed. Please try a different email.');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        
        {/* Header Icon & Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-purple-600 shadow-xl shadow-cyan-500/20 mb-4 ring-1 ring-white/20">
            <ShieldCheck className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Create TruthShield Account
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Join the automated misinformation detection and verification platform
          </p>
        </div>

        {/* Main Glassmorphic Form Card */}
        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-white/10 bg-dark-800/70 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          {error && (
            <div className="mb-5 p-3.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Yaseen Jamshed"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-dark-900/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
                />
              </div>
            </div>

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
                  placeholder="user@example.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-dark-900/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-dark-900/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
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

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-dark-900/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium text-sm shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Free Account</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Bottom Link to Login */}
          <div className="mt-6 pt-5 border-t border-white/10 text-center">
            <p className="text-xs text-slate-400">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
