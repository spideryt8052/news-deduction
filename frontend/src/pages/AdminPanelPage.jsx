import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, Users, Database, Cpu, Activity, Trash2, 
  UserCheck, UserX, AlertTriangle, CheckCircle, XCircle, 
  RefreshCw, Search, ArrowUpRight, Server, HardDrive, Key
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api, { formatApiError } from '../services/api';

export default function AdminPanelPage() {
  const { user, isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'claims' | 'telemetry'
  const [stats, setStats] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [claimsList, setClaimsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [claimSearch, setClaimSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');

  useEffect(() => {
    if (isAdmin) {
      loadAdminData();
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  const loadAdminData = async () => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, usersRes, claimsRes] = await Promise.all([
        api.getAdminStats(),
        api.getAdminUsers(),
        api.getAdminClaims(100, 0),
      ]);
      setStats(statsRes);
      setUsersList(usersRes || []);
      setClaimsList(claimsRes || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleRoleToggle = async (targetUser) => {
    const newRole = targetUser.role === 'admin' ? 'user' : 'admin';
    setActionLoading(`role-${targetUser.id}`);
    setError('');
    try {
      await api.updateUserRole(targetUser.id, { role: newRole });
      setUsersList(prev => prev.map(u => u.id === targetUser.id ? { ...u, role: newRole } : u));
      setSuccessMsg(`Updated ${targetUser.email} role to ${newRole.toUpperCase()}`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusToggle = async (targetUser) => {
    const newStatus = !targetUser.is_active;
    setActionLoading(`status-${targetUser.id}`);
    setError('');
    try {
      await api.updateUserRole(targetUser.id, { is_active: newStatus });
      setUsersList(prev => prev.map(u => u.id === targetUser.id ? { ...u, is_active: newStatus } : u));
      setSuccessMsg(`User ${targetUser.email} ${newStatus ? 'activated' : 'deactivated'}`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteClaim = async (claimId) => {
    if (!window.confirm('Are you sure you want to permanently remove this claim from the database?')) {
      return;
    }
    setActionLoading(`del-${claimId}`);
    setError('');
    try {
      await api.deleteAdminClaim(claimId);
      setClaimsList(prev => prev.filter(c => c.id !== claimId));
      if (stats) {
        setStats(prev => ({ ...prev, total_claims: Math.max(0, prev.total_claims - 1) }));
      }
      setSuccessMsg('Claim record successfully purged from database.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setActionLoading(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full glass-panel p-8 rounded-2xl border border-red-500/30 bg-dark-800/80 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center mx-auto mb-4 text-red-400">
            <Shield className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Admin Access Required</h2>
          <p className="text-xs text-slate-400 mb-6">
            You must be logged in with an administrator account to inspect system telemetry, manage user privileges, and moderate analyzed content.
          </p>
          <div className="p-3 rounded-lg bg-dark-900 border border-slate-700 text-xs text-slate-300 mb-6 font-mono text-left">
            <span className="text-slate-500 block mb-1">Pre-configured Admin Credentials:</span>
            <span>admin@truthshield.com / admin123</span>
          </div>
          <Link
            to="/login"
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium text-xs block transition-all shadow-md shadow-purple-500/20"
          >
            Sign In as Admin
          </Link>
        </div>
      </div>
    );
  }

  const filteredUsers = usersList.filter(u => 
    u.name?.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.role?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredClaims = claimsList.filter(c => 
    c.claim_text?.toLowerCase().includes(claimSearch.toLowerCase()) ||
    c.prediction_label?.toLowerCase().includes(claimSearch.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Admin Header */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-purple-500/30 bg-gradient-to-r from-dark-800 via-dark-800/90 to-purple-950/40 backdrop-blur-xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/25 ring-2 ring-purple-400/20 shrink-0">
            <Shield className="w-9 h-9" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-white tracking-tight">
                TruthShield Admin Console
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40">
                Root Access
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              System Telemetry, User Privileges & Content Moderation Pipeline
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadAdminData}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-dark-900/90 hover:bg-white/10 border border-slate-700 text-slate-200 text-xs font-medium flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-purple-400' : ''}`} />
            <span>Refresh Telemetry</span>
          </button>
          <Link
            to="/user/panel"
            className="px-3.5 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 hover:text-white text-xs font-medium transition-all"
          >
            Switch to User View
          </Link>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* System Telemetry KPI Row */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          
          <div className="glass-panel p-4 rounded-xl border border-white/10 bg-dark-800/60">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Users</span>
              <Users className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="text-xl font-bold text-white">{stats.total_users}</div>
            <p className="text-[10px] text-slate-500 mt-0.5">Registered accounts</p>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-white/10 bg-dark-800/60">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Claims</span>
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-xl font-bold text-white">{stats.total_claims}</div>
            <p className="text-[10px] text-slate-500 mt-0.5">Verified statements</p>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-emerald-500/20 bg-dark-800/60">
            <div className="flex items-center justify-between text-emerald-400 text-xs mb-1">
              <span>Reliable</span>
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-xl font-bold text-emerald-400">{stats.total_verified_reliable}</div>
            <p className="text-[10px] text-slate-500 mt-0.5">Factual evidence</p>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-amber-500/20 bg-dark-800/60">
            <div className="flex items-center justify-between text-amber-400 text-xs mb-1">
              <span>Misleading</span>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-xl font-bold text-amber-400">{stats.total_misleading}</div>
            <p className="text-[10px] text-slate-500 mt-0.5">Biased / Partial</p>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-red-500/20 bg-dark-800/60">
            <div className="flex items-center justify-between text-red-400 text-xs mb-1">
              <span>False</span>
              <XCircle className="w-3.5 h-3.5 text-red-400" />
            </div>
            <div className="text-xl font-bold text-red-400">{stats.total_false}</div>
            <p className="text-[10px] text-slate-500 mt-0.5">Fabricated</p>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-cyan-500/20 bg-dark-800/60">
            <div className="flex items-center justify-between text-cyan-400 text-xs mb-1">
              <span>Vector DB</span>
              <Database className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-xl font-bold text-cyan-400">{stats.chroma_collection_size}</div>
            <p className="text-[10px] text-slate-500 mt-0.5">Embedded claims</p>
          </div>

        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'users'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Management ({usersList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('claims')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'claims'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Content Moderation ({claimsList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('telemetry')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'telemetry'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>Engine Telemetry</span>
        </button>
      </div>

      {/* TAB 1: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="glass-panel rounded-2xl border border-white/10 bg-dark-800/60 backdrop-blur-md overflow-hidden">
          
          <div className="p-4 sm:p-5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-white">Registered Accounts & Roles</h2>
              <p className="text-[11px] text-slate-400">Promote administrators, manage access status, and review user activity</p>
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search name, email, role..."
                className="pl-9 pr-3 py-1.5 bg-dark-900 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-dark-900/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-white/5">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Claims Analyzed</th>
                  <th className="py-3 px-4">Joined Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                          {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-200">{u.name || 'Anonymous User'}</div>
                          <div className="text-[11px] text-slate-500">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                        u.role === 'admin'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                          : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 text-[11px] ${
                        u.is_active ? 'text-emerald-400' : 'text-slate-500'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-emerald-400' : 'bg-slate-500'}`}></span>
                        {u.is_active ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-300">
                      {u.claims_count || 0}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-400">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => handleRoleToggle(u)}
                        disabled={actionLoading === `role-${u.id}` || u.id === user?.id}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium border border-slate-700 transition-colors disabled:opacity-40 cursor-pointer"
                        title={u.id === user?.id ? "Cannot change your own role" : "Toggle Admin / User role"}
                      >
                        {u.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStatusToggle(u)}
                        disabled={actionLoading === `status-${u.id}` || u.id === user?.id}
                        className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-colors disabled:opacity-40 cursor-pointer ${
                          u.is_active 
                            ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30' 
                            : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        }`}
                      >
                        {u.is_active ? 'Suspend' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: CLAIM MODERATION */}
      {activeTab === 'claims' && (
        <div className="glass-panel rounded-2xl border border-white/10 bg-dark-800/60 backdrop-blur-md overflow-hidden">
          
          <div className="p-4 sm:p-5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-white">Database Verification Records</h2>
              <p className="text-[11px] text-slate-400">Purge misleading claims, inspect algorithmic verdicts, and audit system integrity</p>
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                value={claimSearch}
                onChange={(e) => setClaimSearch(e.target.value)}
                placeholder="Search claim content..."
                className="pl-9 pr-3 py-1.5 bg-dark-900 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-dark-900/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-white/5">
                <tr>
                  <th className="py-3 px-4">Claim Statement</th>
                  <th className="py-3 px-4">Source Type</th>
                  <th className="py-3 px-4">Classification</th>
                  <th className="py-3 px-4">Confidence</th>
                  <th className="py-3 px-4">Risk Score</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4 text-right">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {filteredClaims.map((c) => (
                  <tr key={c.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 max-w-sm sm:max-w-md truncate font-medium text-slate-200">
                      {c.claim_text}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap capitalize text-slate-400">
                      {c.source_type}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                        c.prediction_label === 'reliable'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : c.prediction_label === 'misleading'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-red-500/20 text-red-300 border border-red-500/40'
                      }`}>
                        {c.prediction_label}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-300">
                      {c.confidence_score ? `${Math.round(c.confidence_score * 100)}%` : '—'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-mono">
                      <span className={`${
                        (c.risk_score || 0) > 60 ? 'text-red-400' : (c.risk_score || 0) > 30 ? 'text-amber-400' : 'text-emerald-400'
                      }`}>
                        {c.risk_score !== null && c.risk_score !== undefined ? `${c.risk_score}/100` : '—'}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-400">
                      {c.created_at ? new Date(c.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteClaim(c.id)}
                        disabled={actionLoading === `del-${c.id}`}
                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/25 border border-red-500/30 text-red-400 hover:text-red-300 transition-colors cursor-pointer disabled:opacity-40"
                        title="Delete Claim permanently"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SYSTEM TELEMETRY */}
      {activeTab === 'telemetry' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="glass-panel p-6 rounded-2xl border border-white/10 bg-dark-800/60 backdrop-blur-md">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-400" />
              <span>AI Verification Pipeline Architecture</span>
            </h3>
            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex justify-between p-2.5 rounded-lg bg-dark-900 border border-slate-700">
                <span className="text-slate-400">Active AI Mode:</span>
                <span className="font-semibold text-cyan-400">{stats?.ai_provider || 'Hybrid (Ollama / Cloud / Heuristic)'}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-dark-900 border border-slate-700">
                <span className="text-slate-400">Natural Language Engine:</span>
                <span className="font-semibold text-slate-200">spaCy + Linguistic Syntactic Parsing</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-dark-900 border border-slate-700">
                <span className="text-slate-400">Machine Learning Classifier:</span>
                <span className="font-semibold text-slate-200">TF-IDF (10k features) + LinearSVC / LogisticRegression</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-dark-900 border border-slate-700">
                <span className="text-slate-400">Explanation Mechanism:</span>
                <span className="font-semibold text-emerald-400">Structured Chain-of-Verification (CoVe)</span>
              </div>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-white/10 bg-dark-800/60 backdrop-blur-md">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-cyan-400" />
              <span>Storage & Vector Retrieval Engine</span>
            </h3>
            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex justify-between p-2.5 rounded-lg bg-dark-900 border border-slate-700">
                <span className="text-slate-400">Relational Database:</span>
                <span className="font-semibold text-cyan-400">{stats?.db_engine || 'SQLite ACID (misinfo_app.db)'}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-dark-900 border border-slate-700">
                <span className="text-slate-400">Vector Database:</span>
                <span className="font-semibold text-emerald-400">{stats?.vector_store_status || 'ChromaDB Local Vector Index'}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-dark-900 border border-slate-700">
                <span className="text-slate-400">Vector Dimension:</span>
                <span className="font-mono text-slate-200">384 Dimensions (all-MiniLM-L6-v2)</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-dark-900 border border-slate-700">
                <span className="text-slate-400">Embedded Verification Corpus:</span>
                <span className="font-mono text-slate-200">{stats?.chroma_collection_size || 0} Knowledge Vectors</span>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
