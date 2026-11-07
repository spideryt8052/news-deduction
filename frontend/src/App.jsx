import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import VoiceAssistantWidget from './components/VoiceAssistantWidget';
import { AuthProvider } from './context/AuthContext';

// Dynamic lazy-loaded routes for ultra-fast load time and code splitting
const HomePage = lazy(() => import('./pages/HomePage'));
const AnalyzePage = lazy(() => import('./pages/AnalyzePage'));
const HowItWorksPage = lazy(() => import('./pages/HowItWorksPage'));
const LearnPage = lazy(() => import('./pages/LearnPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const UserPanelPage = lazy(() => import('./pages/UserPanelPage'));
const AdminPanelPage = lazy(() => import('./pages/AdminPanelPage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const TranslatePage = lazy(() => import('./pages/TranslatePage'));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="w-8 h-8 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
  </div>
);

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
          <Suspense fallback={<PageLoader />}>
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

              {/* Dedicated Translation & Voice Studio */}
              <Route path="/translate" element={<TranslatePage />} />
              <Route path="/audio" element={<Navigate to="/translate" replace />} />
              <Route path="/translator" element={<Navigate to="/translate" replace />} />

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
          </Suspense>
        </main>

        {/* Global Interactive AI Voice Assistant Widget */}
        <VoiceAssistantWidget onAnalyzeRequested={handleVoiceAnalyzeRequested} />

        {/* Universal Footer */}
        <Footer />
      </div>
    </AuthProvider>
  );
}
