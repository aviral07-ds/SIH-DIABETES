import React from 'react';
import { Eye, ShieldCheck, Activity, Globe, Sliders, PlayCircle, Moon, Sun } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

export default function Navbar({ activeTab, setActiveTab, onOpenApiSettings }) {
  const { lang, toggleLanguage, t } = useLanguage();
  const { darkMode, toggleDarkMode } = useTheme();

  const navItems = [
    { id: 'home', label: t.navHome },
    { id: 'screening', label: t.navScreening },
    { id: 'analysis', label: t.navAnalysis },
    { id: 'results', label: t.navResults },
    { id: 'report', label: t.navReport },
    { id: 'how-it-works', label: t.navHowItWorks },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-700 shadow-sm">
      {/* NHA Compliance Top Bar Banner */}
      <div className="bg-slate-900 dark:bg-slate-950 text-slate-300 text-xs py-1 px-4 flex justify-between items-center border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>{t.officialCompliance}</span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-slate-400 hidden sm:inline">{t.govtDept}</span>
          <button 
            onClick={onOpenApiSettings}
            className="hover:text-white flex items-center space-x-1 text-slate-300 transition-colors"
          >
            <Sliders className="w-3 h-3" />
            <span>{t.apiStatus}</span>
          </button>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo */}
          <div 
            onClick={() => setActiveTab('home')}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-sky-600 text-sky-400 dark:text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform border border-slate-700 dark:border-sky-500">
              <Eye className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white">Drishti<span className="text-sky-600 dark:text-sky-400">Care</span></span>
                <span className="bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-300 text-[10px] font-bold px-1.5 py-0.5 rounded tracking-wide uppercase">{t.clinicalTriage}</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-wider uppercase">{t.pointOfCareEngine}</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === item.id
                    ? 'bg-slate-900 dark:bg-sky-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Right Status Badges & CTAs */}
          <div className="flex items-center space-x-3">
            
            {/* SIH Badge */}
            <div className="hidden xl:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-300 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              <span>{t.sihBadge}</span>
            </div>

            {/* Offline Edge AI Badge */}
            <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 text-xs font-medium">
              <Activity className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{t.offlineEdgeAi}</span>
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="flex items-center justify-center w-8 h-8 rounded-lg border transition-all shadow-sm bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-yellow-300 hover:bg-slate-200 dark:hover:bg-slate-600"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Language Switch */}
            <button 
              onClick={toggleLanguage}
              className="flex items-center space-x-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-all shadow-sm bg-sky-50 dark:bg-sky-900/40 border-sky-300 dark:border-sky-700 text-sky-900 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-800/40"
            >
              <Globe className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span>{lang === 'en' ? 'English | हिंदी' : 'हिंदी | English'}</span>
            </button>

            {/* Start Screening CTA */}
            <button
              onClick={() => setActiveTab('screening')}
              className="flex items-center space-x-1.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm px-4 py-2 rounded-lg shadow-sm hover:shadow transition-all"
            >
              <PlayCircle className="w-4 h-4" />
              <span>{t.startScreening}</span>
            </button>

          </div>

        </div>
      </div>
    </header>
  );
}
