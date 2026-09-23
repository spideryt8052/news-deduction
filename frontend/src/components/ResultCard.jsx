import React, { useState } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  HelpCircle, 
  Share2, 
  Copy, 
  Check, 
  ThumbsUp, 
  ThumbsDown, 
  ArrowRight,
  ShieldCheck,
  FileText,
  AlertOctagon
} from 'lucide-react';
import ConfidenceMeter from './ConfidenceMeter';
import SourceCard from './SourceCard';
import EvidenceCard from './EvidenceCard';
import { CLASSIFICATION_THEMES } from '../utils/constants';
import api from '../services/api';

export default function ResultCard({ result, onReset }) {
  const [copied, setCopied] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(null); // 'helpful' | 'unhelpful'

  if (!result) return null;

  const {
    id,
    classification,
    confidence = 0.75,
    summary,
    claim,
    reasons = [],
    evidence = [],
    source_assessment,
    recommendation,
    created_at
  } = result;

  const theme = CLASSIFICATION_THEMES[classification] || CLASSIFICATION_THEMES['Needs Further Verification'];

  const handleCopy = () => {
    const textToCopy = `TruthShield Assessment: ${classification} (${Math.round(confidence * 100)}% Confidence)
Claim: "${claim}"
Recommendation: ${recommendation}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleFeedback = async (isHelpful) => {
    try {
      await api.submitFeedback({
        result_id: id || 'demo-id',
        is_helpful: isHelpful,
        comments: isHelpful ? 'User marked as helpful' : 'User flagged for review',
      });
      setFeedbackSent(isHelpful ? 'helpful' : 'unhelpful');
    } catch (err) {
      setFeedbackSent(isHelpful ? 'helpful' : 'unhelpful');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-fade-in">
      
      {/* Primary Verdict Card */}
      <div className={`p-6 sm:p-8 rounded-3xl glass-panel border ${theme.border} ${theme.glow} shadow-2xl relative overflow-hidden`}>
        
        {/* Decorative ambient gradient */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Bar: Title & Timestamp */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6 flex-wrap gap-2">
          <div className="flex items-center space-x-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
              AI Verification Report
            </span>
            <span className="text-xs text-slate-600">•</span>
            <span className="text-xs text-slate-500">
              {created_at ? new Date(created_at).toLocaleTimeString() : 'Just now'}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-dark-800 hover:bg-dark-700 text-xs text-slate-300 border border-white/5 transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Summary'}</span>
            </button>
          </div>
        </div>

        {/* Main Verdict Badge & Confidence Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center mb-6">
          <div className="md:col-span-2 space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Assessment Classification
            </span>
            <div className="flex items-center space-x-3">
              <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-lg font-bold border ${theme.badgeBg} ${theme.badgeText} ${theme.border}`}>
                <span className={`w-3 h-3 rounded-full ${theme.dot} animate-pulse`} />
                {classification}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed pt-1">
              {summary || theme.description}
            </p>
          </div>

          {/* Calibrated Confidence Meter */}
          <div>
            <ConfidenceMeter confidence={confidence} classification={classification} />
          </div>
        </div>

        {/* Extracted Claim Banner */}
        <div className="p-4 rounded-2xl bg-dark-900/80 border border-white/10 space-y-1 mb-6">
          <div className="text-xs font-semibold text-cyan-400 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            <span>Extracted Primary Claim:</span>
          </div>
          <p className="text-sm sm:text-base font-medium text-white italic">
            "{claim || 'Analyzing submitted information'}"
          </p>
        </div>

        {/* Rationale: "Why this result?" */}
        <div className="space-y-3 mb-6">
          <h4 className="text-xs uppercase tracking-wider font-semibold text-slate-300 flex items-center gap-1.5">
            <AlertOctagon className="w-4 h-4 text-cyan-400" />
            <span>Why This Result?</span>
          </h4>
          <ul className="space-y-2">
            {reasons.length > 0 ? (
              reasons.map((reason, index) => (
                <li key={index} className="flex items-start space-x-2 text-xs sm:text-sm text-slate-300">
                  <span className="text-cyan-400 font-bold mt-0.5">•</span>
                  <span>{reason}</span>
                </li>
              ))
            ) : (
              <li className="text-xs text-slate-400">
                Linguistic analysis and source evaluation provided this baseline assessment.
              </li>
            )}
          </ul>
        </div>

        {/* Source Assessment */}
        {source_assessment && (
          <div className="mb-6">
            <SourceCard sourceAssessment={source_assessment} />
          </div>
        )}

        {/* Evidence Grid */}
        {evidence && evidence.length > 0 && (
          <div className="space-y-3 mb-6">
            <h4 className="text-xs uppercase tracking-wider font-semibold text-slate-300">
              Gathered Evidence & Context ({evidence.length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {evidence.map((item, idx) => (
                <EvidenceCard key={idx} item={item} />
              ))}
            </div>
          </div>
        )}

        {/* Actionable Warning / Recommended Action */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-600/5 to-transparent border border-amber-500/30 flex items-start space-x-3 mb-6">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="text-xs uppercase tracking-wider font-bold text-amber-300 block">
              Recommended Action Before Forwarding:
            </span>
            <p className="text-xs sm:text-sm text-amber-100 font-medium">
              {recommendation || "Verify this claim using independent, established sources before sharing on messaging groups."}
            </p>
          </div>
        </div>

        {/* Footer Actions & Feedback */}
        <div className="border-t border-white/10 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <span>Was this assessment helpful?</span>
            <button
              onClick={() => handleFeedback(true)}
              className={`p-1.5 rounded-lg border transition-colors ${
                feedbackSent === 'helpful'
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : 'bg-dark-800 hover:text-white border-white/5'
              }`}
              title="Yes, helpful"
            >
              <ThumbsUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleFeedback(false)}
              className={`p-1.5 rounded-lg border transition-colors ${
                feedbackSent === 'unhelpful'
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                  : 'bg-dark-800 hover:text-white border-white/5'
              }`}
              title="Needs refinement"
            >
              <ThumbsDown className="w-3.5 h-3.5" />
            </button>
            {feedbackSent && (
              <span className="text-[11px] text-cyan-400 ml-1">Thanks for the feedback!</span>
            )}
          </div>

          {onReset && (
            <button
              onClick={onReset}
              className="px-4 py-2 rounded-xl bg-dark-800 hover:bg-dark-700 text-xs font-semibold text-slate-200 border border-white/10 hover:border-cyan-500/30 transition-all flex items-center gap-1.5"
            >
              <span>Analyze Another Claim</span>
              <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
            </button>
          )}
        </div>

      </div>

    </div>
  );
}
