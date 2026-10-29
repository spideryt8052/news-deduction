import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, Menu, X, Zap, Shield, User, LogOut, Sparkles } from 'lucide-react';
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
    // Check backend health periodically
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

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Ask AI', path: '/chat', isAi: true },
    { name: 'Analyze Claim', path: '/analyze' },
    { name: 'Fact-Check Guide', path: '/learn' },
    { name: 'Live Dashboard', path: '/dashboard' },
    { name: 'About', path: '/about' },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 glass-panel border-b border-white/10 bg-dark-900/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo & Brand */}
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform duration-200">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold tracking-tight text-white group-hover:text-cyan-400 transition-colors">
                    TruthShield
                  </span>
                  <span className="hidden sm:inline-flex text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-semibold">
                    AI Verification
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-normal">Social Media & Misleading Info</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.name}
                    to={link.path}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                      isActive
                        ? 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/20'
                        : link.isAi
                        ? 'text-cyan-300 hover:text-white hover:bg-cyan-500/10 border border-cyan-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {link.isAi && <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />}
                    <span>{link.name}</span>
                    {link.isAi && (
                      <span className="text-[9px] uppercase px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold">
                        AI
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Right Action & Status */}
            <div className="hidden sm:flex items-center space-x-2.5">
              {/* AI Key Configuration Button */}
              <button
                type="button"
                onClick={() => setShowKeyModal(true)}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-slate-300 hover:text-white transition-all cursor-pointer"
                title="Configure LLM API Keys"
              >
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-medium text-[11px]">
                  {aiConfig.apiKey ? 'Live AI Key' : 'AI Engine'}
                </span>
              </button>

              {/* Live Backend Indicator */}
              <div
                className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full bg-dark-800 border border-white/5"
                title={`API Status: ${backendStatus}`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    backendStatus === 'online'
                      ? 'bg-emerald-400 animate-pulse'
                      : backendStatus === 'offline'
                      ? 'bg-amber-400'
                      : 'bg-slate-400'
                  }`}
                ></span>
                <span className="text-slate-400 text-[11px]">
                  {backendStatus === 'online' ? 'API Online' : backendStatus === 'offline' ? 'Demo Mode' : 'Connecting'}
                </span>
              </div>

              {/* Authentication State Elements */}
              {isAuthenticated ? (
                <div className="flex items-center space-x-2">
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="px-2.5 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
                      title="Admin Control Console"
                    >
                      <Shield className="w-3.5 h-3.5 text-purple-400" />
                      <span>Admin Panel</span>
                    </Link>
                  )}

                  <Link
                    to="/user/panel"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-300 hover:text-white text-xs font-semibold transition-all"
                    title="User Dashboard & History"
                  >
                    <User className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{user?.name?.split(' ')[0] || 'User Panel'}</span>
                  </Link>

                  <button
                    type="button"
                    onClick={logout}
                    className="p-1.5 rounded-lg bg-dark-800 hover:bg-red-500/20 border border-slate-700/80 hover:border-red-500/40 text-slate-400 hover:text-red-300 transition-colors cursor-pointer"
                    title="Log Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link
                    to="/login"
                    className="px-3 py-1.5 rounded-lg bg-dark-800 hover:bg-dark-700 text-slate-200 hover:text-white text-xs font-medium border border-slate-700 transition-all"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-medium shadow-md shadow-cyan-500/20 transition-all"
                  >
                    Sign Up
                  </Link>
                </div>
              )}

            </div>

            {/* Mobile menu button */}
            <div className="flex md:hidden items-center space-x-2">
              <button
                type="button"
                onClick={() => setShowKeyModal(true)}
                className="p-1.5 rounded-lg bg-slate-800 text-cyan-400 border border-slate-700"
                title="AI Keys"
              >
                <Zap className="w-4 h-4" />
              </button>

              {isAuthenticated ? (
                <Link
                  to="/user/panel"
                  className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-medium"
                >
                  Panel
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="px-2.5 py-1 rounded-lg bg-dark-800 text-slate-200 border border-slate-700 text-xs font-medium"
                >
                  Sign In
                </Link>
              )}

              <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 focus:outline-none"
                aria-label="Toggle Navigation Menu"
              >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile menu dropdown */}
        {isOpen && (
          <div className="md:hidden glass-panel border-b border-white/10 px-4 pt-2 pb-4 space-y-1 bg-dark-900/95 backdrop-blur-xl">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`block px-3 py-2 rounded-lg text-base font-medium ${
                    isActive
                      ? 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/20'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}

            {/* Mobile Auth Links */}
            <div className="pt-3 border-t border-white/10 space-y-2">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/user/panel"
                    className="block px-3 py-2 rounded-lg text-sm font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20"
                  >
                    User Panel ({user?.name || user?.email})
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="block px-3 py-2 rounded-lg text-sm font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20"
                    >
                      Admin Panel (Root Controls)
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={logout}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10"
                  >
                    Log Out
                  </button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Link
                    to="/login"
                    className="py-2 text-center rounded-lg bg-dark-800 border border-slate-700 text-slate-200 text-sm font-medium"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    className="py-2 text-center rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-medium"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-between px-3 text-xs text-slate-400">
              <span>FastAPI Server</span>
              <span className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${backendStatus === 'online' ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                {backendStatus === 'online' ? 'Active' : 'Offline / Standalone'}
              </span>
            </div>
          </div>
        )}
      </header>

      {/* Global API Key Configuration Modal */}
      <ApiKeyModal
        isOpen={showKeyModal}
        onClose={() => setShowKeyModal(false)}
        onConfigSaved={(cfg) => setAiConfig(cfg)}
      />
    </>
  );
}
