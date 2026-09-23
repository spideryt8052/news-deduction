import React from 'react';
import { Globe, ShieldAlert, ShieldCheck, HelpCircle, ExternalLink } from 'lucide-react';

export default function SourceCard({ sourceAssessment }) {
  if (!sourceAssessment) {
    return null;
  }

  const { source, credibility, details } = sourceAssessment;

  const getBadgeStyle = () => {
    switch (credibility) {
      case 'Verified Authority':
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
          icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />
        };
      case 'Known Media Outlet':
        return {
          bg: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
          icon: <ShieldCheck className="w-4 h-4 text-cyan-400" />
        };
      case 'Suspicious / Satire':
      case 'Low Credibility':
        return {
          bg: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
          icon: <ShieldAlert className="w-4 h-4 text-rose-400" />
        };
      default:
        return {
          bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
          icon: <HelpCircle className="w-4 h-4 text-amber-400" />
        };
    }
  };

  const badge = getBadgeStyle();

  return (
    <div className="p-5 rounded-2xl glass-panel border border-white/10 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Globe className="w-4 h-4 text-cyan-400" />
          <h4 className="text-sm font-semibold text-slate-200">Source Assessment</h4>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${badge.bg}`}>
          {badge.icon}
          <span>{credibility}</span>
        </span>
      </div>

      <div className="space-y-1">
        <div className="text-xs text-slate-400">Identified Source / Platform:</div>
        <div className="text-sm font-medium text-white break-all flex items-center gap-1.5">
          <span>{source || 'Anonymous / Forwarded Content'}</span>
        </div>
      </div>

      <p className="text-xs text-slate-300 leading-relaxed bg-dark-900/60 p-3 rounded-xl border border-white/5">
        {details || 'Source could not be automatically verified. User discretion is advised.'}
      </p>
    </div>
  );
}
