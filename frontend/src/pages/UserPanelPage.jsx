import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User, ShieldCheck, AlertTriangle, XCircle, CheckCircle, 
  Clock, ArrowUpRight, Search, Activity, Sparkles, LogOut,
  ExternalLink, FileText, Globe, Image as ImageIcon, BarChart2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api, { formatApiError } from '../services/api';

export default function UserPanelPage() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quickClaim, setQuickClaim] = useState('');

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    setLoading(true);
    setError('');
    try {
      const [profileRes, historyRes] = await Promise.all([
        api.getUserProfile(),
        api.getUserHistory(20, 0),
      ]);
      setProfileData(profileRes);
      setHistory(historyRes || []);
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAnalyze = (e) => {
    e.preventDefault();
    if (!quickClaim.trim()) return;
    navigate(`/analyze?claim=${encodeURIComponent(quickClaim.trim())}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const stats = profileData?.stats || {
    total_analyses: 0,
    reliable_count: 0,
    misleading_count: 0,
    false_count: 0,
    avg_risk_score: 0,
  };

  const getBadgeForClassification = (classification) => {
    switch (classification) {
      case 'reliable':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle className="w-3 h-3" />
            Reliable
          </span>
        );
      case 'misleading':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-3 h-3" />
            Misleading
          </span>
        );
      case 'false':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
            <XCircle className="w-3 h-3" />
            False
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
            Unverified
          </span>
        );
    }
  };

  const getInputIcon = (type) => {
    switch (type) {
      case 'url':
        return <Globe className="w-3.5 h-3.5 text-blue-400" />;
      case 'image':
        return <ImageIcon className="w-3.5 h-3.5 text-purple-400" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-cyan-400" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-slate-400 text-sm">Loading your TruthShield account...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Banner / User Welcome */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-white/10 bg-gradient-to-r from-dark-800 via-dark-800/90 to-cyan-950/30 backdrop-blur-xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-cyan-500/20 ring-2 ring-white/10 shrink-0">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-bold text-white tracking-tight">
                {user?.name || 'TruthShield User'}
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                isAdmin 
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' 
                  : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              }`}>
                {user?.role || 'User'}
              </span>
              {isAdmin && (
                <Link
                  to="/admin"
                  className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-400/30 transition-colors inline-flex items-center gap-1"
                >
                  Go to Admin Panel &rarr;
                </Link>
              )}
            </div>
            <p className="text-sm text-slate-400 mt-1 flex items-center gap-2">
              <span>{user?.email}</span>
              <span className="text-slate-600">•</span>
              <span className="text-xs text-slate-500">
                Joined: {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Active Member'}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/analyze"
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium text-sm shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>New Verification</span>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="p-2.5 rounded-xl bg-dark-900/80 hover:bg-red-500/20 border border-slate-700 hover:border-red-500/40 text-slate-300 hover:text-red-300 transition-all cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Total Analyzed */}
        <div className="glass-panel p-5 rounded-xl border border-white/10 bg-dark-800/60 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Total Analyses</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white">{stats.total_analyses}</div>
          <p className="text-[11px] text-slate-500 mt-1">Claims submitted</p>
        </div>

        {/* Reliable */}
        <div className="glass-panel p-5 rounded-xl border border-emerald-500/20 bg-dark-800/60 backdrop-blur-md">
          <div className="flex items-center justify-between text-emerald-400 text-xs mb-2">
            <span>Verified Reliable</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">{stats.reliable_count}</div>
          <p className="text-[11px] text-slate-500 mt-1">High factual accuracy</p>
        </div>

        {/* Misleading */}
        <div className="glass-panel p-5 rounded-xl border border-amber-500/20 bg-dark-800/60 backdrop-blur-md">
          <div className="flex items-center justify-between text-amber-400 text-xs mb-2">
            <span>Misleading / Out of Context</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400">{stats.misleading_count}</div>
          <p className="text-[11px] text-slate-500 mt-1">Caution warranted</p>
        </div>

        {/* False */}
        <div className="glass-panel p-5 rounded-xl border border-red-500/20 bg-dark-800/60 backdrop-blur-md">
          <div className="flex items-center justify-between text-red-400 text-xs mb-2">
            <span>Fabricated / False</span>
            <XCircle className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-red-400">{stats.false_count}</div>
          <p className="text-[11px] text-slate-500 mt-1">Debunked claims</p>
        </div>

        {/* Average Risk Score */}
        <div className="col-span-2 lg:col-span-1 glass-panel p-5 rounded-xl border border-white/10 bg-dark-800/60 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Avg Risk Score</span>
            <BarChart2 className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white">{stats.avg_risk_score}/100</div>
          <div className="w-full bg-slate-700/50 h-1.5 rounded-full mt-2 overflow-hidden">
            <div 
              className={`h-full ${
                stats.avg_risk_score > 60 
                  ? 'bg-red-500' 
                  : stats.avg_risk_score > 30 
                  ? 'bg-amber-400' 
                  : 'bg-emerald-400'
              }`}
              style={{ width: `${Math.min(stats.avg_risk_score, 100)}%` }}
            ></div>
          </div>
        </div>

      </div>

      {/* Quick Verification Launcher */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10 bg-dark-800/70 backdrop-blur-md">
        <h2 className="text-base font-semibold text-white mb-2 flex items-center gap-2">
          <Search className="w-4 h-4 text-cyan-400" />
          <span>Quick Fact-Check Launcher</span>
        </h2>
        <p className="text-xs text-slate-400 mb-4">
          Type or paste any viral post, tweet claim, or news sentence to initiate our NLP & knowledge-graph verification pipeline.
        </p>
        <form onSubmit={handleQuickAnalyze} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={quickClaim}
            onChange={(e) => setQuickClaim(e.target.value)}
            placeholder="e.g. World Health Organization declares emergency over new variant..."
            className="flex-1 px-4 py-2.5 bg-dark-900/90 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          />
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium text-sm transition-all shadow-md shadow-cyan-500/20 whitespace-nowrap cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Analyze Now</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Personal Analysis History */}
      <div className="glass-panel rounded-2xl border border-white/10 bg-dark-800/60 backdrop-blur-md overflow-hidden">
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <h2 className="text-base font-semibold text-white">Your Analysis History</h2>
          </div>
          <span className="text-xs text-slate-400">
            Showing {history.length} records
          </span>
        </div>

        {history.length === 0 ? (
          <div className="p-12 text-center">
            <ShieldCheck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-medium text-slate-300">No verifications yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              When you analyze social media text, web links, or screenshots while logged in, your personal credibility audits will appear here.
            </p>
            <Link
              to="/analyze"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-semibold border border-cyan-500/30 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Perform First Verification</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-dark-900/70 text-slate-400 uppercase tracking-wider font-semibold border-b border-white/5">
                <tr>
                  <th className="py-3 px-4">Claim / Statement</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Verdict</th>
                  <th className="py-3 px-4">Confidence</th>
                  <th className="py-3 px-4">Risk Score</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {history.map((item) => (
                  <tr key={item.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-4 max-w-xs sm:max-w-md truncate font-medium text-slate-200">
                      {item.claim_text || 'Unlabeled statement'}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 capitalize text-slate-400">
                        {getInputIcon(item.source_type)}
                        {item.source_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getBadgeForClassification(item.prediction_label)}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-300">
                      {item.confidence_score ? `${Math.round(item.confidence_score * 100)}%` : 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`font-mono font-semibold ${
                        (item.risk_score || 0) > 60 ? 'text-red-400' : (item.risk_score || 0) > 30 ? 'text-amber-400' : 'text-emerald-400'
                      }`}>
                        {item.risk_score !== null && item.risk_score !== undefined ? `${item.risk_score}/100` : '—'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-400">
                      {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recent'}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-right">
                      <Link
                        to={`/analyze?claim=${encodeURIComponent(item.claim_text || '')}`}
                        className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                      >
                        <span>Re-Check</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
