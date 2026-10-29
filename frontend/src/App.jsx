import React from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import AnalyzePage from './pages/AnalyzePage';
import HowItWorksPage from './pages/HowItWorksPage';
import LearnPage from './pages/LearnPage';
import DashboardPage from './pages/DashboardPage';
import AboutPage from './pages/AboutPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import UserPanelPage from './pages/UserPanelPage';
import AdminPanelPage from './pages/AdminPanelPage';
import ChatPage from './pages/ChatPage';
import VoiceAssistantWidget from './components/VoiceAssistantWidget';
import { AuthProvider } from './context/AuthContext';

export default function App() {
  const navigate = useNavigate();

  const handleVoiceAnalyzeRequested = (claimText) => {
    navigate(`/analyze?claim=${encodeURIComponent(claimText)}`);
  };

  return (
    <AuthProvider>
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

            {/* Conversational Human-like AI (Gemini / ChatGPT style) */}
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/ask" element={<Navigate to="/chat" replace />} />
            <Route path="/assistant" element={<Navigate to="/chat" replace />} />

            {/* Authentication & User Panel */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<RegisterPage />} />
            <Route path="/user" element={<Navigate to="/user/panel" replace />} />
            <Route path="/user/panel" element={<UserPanelPage />} />

            {/* Administrative Governance Console */}
            <Route path="/admin" element={<AdminPanelPage />} />

            {/* Fallback to Home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Global Interactive AI Voice Assistant Widget */}
        <VoiceAssistantWidget onAnalyzeRequested={handleVoiceAnalyzeRequested} />

        {/* Universal Footer */}
        <Footer />
      </div>
    </AuthProvider>
  );
}
