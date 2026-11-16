import React from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert,
  Sparkles,
  Users,
  MessageCircle,
  Newspaper
} from 'lucide-react';
import GlobeVisual from './GlobeVisual';
import AnalyzeBox from './AnalyzeBox';

export default function HeroSection({ onAnalysisComplete }) {
  return (
    <section className="relative overflow-hidden pt-6 pb-12 md:pt-10 md:pb-16">
      
      {/* Subtle, Warm Ambient Lighting (No harsh neon!) */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] md:w-[800px] h-[400px] md:h-[600px] bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Split Grid: Left = Headline & Fast Verification Bar; Right = Real-Time Earth Globe */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column (7 cols): Clean, Human Headline & Integrated Input */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            
            {/* Friendly Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-slate-300 text-xs font-medium shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Independent Fact-Checking for Everyone</span>
            </div>

            {/* Clear, Human Headline (No AI buzzwords) */}
            <h1 className="text-3xl sm:text-5xl lg:text-5xl font-extrabold text-slate-100 tracking-tight leading-[1.15]">
              Don't forward rumors. <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-blue-400 to-emerald-400">
                Know the truth in seconds.
              </span>
            </h1>

            {/* Human Subtitle */}
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
              Received a shocking WhatsApp message, viral post, or suspicious link? Paste it below to see what credible journalists, fact-checkers, and official sources say.
            </p>

            {/* The Integrated Fast Verification Search Bar */}
            <div className="pt-2">
              <AnalyzeBox onAnalysisComplete={onAnalysisComplete} />
            </div>

            {/* Human Trust Proof Points */}
            <div className="pt-2 flex items-center justify-center lg:justify-start gap-6 text-xs text-slate-400 flex-wrap">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>100% Free & Unbiased</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-sky-400" />
                <span>Verified with Real Proof</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-400" />
                <span>Safe for Family & Friends</span>
              </div>
            </div>

          </div>

          {/* Right Column (5 cols): The 3D Earth Globe Visual */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            <GlobeVisual />
            <p className="text-center text-xs text-slate-400 font-medium -mt-2">
              Cross-checking claims across global news wires & official registries
            </p>
          </div>

        </div>

      </div>
    </section>
  );
}
