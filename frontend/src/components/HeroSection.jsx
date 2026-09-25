import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Eye, 
  ShieldAlert,
  Play
} from 'lucide-react';
import GlobeVisual from './GlobeVisual';

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-8 pb-12 md:pt-14 md:pb-20">
      
      {/* Background ambient lighting */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[600px] h-[350px] sm:h-[600px] bg-gradient-to-tr from-cyan-500/15 via-blue-600/10 to-purple-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Split Grid on Desktop, Stacked on Mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left / Main Text Column (7 cols on desktop) */}
          <div className="lg:col-span-7 text-center lg:text-left space-y-6">
            
            {/* Platform Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold tracking-wide uppercase shadow-inner">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI-Powered Misinformation Detection & Verification</span>
            </div>

            {/* Main Title */}
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-[1.15]">
              Think Before <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                You Share.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base md:text-lg text-slate-300 max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
              AI-assisted analysis for potentially misleading information. Evaluate viral social claims, news headlines, and screenshots with transparent explanations before trusting or forwarding.
            </p>

            {/* Action CTAs with >=44px touch targets */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
              <Link
                to="/analyze"
                className="w-full sm:w-auto min-h-[48px] px-8 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-sm hover:from-cyan-400 hover:to-blue-500 shadow-xl shadow-cyan-500/25 transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                <span>Analyze Information</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to="/how-it-works"
                className="w-full sm:w-auto min-h-[48px] px-7 py-3.5 rounded-2xl bg-dark-800/90 hover:bg-dark-700 text-slate-200 font-semibold text-sm border border-white/10 hover:border-cyan-500/30 transition-all flex items-center justify-center gap-2"
              >
                <span>Methodology Flowchart</span>
              </Link>
            </div>

            {/* 4 Classification Pillars preview */}
            <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-xl mx-auto lg:mx-0 text-left">
              <div className="p-2.5 sm:p-3 rounded-xl bg-dark-800/70 border border-white/5 space-y-0.5">
                <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Likely Reliable</span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-400">Verified institutional reports.</p>
              </div>

              <div className="p-2.5 sm:p-3 rounded-xl bg-dark-800/70 border border-white/5 space-y-0.5">
                <div className="flex items-center gap-1.5 text-amber-400 text-xs font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Misleading</span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-400">Context altered / distorted.</p>
              </div>

              <div className="p-2.5 sm:p-3 rounded-xl bg-dark-800/70 border border-white/5 space-y-0.5">
                <div className="flex items-center gap-1.5 text-rose-400 text-xs font-semibold">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Likely False</span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-400">Contradicted by evidence.</p>
              </div>

              <div className="p-2.5 sm:p-3 rounded-xl bg-dark-800/70 border border-white/5 space-y-0.5">
                <div className="flex items-center gap-1.5 text-blue-400 text-xs font-semibold">
                  <Eye className="w-3.5 h-3.5" />
                  <span>Unverified</span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-400">Awaiting corroboration.</p>
              </div>
            </div>

          </div>

          {/* Right Column: 3D Digital Earth with Orbiting Media Cards (5 cols on desktop) */}
          <div className="lg:col-span-5 flex items-center justify-center relative mt-4 lg:mt-0">
            <GlobeVisual />
          </div>

        </div>

      </div>

    </section>
  );
}
