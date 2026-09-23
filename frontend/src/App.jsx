import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import AnalyzePage from './pages/AnalyzePage';
import HowItWorksPage from './pages/HowItWorksPage';
import LearnPage from './pages/LearnPage';
import DashboardPage from './pages/DashboardPage';
import AboutPage from './pages/AboutPage';
import VoiceAssistantWidget from './components/VoiceAssistantWidget';

export default function App() {
  const navigate = useNavigate();

  const handleVoiceAnalyzeRequested = (claimText) => {
    navigate(`/analyze?claim=${encodeURIComponent(claimText)}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-dark-900 text-slate-100 selection:bg-cyan-500 selection:text-dark-900 relative">
      {/* Universal Top Navigation */}
      <Navbar />

      {/* Main Routed Content */}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/analyze" element={<AnalyzePage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/learn" element={<LearnPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </main>

      {/* Global Interactive AI Voice Assistant Widget */}
      <VoiceAssistantWidget onAnalyzeRequested={handleVoiceAnalyzeRequested} />

      {/* Universal Footer */}
      <Footer />
    </div>
  );
}
