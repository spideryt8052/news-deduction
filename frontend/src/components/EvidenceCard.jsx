import React from 'react';
import { CheckCircle2, XCircle, AlertCircle, ExternalLink, Bookmark } from 'lucide-react';

export default function EvidenceCard({ item }) {
  if (!item) return null;

  const { title, snippet, source_name, stance, url } = item;

  const getStanceBadge = () => {
    switch (stance?.toUpperCase()) {
      case 'SUPPORTING':
        return {
          label: 'Supporting Evidence',
          bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        };
      case 'REFUTING':
        return {
          label: 'Contradicting Evidence',
          bg: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
          icon: <XCircle className="w-3.5 h-3.5 text-rose-400" />
        };
      case 'CONTEXTUAL':
      default:
        return {
          label: 'Contextual Information',
          bg: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
          icon: <AlertCircle className="w-3.5 h-3.5 text-blue-400" />
        };
    }
  };

  const badge = getStanceBadge();

  return (
    <div className="p-4 rounded-xl bg-dark-800/90 border border-white/10 hover:border-cyan-500/30 transition-all space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${badge.bg}`}>
          {badge.icon}
          {badge.label}
        </span>
        <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
          <Bookmark className="w-3 h-3 text-cyan-400" />
          {source_name}
        </span>
      </div>

      <h5 className="text-sm font-semibold text-white leading-snug">
        {title}
      </h5>

      <p className="text-xs text-slate-300 leading-relaxed">
        "{snippet}"
      </p>

      {url && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 hover:underline pt-1 font-medium"
        >
          <span>View Source Reference</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  );
}
