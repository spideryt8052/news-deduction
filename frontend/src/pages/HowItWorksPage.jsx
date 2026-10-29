import React from 'react';
import { Link } from 'react-router-dom';
import HowItWorks from '../components/HowItWorks';
import { 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Eye, 
  ArrowRight,
  Clock,
  ExternalLink,
  MessageSquareWarning,
  Sparkles
} from 'lucide-react';

export default function HowItWorksPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      
      {/* Page Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-xs uppercase tracking-wider font-semibold text-cyan-400 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20">
          User Guide & Verification
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          How to Verify News with TruthShield
        </h1>
        <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
          A simple, step-by-step guide to checking viral social posts, understanding credibility ratings, and stopping fake news before it spreads.
        </p>
      </div>

      {/* 3-Step Verification Guide */}
      <HowItWorks />

      {/* Understanding the 4 Credibility Ratings */}
      <div className="glass-panel p-6 sm:p-10 rounded-3xl border border-white/10 space-y-8">
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-cyan-400 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20">
            Reading Your Results
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mt-3 mb-2">
            What Do the Credibility Ratings Mean?
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Every analysis on TruthShield gives you a clear rating so you immediately know what to do:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Likely Reliable */}
          <div className="p-5 sm:p-6 rounded-2xl bg-dark-900/80 border border-emerald-500/20 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-emerald-400">Likely Reliable</h3>
                <span className="text-xs text-slate-400">Verified by established sources</span>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              The claims are consistent with reporting from recognized news agencies or official government and medical releases.
            </p>
            <div className="text-[11px] text-emerald-300/80 bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-500/20">
              <strong>What to do:</strong> Safe to read and share. Still check citations for full context.
            </div>
          </div>

          {/* Potentially Misleading */}
          <div className="p-5 sm:p-6 rounded-2xl bg-dark-900/80 border border-amber-500/20 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-amber-400">Potentially Misleading</h3>
                <span className="text-xs text-slate-400">Partial facts with distorted context</span>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Contains some true details, but the headline is exaggerated, key facts are left out, or old footage is presented as current.
            </p>
            <div className="text-[11px] text-amber-300/80 bg-amber-950/30 p-2.5 rounded-lg border border-amber-500/20">
              <strong>What to do:</strong> Do not forward the sensational headline. Read the full fact-check evidence first.
            </div>
          </div>

          {/* Likely False */}
          <div className="p-5 sm:p-6 rounded-2xl bg-dark-900/80 border border-rose-500/20 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-rose-400">Likely False</h3>
                <span className="text-xs text-slate-400">Debunked or fabricated claim</span>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Directly disproven by reliable fact-checkers, scientific evidence, or official statements. Often designed to trigger fear or outrage.
            </p>
            <div className="text-[11px] text-rose-300/80 bg-rose-950/30 p-2.5 rounded-lg border border-rose-500/20">
              <strong>What to do:</strong> Do not share. Inform the sender politely so they don't mislead others.
            </div>
          </div>

          {/* Needs Further Verification */}
          <div className="p-5 sm:p-6 rounded-2xl bg-dark-900/80 border border-blue-500/20 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-blue-400">Needs Further Verification</h3>
                <span className="text-xs text-slate-400">Breaking or unconfirmed news</span>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              The story may be breaking right now, or there isn't enough authoritative evidence yet to prove or disprove the claim.
            </p>
            <div className="text-[11px] text-blue-300/80 bg-blue-950/30 p-2.5 rounded-lg border border-blue-500/20">
              <strong>What to do:</strong> Wait before sharing. Give accredited journalists time to confirm the facts.
            </div>
          </div>

        </div>
      </div>

      {/* Practical Social Media Safety Tips */}
      <div className="p-6 sm:p-8 rounded-3xl bg-dark-800/80 border border-white/10 space-y-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-cyan-400" />
          <span>The 30-Second Rule Before Forwarding</span>
        </h3>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          Most fake news spreads not out of malice, but because people share without checking. Always pause for 30 seconds:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-dark-900/90 border border-white/5 space-y-1.5">
            <span className="text-cyan-400 font-bold block text-sm">1. Check the Source</span>
            <p className="text-slate-400">Look closely at the URL. Does it mimic a real outlet (like bbc-india.xyz instead of bbc.com)?</p>
          </div>

          <div className="p-4 rounded-xl bg-dark-900/90 border border-white/5 space-y-1.5">
            <span className="text-cyan-400 font-bold block text-sm">2. Check the Date</span>
            <p className="text-slate-400">Many viral posts use real photos or events from 5–10 years ago to create false outrage today.</p>
          </div>

          <div className="p-4 rounded-xl bg-dark-900/90 border border-white/5 space-y-1.5">
            <span className="text-cyan-400 font-bold block text-sm">3. Search for Verification</span>
            <p className="text-slate-400">If a huge national claim is true, at least one major news channel will be covering it.</p>
          </div>
        </div>

        {/* CTA */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/5">
          <span className="text-xs text-slate-400">Have a claim you want to check right now?</span>
          <Link
            to="/analyze"
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-xs hover:from-cyan-400 hover:to-blue-500 transition-all flex items-center gap-2 shadow-lg shadow-cyan-500/20"
          >
            <span>Analyze a Claim Now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

    </div>
  );
}
