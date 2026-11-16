import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, Menu, X, Shield, User, LogOut, Sparkles, Languages, Key } from 'lucide-react';
import api, { getStoredAiConfig } from '../services/api';
import ApiKeyModal from './ApiKeyModal';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking'); // 'online' | 'offline' | 'checking'
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [aiConfig, setAiConfig] = useState(getStoredAiConfig());
  const location = useLocation();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();

  useEffect(() => {
    const checkServer = async () => {
      try {
        await api.checkHealth();
        setBackendStatus('online');
      } catch (err) {
        setBackendStatus('offline');
      }
    };
    checkServer();
    const interval = setInterval(checkServer, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { name: 'Check News', path: '/' },
    { name: 'Translate & Voice', path: '/translate', icon: Languages },
    { name: 'Ask Assistant', path: '/chat', isAi: true },
    { name: 'How It Works', path: '/how-it-works' },
    { name: 'Fact Guide', path: '/learn' },
    { name: 'About', path: '/about' },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 bg-slate-950/80 border-b border-slate-800/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand - Clean, Human, Trustworthy */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-200">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-slate-100 group-hover:text-sky-400 transition-colors">
                  TruthShield
                </span>
                <span className="hidden sm:inline-flex text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                  Fact Check
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-normal">Real Facts & News Verification</p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-1.5">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              const Icon = link.icon;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`px-3 py-1.5 rounded-xl text-xs lg:text-sm font-medium transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'text-sky-400 bg-sky-500/10 border border-sky-500/20 font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  {link.isAi && <Sparkles className="w-3.5 h-3.5 text-sky-400" />}
                  {Icon && <Icon className="w-3.5 h-3.5 text-slate-400" />}
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Action & Status Indicator */}
          <div className="hidden sm:flex items-center space-x-2.5">
            
            {/* AI Key Configuration Button */}
            <button
              type="button"
              onClick={() => setShowKeyModal(true)}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 text-slate-300 hover:text-white transition-all cursor-pointer shadow-sm group"
              title="Configure AI API Key (Groq, Gemini, OpenAI, Claude, Ollama)"
            >
              <Key className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-45 transition-transform" />
              <span>AI Key</span>
              {aiConfig?.provider && aiConfig.provider !== 'auto' && (
                <span className="text-[10px] uppercase font-bold text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/20">
                  {aiConfig.provider}
                </span>
              )}
            </button>

            {/* Live Status Pill */}
            <div
              className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800"
              title={`API Status: ${backendStatus}`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  backendStatus === 'online'
                    ? 'bg-emerald-400'
                    : backendStatus === 'offline'
                    ? 'bg-amber-400'
                    : 'bg-slate-400'
                }`}
              />
              <span className="text-slate-400 text-[11px]">
                {backendStatus === 'online' ? 'Online' : 'Standby'}
              </span>
            </div>

            {/* Authentication State Elements */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-2">
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="px-2.5 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
                  >
                    <Shield className="w-3.5 h-3.5 text-purple-400" />
                    <span>Admin</span>
                  </Link>
                )}

                <Link
                  to="/user/panel"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all"
                >
                  <User className="w-3.5 h-3.5 text-sky-400" />
                  <span>{user?.name?.split(' ')[0] || 'My Account'}</span>
                </Link>

                <button
                  type="button"
                  onClick={logout}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-700/60 transition-colors cursor-pointer"
                  title="Log Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white text-xs font-medium border border-slate-800 transition-all"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs shadow-md shadow-sky-500/20 transition-all"
                >
                  Create Account
                </Link>
              </div>
            )}

          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center space-x-1.5">
            <button
              type="button"
              onClick={() => setShowKeyModal(true)}
              className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-amber-400 hover:text-amber-300"
              title="Configure AI API Key"
            >
              <Key className="w-4 h-4" />
            </button>

            {isAuthenticated ? (
              <Link
                to="/user/panel"
                className="px-2.5 py-1 rounded-xl bg-slate-800 text-sky-300 border border-slate-700 text-xs font-medium"
              >
                Panel
              </Link>
            ) : (
              <Link
                to="/login"
                className="px-2.5 py-1 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 text-xs font-medium"
              >
                Sign In
              </Link>
            )}

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 focus:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile menu dropdown */}
      {isOpen && (
        <div className="md:hidden border-b border-slate-800/80 px-4 pt-2 pb-4 space-y-1 bg-slate-950/95 backdrop-blur-2xl">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            const Icon = link.icon;
            return (
              <Link
                key={link.name}
                to={link.path}
                className={`block px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-2 ${
                  isActive
                    ? 'text-sky-400 bg-sky-500/10 border border-sky-500/20 font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
              >
                {Icon && <Icon className="w-4 h-4 text-slate-400" />}
                {link.isAi && <Sparkles className="w-4 h-4 text-sky-400" />}
                <span>{link.name}</span>
              </Link>
            );
          })}

          {/* Mobile Auth Links */}
          <div className="pt-3 border-t border-slate-800/80 space-y-2">
            {isAuthenticated ? (
              <>
                <Link
                  to="/user/panel"
                  className="block px-3 py-2 rounded-xl text-sm font-semibold bg-slate-900 text-sky-300 border border-slate-800"
                >
                  My Account ({user?.name || user?.email})
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="block px-3 py-2 rounded-xl text-sm font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20"
                  >
                    Admin Control Panel
                  </Link>
                )}
                <button
                  type="button"
                  onClick={logout}
                  className="w-full text-left px-3 py-2 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                >
                  Log Out
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  to="/login"
                  className="py-2 text-center rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-sm font-medium"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="py-2 text-center rounded-xl bg-sky-500 text-slate-950 font-bold text-sm"
                >
                  Create Account
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>

    {/* Global AI API Key Configuration Modal */}
    <ApiKeyModal
      isOpen={showKeyModal}
      onClose={() => setShowKeyModal(false)}
      onConfigSaved={(cfg) => setAiConfig(cfg)}
    />
  </>
  );
}
