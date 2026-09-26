import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ApiSettingsModal from './components/ApiSettingsModal';
import HomePage from './pages/HomePage';
import ScreeningPage from './pages/ScreeningPage';
import ResultPage from './pages/ResultPage';
import AnalysisPage from './pages/AnalysisPage';
import ReportPage from './pages/ReportPage';
import HowItWorksPage from './pages/HowItWorksPage';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import HelpChatbot from './components/HelpChatbot';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [screeningData, setScreeningData] = useState(null);
  const [isApiSettingsOpen, setIsApiSettingsOpen] = useState(false);

  const handleAnalysisComplete = (data) => {
    setScreeningData(data);
    setActiveTab('result-summary');
  };

  return (
    <ThemeProvider>
    <LanguageProvider>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
        
        {/* Top Navigation */}
        <Navbar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          onOpenApiSettings={() => setIsApiSettingsOpen(true)}
        />

        {/* Main Content Body */}
        <main className="flex-1">
          {activeTab === 'home' && (
            <HomePage setActiveTab={setActiveTab} />
          )}

          {activeTab === 'how-it-works' && (
            <HowItWorksPage setActiveTab={setActiveTab} />
          )}

          {activeTab === 'screening' && (
            <ScreeningPage onAnalysisComplete={handleAnalysisComplete} />
          )}

          {activeTab === 'result-summary' && (
            <ResultPage data={screeningData} setActiveTab={setActiveTab} />
          )}

          {activeTab === 'results' && (
            <AnalysisPage data={screeningData} setActiveTab={setActiveTab} />
          )}

          {activeTab === 'analysis' && (
            <AnalysisPage data={screeningData} setActiveTab={setActiveTab} />
          )}

          {activeTab === 'report' && (
            <ReportPage data={screeningData} />
          )}
        </main>

        {/* Footer */}
        <Footer setActiveTab={setActiveTab} />

        {/* API Settings Modal */}
        <ApiSettingsModal 
          isOpen={isApiSettingsOpen} 
          onClose={() => setIsApiSettingsOpen(false)} 
        />

        {/* Floating multilingual help chatbot (11 Indian languages) */}
        <HelpChatbot />

      </div>
    </LanguageProvider>
    </ThemeProvider>
  );
}
