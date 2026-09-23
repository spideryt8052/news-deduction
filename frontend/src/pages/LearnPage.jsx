import React from 'react';
import AwarenessSection from '../components/AwarenessSection';
import { BookOpen, CheckSquare, AlertOctagon, Lightbulb, ShieldCheck } from 'lucide-react';

export default function LearnPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-xs uppercase tracking-wider font-semibold text-cyan-400 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20">
          Digital Literacy & Awareness
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          How to Spot Misleading Information
        </h1>
        <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
          Cultivate critical verification habits to protect yourself and your community from viral rumors, deceptive headlines, and AI-manipulated media.
        </p>
      </div>

      {/* Main 8 Rules */}
      <AwarenessSection />

      {/* 30-Second Verification Checklist */}
      <div className="glass-panel p-6 sm:p-10 rounded-3xl border border-white/10 space-y-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
            <CheckSquare className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              The 30-Second Verification Checklist
            </h2>
            <p className="text-xs text-slate-400">Ask yourself these 4 questions before pressing "Forward":</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-dark-900/80 border border-white/5 space-y-1.5">
            <span className="text-cyan-400 font-mono font-bold text-sm">01</span>
            <h3 className="text-sm font-semibold text-white">Who is the Author?</h3>
            <p className="text-xs text-slate-400">Can you identify an established reporter or trusted official agency behind the statement?</p>
          </div>

          <div className="p-4 rounded-2xl bg-dark-900/80 border border-white/5 space-y-1.5">
            <span className="text-cyan-400 font-mono font-bold text-sm">02</span>
            <h3 className="text-sm font-semibold text-white">When Did It Happen?</h3>
            <p className="text-xs text-slate-400">Is the footage or statement from today, or was it filmed years ago in a different country?</p>
          </div>

          <div className="p-4 rounded-2xl bg-dark-900/80 border border-white/5 space-y-1.5">
            <span className="text-cyan-400 font-mono font-bold text-sm">03</span>
            <h3 className="text-sm font-semibold text-white">What is the Tone?</h3>
            <p className="text-xs text-slate-400">Does it provoke panic, intense anger, or demand immediate forwards before it is "deleted"?</p>
          </div>

          <div className="p-4 rounded-2xl bg-dark-900/80 border border-white/5 space-y-1.5">
            <span className="text-cyan-400 font-mono font-bold text-sm">04</span>
            <h3 className="text-sm font-semibold text-white">Who Else Reports It?</h3>
            <p className="text-xs text-slate-400">If it was a momentous national event, do reputable news channels confirm the occurrence?</p>
          </div>
        </div>
      </div>

    </div>
  );
}
