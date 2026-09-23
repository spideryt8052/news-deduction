import React from 'react';
import { HelpCircle, AlertCircle } from 'lucide-react';

export default function ConfidenceMeter({ confidence = 0.75, classification = 'Needs Further Verification' }) {
  // Convert float 0.0 - 1.0 to percentage
  const percentage = Math.round(confidence * 100);

  // Determine meter styling based on classification
  const getColorClass = () => {
    switch (classification) {
      case 'Likely Reliable':
        return 'from-emerald-500 to-teal-400 text-emerald-400 bg-emerald-500/20';
      case 'Potentially Misleading':
        return 'from-amber-500 to-orange-400 text-amber-400 bg-amber-500/20';
      case 'Likely False':
        return 'from-rose-500 to-red-600 text-rose-400 bg-rose-500/20';
      case 'Needs Further Verification':
      default:
        return 'from-blue-500 to-indigo-500 text-blue-400 bg-blue-500/20';
    }
  };

  return (
    <div className="p-4 rounded-xl bg-dark-800/80 border border-white/10 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1.5">
          <span className="text-xs font-semibold text-slate-300">
            AI Assessment Confidence
          </span>
          <div className="group relative cursor-pointer" title="Confidence is an algorithmic estimate based on available evidence, source reputation, and text consistency, not an absolute scientific certainty.">
            <HelpCircle className="w-3.5 h-3.5 text-slate-500 hover:text-slate-300 transition-colors" />
          </div>
        </div>
        <span className="text-base font-bold text-white tracking-tight">
          {percentage}%
        </span>
      </div>

      {/* Progress Bar Container */}
      <div className="w-full h-2.5 rounded-full bg-dark-900 border border-white/5 overflow-hidden p-0.5">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${getColorClass()} transition-all duration-700 ease-out`}
          style={{ width: `${Math.max(5, Math.min(100, percentage))}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
        <span>Low Evidence</span>
        <span className="italic text-slate-400">Heuristic / Semantic Score</span>
        <span>High Corroboration</span>
      </div>
    </div>
  );
}
