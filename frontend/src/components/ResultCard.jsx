import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  AlertOctagon,
  Volume2,
  VolumeX,
  RotateCcw,
  Globe,
  Sparkles,
  MapPin,
  Calendar,
  Layers,
  MessageSquare
} from 'lucide-react';
import ConfidenceMeter from './ConfidenceMeter';
import SourceCard from './SourceCard';
import EvidenceCard from './EvidenceCard';
import { CLASSIFICATION_THEMES } from '../utils/constants';
import api from '../services/api';
import voiceService, { OMNIVOICE_LANGUAGES } from '../services/voiceService';

export default function ResultCard({ result, onReset }) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(null); // 'helpful' | 'unhelpful'
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceLang, setVoiceLang] = useState(result?.selected_language || 'hi-IN');

  useEffect(() => {
    // Stop speech when component unmounts or result changes
    return () => {
      voiceService.stopSpeaking();
    };
  }, [result]);

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
    origin_info,
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

  const handleToggleVoiceReport = () => {
    if (isSpeaking) {
      voiceService.stopSpeaking();
      setIsSpeaking(false);
    } else {
      const speechScript = voiceService.formatReportScript(result, voiceLang);
      voiceService.speak(speechScript, {
        lang: voiceLang,
        readFull: true,
        onStart: () => setIsSpeaking(true),
        onEnd: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false)
      });
    }
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

        {/* Top Bar: Title & Action Controls */}
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
            {/* OmniVoice Language Select & Report Reader */}
            <div className="flex items-center gap-1.5">
              <select
                value={voiceLang}
                onChange={(e) => {
                  setVoiceLang(e.target.value);
                  voiceService.stopSpeaking();
                  setIsSpeaking(false);
                }}
                className="bg-slate-900/90 border border-slate-700/80 rounded-lg px-2 py-1 text-[11px] text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
                title="OmniVoice Narration Language"
              >
                {OMNIVOICE_LANGUAGES.map((l) => (
                  <option key={l.id} value={l.code || l.id}>
                    {l.flag} {l.name} ({l.native})
                  </option>
                ))}
              </select>

              <button
                onClick={handleToggleVoiceReport}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  isSpeaking
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm animate-pulse'
                    : 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                }`}
                title={isSpeaking ? "Stop Voice Report" : "Listen to Verdict via OmniVoice"}
              >
                {isSpeaking ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                    <span>Stop Voice</span>
                    <span className="flex items-center gap-0.5 ml-1">
                      <span className="w-1 h-2 bg-rose-400 animate-pulse" />
                      <span className="w-1 h-3 bg-rose-400 animate-pulse delay-75" />
                      <span className="w-1 h-2 bg-rose-400 animate-pulse delay-150" />
                    </span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Listen</span>
                  </>
                )}
              </button>
            </div>

            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-dark-800 hover:bg-dark-700 text-xs text-slate-300 border border-white/5 transition-all cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            {/* Bridge to AI Chat */}
            <button
              onClick={() => navigate('/chat', { state: { verifiedClaim: result } })}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600/30 to-cyan-500/30 hover:from-purple-600/50 hover:to-cyan-500/50 text-xs font-semibold text-cyan-200 border border-cyan-500/30 transition-all cursor-pointer shadow-sm"
              title="Chat with AI about this claim"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Ask AI (AI से पूछें)</span>
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

        {/* Origin & Provenance Investigation Section ("Kahan Ka Hai" / उत्पत्ति और स्रोत की पड़ताल) */}
        {origin_info && (
          <div className="p-5 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-dark-900/80 to-indigo-950/40 border border-cyan-500/30 space-y-3 mb-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-lg bg-cyan-500/20 text-cyan-400">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs uppercase tracking-wider font-bold text-cyan-300">
                    Origin & Provenance (कहाँ का है / असली स्रोत की पड़ताल)
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Deep investigation into location, original channel, and recycled context
                  </p>
                </div>
              </div>
              <span className="text-[10px] uppercase px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-bold">
                Origin Verified
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="bg-dark-800/90 p-3 rounded-xl border border-white/10 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Geographic Origin (स्थान / देश):</span>
                </span>
                <p className="text-xs sm:text-sm font-semibold text-white">
                  {origin_info.location || "Global / Online"}
                </p>
              </div>

              <div className="bg-dark-800/90 p-3 rounded-xl border border-white/10 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-cyan-400" />
                  <span>First Circulated (पहला मंच):</span>
                </span>
                <p className="text-xs sm:text-sm font-semibold text-white">
                  {origin_info.original_platform || "Viral Social Media Forward"}
                </p>
              </div>

              <div className="bg-dark-800/90 p-3 rounded-xl border border-white/10 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Timeline / Recycled (कब का है):</span>
                </span>
                <p className="text-xs sm:text-sm font-semibold text-white">
                  {origin_info.first_seen_period || "Recent"}
                </p>
              </div>
            </div>

            {origin_info.provenance_details && (
              <div className="text-xs text-slate-200 bg-dark-900/80 p-3 rounded-xl border border-white/10 leading-relaxed space-y-1">
                <div className="font-semibold text-cyan-300 flex items-center gap-1.5">
                  <span>🔬 Provenance & Authenticity Details:</span>
                </div>
                <p className="text-slate-300">{origin_info.provenance_details}</p>
              </div>
            )}
          </div>
        )}

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

        {/* Actionable Behavioral Nudge Card */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs sm:text-sm space-y-1.5 mb-6">
          <div className="font-bold flex items-center space-x-1.5 text-amber-400">
            <AlertTriangle className="w-4 h-4" />
            <span>Think Before You Share — Actionable Guidance:</span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            {recommendation || 'Always consult verified official registries or independent news agencies before forwarding.'}
          </p>
        </div>

        {/* User Feedback & Community Review Loop */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center space-x-3">
            <span className="text-xs text-slate-400">Was this assessment helpful?</span>
            <button
              onClick={() => handleFeedback(true)}
              disabled={feedbackSent !== null}
              className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-all cursor-pointer ${
                feedbackSent === 'helpful'
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 font-bold'
                  : 'bg-dark-800 border-white/5 text-slate-400 hover:text-white'
              }`}
            >
              <ThumbsUp className="w-3.5 h-3.5" />
              <span>Yes</span>
            </button>
            <button
              onClick={() => handleFeedback(false)}
              disabled={feedbackSent !== null}
              className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-all cursor-pointer ${
                feedbackSent === 'unhelpful'
                  ? 'bg-rose-500/20 border-rose-500 text-rose-400 font-bold'
                  : 'bg-dark-800 border-white/5 text-slate-400 hover:text-white'
              }`}
            >
              <ThumbsDown className="w-3.5 h-3.5" />
              <span>Needs Review</span>
            </button>
            {feedbackSent && (
              <span className="text-xs text-emerald-400 animate-fade-in">
                Thank you for your feedback!
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/chat', { state: { verifiedClaim: result } })}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Discuss with AI Assistant (AI से पूछें)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {onReset && (
              <button
                onClick={onReset}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-dark-800 hover:bg-dark-700 text-xs font-semibold text-cyan-400 border border-white/5 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Analyze Another</span>
              </button>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
