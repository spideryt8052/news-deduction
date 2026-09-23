import React, { useState, useEffect } from 'react';
import { 
  BarChart2, 
  PieChart as PieChartIcon, 
  History, 
  Filter, 
  Search, 
  Activity, 
  Info,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Eye
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid 
} from 'recharts';
import api from '../services/api';

const SAMPLE_HISTORY = [
  {
    id: 'demo-1',
    claim: 'Garlic water remedy cures viral respiratory infections in 2 hours',
    classification: 'Likely False',
    confidence: 0.88,
    type: 'Text',
    date: '2026-09-22 14:30',
  },
  {
    id: 'demo-2',
    claim: 'WHO issues updated dietary guidelines on daily adult sodium intake',
    classification: 'Likely Reliable',
    confidence: 0.92,
    type: 'URL',
    date: '2026-09-22 12:15',
  },
  {
    id: 'demo-3',
    claim: 'Golden asteroid collision will alter global wealth by next Tuesday',
    classification: 'Potentially Misleading',
    confidence: 0.82,
    type: 'Text',
    date: '2026-09-21 18:40',
  },
  {
    id: 'demo-4',
    claim: 'Regional power grid failure scheduled across entire state for 72 hours',
    classification: 'Needs Further Verification',
    confidence: 0.65,
    type: 'Screenshot',
    date: '2026-09-21 09:20',
  },
  {
    id: 'demo-5',
    claim: 'Central bank announces immediate invalidation of physical currency notes',
    classification: 'Likely False',
    confidence: 0.94,
    type: 'Text',
    date: '2026-09-20 16:05',
  },
  {
    id: 'demo-6',
    claim: 'Ministry of Education announces new digital literacy syllabus integration',
    classification: 'Likely Reliable',
    confidence: 0.89,
    type: 'URL',
    date: '2026-09-20 11:30',
  }
];

const CHART_DATA = [
  { name: 'Likely Reliable', value: 34, color: '#10b981' },
  { name: 'Potentially Misleading', value: 41, color: '#f59e0b' },
  { name: 'Likely False', value: 58, color: '#f43f5e' },
  { name: 'Needs Verification', value: 23, color: '#3b82f6' },
];

export default function DashboardPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [stats, setStats] = useState({
    total: 156,
    reliable: 34,
    misleading: 41,
    false_cnt: 58,
    unverified: 23,
    isLive: false,
  });
  const [historyItems, setHistoryItems] = useState(SAMPLE_HISTORY);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const [statsRes, historyRes] = await Promise.allSettled([
          api.getStats(),
          api.getHistory(30, 0),
        ]);

        if (statsRes.status === 'fulfilled' && statsRes.value) {
          const s = statsRes.value;
          setStats({
            total: s.total_analyses,
            reliable: s.reliable_count,
            misleading: s.misleading_count,
            false_cnt: s.false_count,
            unverified: s.unverified_count,
            isLive: true,
          });
        }

        if (historyRes.status === 'fulfilled' && Array.isArray(historyRes.value) && historyRes.value.length > 0) {
          const mapped = historyRes.value.map(item => ({
            id: item.id,
            claim: item.claim,
            classification: item.classification,
            confidence: item.confidence,
            type: item.input_type?.toUpperCase() || 'TEXT',
            date: new Date(item.created_at).toLocaleString(),
          }));
          setHistoryItems(mapped);
        }
      } catch (err) {
        console.log('Using seeded prototype history and stats:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const chartData = [
    { name: 'Likely Reliable', value: stats.reliable, color: '#10b981' },
    { name: 'Potentially Misleading', value: stats.misleading, color: '#f59e0b' },
    { name: 'Likely False', value: stats.false_cnt, color: '#f43f5e' },
    { name: 'Needs Verification', value: stats.unverified, color: '#3b82f6' },
  ];

  const filteredHistory = historyItems.filter(item => {
    const matchesSearch = item.claim.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === 'ALL' || item.classification === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Analytics & Verification Dashboard
            </h1>
            <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
              stats.isLive
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
            }`}>
              {stats.isLive ? 'FastAPI Live Data' : 'Demo Prototype Mode'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Monitoring detection patterns, query distributions, and historical verification records.
          </p>
        </div>

        {/* Demo Data Disclaimer Badge */}
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-dark-800 border border-white/5 text-xs text-slate-400">
          <Info className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          <span>Metrics below represent prototype evaluation test records.</span>
        </div>
      </div>

      {/* 4 Key Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl glass-panel border border-emerald-500/20 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Likely Reliable</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">{stats.reliable}</div>
          <p className="text-[11px] text-emerald-400/80 font-medium">
            {stats.total ? ((stats.reliable / stats.total) * 100).toFixed(1) : 0}% of records
          </p>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-amber-500/20 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Potentially Misleading</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white">{stats.misleading}</div>
          <p className="text-[11px] text-amber-400/80 font-medium">
            {stats.total ? ((stats.misleading / stats.total) * 100).toFixed(1) : 0}% of records
          </p>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-rose-500/20 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Likely False</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-white">{stats.false_cnt}</div>
          <p className="text-[11px] text-rose-400/80 font-medium">
            {stats.total ? ((stats.false_cnt / stats.total) * 100).toFixed(1) : 0}% of records
          </p>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-blue-500/20 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Needs Verification</span>
            <Eye className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white">{stats.unverified}</div>
          <p className="text-[11px] text-blue-400/80 font-medium">
            {stats.total ? ((stats.unverified / stats.total) * 100).toFixed(1) : 0}% of records
          </p>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Donut Distribution */}
        <div className="p-6 rounded-2xl glass-panel border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-cyan-400" />
              <span>Classification Distribution (N={stats.total})</span>
            </h3>
            <span className="text-[11px] text-slate-500">Relative share</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ 
                    backgroundColor: '#0d1527', 
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    fontSize: '12px'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[11px]">
            {chartData.map((c, i) => (
              <div key={i} className="p-1.5 rounded-lg bg-dark-900/60 border border-white/5">
                <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: c.color }}></span>
                <span className="text-slate-300 font-medium">{c.name.split(' ')[0]}</span>: <span className="text-white font-bold">{c.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 2: Bar Breakdown */}
        <div className="p-6 rounded-2xl glass-panel border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-cyan-400" />
              <span>Evaluation Counts by Category</span>
            </h3>
            <span className="text-[11px] text-slate-500">Frequency count</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} interval={0} angle={-15} textAnchor="end" />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <RechartsTooltip 
                  contentStyle={{ 
                    backgroundColor: '#0d1527', 
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    fontSize: '12px'
                  }} 
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Historical Logs Table */}
      <div className="p-6 rounded-3xl glass-panel border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <History className="w-4 h-4 text-cyan-400" />
              <span>Recent Verification Logs</span>
            </h3>
            <p className="text-xs text-slate-400">Search historical evaluations and inspect categorized claims.</p>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex items-center space-x-2">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search claims..."
                className="py-1.5 pl-8 pr-3 rounded-xl bg-dark-900 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-44 sm:w-56"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>

            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="py-1.5 px-2.5 rounded-xl bg-dark-900 border border-white/10 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Categories</option>
              <option value="Likely Reliable">Likely Reliable</option>
              <option value="Potentially Misleading">Potentially Misleading</option>
              <option value="Likely False">Likely False</option>
              <option value="Needs Further Verification">Needs Verification</option>
            </select>
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-dark-900/80 text-slate-400 uppercase font-semibold text-[10px] border-b border-white/10">
              <tr>
                <th className="p-3">Claim Analyzed</th>
                <th className="p-3">Modality</th>
                <th className="p-3">Classification</th>
                <th className="p-3">AI Confidence</th>
                <th className="p-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredHistory.map((row) => (
                <tr key={row.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-3 font-medium text-white max-w-sm truncate">
                    "{row.claim}"
                  </td>
                  <td className="p-3 text-slate-400">{row.type}</td>
                  <td className="p-3">
                    <span className="font-semibold text-cyan-400">
                      {row.classification}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-slate-300">
                    {Math.round(row.confidence * 100)}%
                  </td>
                  <td className="p-3 text-slate-500">{row.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Responsive Cards View (< 640px) */}
        <div className="sm:hidden space-y-3">
          {filteredHistory.map((row) => (
            <div key={row.id} className="p-4 rounded-xl bg-dark-900/80 border border-white/5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded bg-dark-800 text-[10px] font-mono text-slate-400 border border-white/5">
                  {row.type}
                </span>
                <span className="font-semibold text-cyan-400 text-[11px]">
                  {row.classification}
                </span>
              </div>
              <p className="font-medium text-white leading-relaxed">
                "{row.claim}"
              </p>
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-white/5">
                <span>Confidence: <strong className="text-slate-300">{Math.round(row.confidence * 100)}%</strong></span>
                <span>{row.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
