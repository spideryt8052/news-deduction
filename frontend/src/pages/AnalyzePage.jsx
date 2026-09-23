import React, { useState } from 'react';
import { ShieldCheck, History, ArrowLeft, RotateCcw } from 'lucide-react';
import AnalyzeBox from '../components/AnalyzeBox';
import ResultCard from '../components/ResultCard';

export default function AnalyzePage() {
  const [analysisResult, setAnalysisResult] = useState(null);
  const [sessionHistory, setSessionHistory] = useState([]);

  const handleAnalysisComplete = (result) => {
    setAnalysisResult(result);
    setSessionHistory(prev => [result, ...prev.slice(0, 4)]);
  };

  const handleReset = () => {
    setAnalysisResult(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Studio Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="text-xs uppercase tracking-wider font-semibold text-cyan-400 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20">
          Credibility Analysis Studio
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Verify Social Media Information
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Enter text, supply a news article URL, or upload a screenshot to evaluate credibility markers and receive an explanation-first report.
        </p>
      </div>

      {/* Main Workspace */}
      <div className="space-y-8">
        {!analysisResult ? (
          <AnalyzeBox onAnalysisComplete={handleAnalysisComplete} />
        ) : (
          <div className="space-y-6">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Input</span>
              </button>
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-dark-800 hover:bg-dark-700 text-slate-300 border border-white/5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>New Analysis</span>
              </button>
            </div>
            <ResultCard result={analysisResult} onReset={handleReset} />
          </div>
        )}
      </div>

      {/* Session History (Quick Review) */}
      {sessionHistory.length > 1 && !analysisResult && (
        <div className="max-w-3xl mx-auto pt-8 border-t border-white/10 space-y-4">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <History className="w-4 h-4 text-cyan-400" />
            <span>Recent Evaluations in this Session</span>
          </div>
          <div className="space-y-2">
            {sessionHistory.map((item, index) => (
              <div
                key={index}
                onClick={() => setAnalysisResult(item)}
                className="p-3.5 rounded-xl bg-dark-800/80 hover:bg-dark-800 border border-white/5 hover:border-cyan-500/30 flex items-center justify-between cursor-pointer transition-all text-xs"
              >
                <span className="font-medium text-slate-200 truncate max-w-md">
                  "{item.claim || item.summary}"
                </span>
                <span className="text-cyan-400 font-semibold flex-shrink-0 ml-2">
                  {item.classification}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
