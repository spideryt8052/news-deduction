import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, BookOpen, ExternalLink, Github, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-dark-900/90 text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand & Academic Mission */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <span className="text-base font-bold text-white tracking-tight">TruthShield</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              An AI-assisted credibility assessment and digital literacy platform helping users identify potentially misleading information across social media.
            </p>
            <div className="text-[11px] text-slate-500">
              Empowering digital citizens with transparent verification, linguistic analysis, and media literacy tools.
            </div>
          </div>

          {/* Quick Navigation */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-3">
              Platform
            </h3>
            <ul className="space-y-2 text-xs">
              <li><Link to="/" className="hover:text-cyan-400 transition-colors">Home</Link></li>
              <li><Link to="/analyze" className="hover:text-cyan-400 transition-colors">Analyze Content</Link></li>
              <li><Link to="/how-it-works" className="hover:text-cyan-400 transition-colors">Methodology & Workflow</Link></li>
              <li><Link to="/learn" className="hover:text-cyan-400 transition-colors">User Awareness Guide</Link></li>
              <li><Link to="/dashboard" className="hover:text-cyan-400 transition-colors">Analytics Dashboard</Link></li>
              <li><Link to="/about" className="hover:text-cyan-400 transition-colors">About & Project Credits</Link></li>
            </ul>
          </div>

          {/* Verification Capabilities */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-3">
              Verification Tools
            </h3>
            <ul className="space-y-2 text-xs">
              <li><Link to="/analyze" className="hover:text-cyan-400 transition-colors">Text & Post Verification</Link></li>
              <li><Link to="/analyze" className="hover:text-cyan-400 transition-colors">News URL Domain Inspection</Link></li>
              <li><Link to="/analyze" className="hover:text-cyan-400 transition-colors">Screenshot Credibility Check</Link></li>
              <li><Link to="/learn" className="hover:text-cyan-400 transition-colors">30-Second Verification Rule</Link></li>
              <li><Link to="/about" className="hover:text-cyan-400 transition-colors">Team & Academic Attribution</Link></li>
            </ul>
          </div>

          {/* Important AI Disclaimer */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-1">
              Assessment Disclaimer
            </h3>
            <div className="p-3 rounded-xl bg-dark-800 border border-white/5 text-[11px] text-slate-400 leading-relaxed">
              <span className="text-amber-400 font-semibold block mb-1">Notice:</span>
              TruthShield generates <span className="text-slate-200">AI-assisted assessments</span>, not absolute truth. It does not replace critical thinking or verified journalistic reporting. Always consult official sources before forwarding unverified information.
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2025–2027 TruthShield. AI-Assisted Credibility & Digital Literacy Platform.</p>
          <div className="flex items-center space-x-4">
            <span className="inline-flex items-center gap-1">
              <span>FastAPI</span> • <span>React</span> • <span>Tailwind CSS</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
