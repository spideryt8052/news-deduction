import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, Menu, X, Activity, ExternalLink } from 'lucide-react';
import api from '../services/api';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking'); // 'online' | 'offline' | 'checking'
  const location = useLocation();

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
    { name: 'Analyze', path: '/analyze' },
    { name: 'How It Works', path: '/how-it-works' },
    { name: 'Learn', path: '/learn' },
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'About & Synopsis', path: '/about' },
  ];

  return (
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
                  MCA Project
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
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/20'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Right Action & Status */}
          <div className="hidden sm:flex items-center space-x-4">
            {/* Live Backend Indicator */}
            <div
              className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-dark-800 border border-white/5"
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

            <Link
              to="/analyze"
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium text-sm hover:from-cyan-400 hover:to-blue-500 shadow-md shadow-cyan-500/20 transition-all hover:shadow-cyan-500/30 flex items-center gap-1.5"
            >
              <span>Analyze Claim</span>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center space-x-2">
            <Link
              to="/analyze"
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-medium"
            >
              Analyze
            </Link>
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
          <div className="pt-2 border-t border-white/10 flex items-center justify-between px-3 text-xs text-slate-400">
            <span>FastAPI Server</span>
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${backendStatus === 'online' ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
              {backendStatus === 'online' ? 'Active' : 'Offline / Standalone'}
            </span>
          </div>
        </div>
      )}
    </header>
  );
}
