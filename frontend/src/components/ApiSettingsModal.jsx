import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertTriangle, RefreshCw, Server, ShieldCheck } from 'lucide-react';
import { getStoredApiConfig, saveApiConfig } from '../config/api';
import { checkServicesHealth } from '../services/apiService';

export default function ApiSettingsModal({ isOpen, onClose }) {
  const [config, setConfig] = useState(getStoredApiConfig());
  const [health, setHealth] = useState({ idrid: false, aptos: false, drive: false });
  const [loading, setLoading] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);

  useEffect(() => {
    if (isOpen) {
      handleCheckHealth();
    }
  }, [isOpen]);

  const handleCheckHealth = async () => {
    setLoading(true);
    const res = await checkServicesHealth();
    setHealth(res);
    setLoading(false);
  };

  const handleSave = () => {
    saveApiConfig(config);
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2000);
    handleCheckHealth();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex justify-between items-center border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Server className="w-5 h-5 text-sky-400" />
            <h3 className="font-bold text-lg">Drishti Care Deployed Microservice Settings</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* Service Health Cards */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Live Deployed API Status (Render Cloud)</label>
              <button 
                onClick={handleCheckHealth}
                disabled={loading}
                className="text-xs text-sky-600 hover:text-sky-700 font-semibold flex items-center space-x-1"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Re-check Health</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              
              <div className={`p-3 rounded-xl border ${health.idrid ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'} text-xs`}>
                <div className="flex items-center justify-between font-bold mb-1">
                  <span>IDRiD Lesions</span>
                  {health.idrid ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-amber-600" />}
                </div>
                <p className="text-[10px] opacity-80">{health.idrid ? 'Live & Ready' : 'Spinning up / Cold start'}</p>
              </div>

              <div className={`p-3 rounded-xl border ${health.aptos ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'} text-xs`}>
                <div className="flex items-center justify-between font-bold mb-1">
                  <span>APTOS DR</span>
                  {health.aptos ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-amber-600" />}
                </div>
                <p className="text-[10px] opacity-80">{health.aptos ? 'Live & Ready' : 'Spinning up / Cold start'}</p>
              </div>

              <div className={`p-3 rounded-xl border ${health.drive ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'} text-xs`}>
                <div className="flex items-center justify-between font-bold mb-1">
                  <span>DRIVE Vessel</span>
                  {health.drive ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-amber-600" />}
                </div>
                <p className="text-[10px] opacity-80">{health.drive ? 'Live & Ready' : 'Spinning up / Cold start'}</p>
              </div>

            </div>
          </div>

          {/* Configuration Inputs */}
          <div className="space-y-4">
            
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">IDRiD Lesion Segmentation Endpoint URL</label>
              <input 
                type="text"
                value={config.idridUrl}
                onChange={(e) => setConfig({ ...config, idridUrl: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">APTOS DR Grading Endpoint URL</label>
              <input 
                type="text"
                value={config.aptosUrl}
                onChange={(e) => setConfig({ ...config, aptosUrl: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Inference API Key</label>
              <input
                type="password"
                value={config.apiKey || ''}
                onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                placeholder="Required for model predictions; stored only in this browser"
                autoComplete="off"
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
              <p className="mt-1 text-[10px] text-slate-500">Do not place a secret API key in a VITE_ environment variable: it would be public in the deployed site.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Local Development API Fallback (Optional)</label>
              <input 
                type="text"
                value={config.localUrl}
                onChange={(e) => setConfig({ ...config, localUrl: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <input 
                type="checkbox"
                id="localFallback"
                checked={config.useLocalFallback}
                onChange={(e) => setConfig({ ...config, useLocalFallback: e.target.checked })}
                className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 w-4 h-4"
              />
              <label htmlFor="localFallback" className="text-xs text-slate-700 font-medium">Use Local FastAPI Endpoint (http://localhost:8000) instead of Cloud</label>
            </div>

          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-between items-center">
          {savedMessage ? (
            <span className="text-xs font-semibold text-emerald-600 flex items-center space-x-1">
              <CheckCircle className="w-4 h-4" />
              <span>Settings Saved Successfully!</span>
            </span>
          ) : (
            <span className="text-[11px] text-slate-500 flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
              <span>Connected to live Render deployment endpoints</span>
            </span>
          )}

          <div className="flex items-center space-x-3">
            <button 
              onClick={onClose}
              className="text-xs px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100"
            >
              Close
            </button>
            <button 
              onClick={handleSave}
              className="text-xs px-4 py-2 rounded-lg bg-sky-600 text-white font-semibold hover:bg-sky-700 shadow-sm"
            >
              Save Configuration
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
