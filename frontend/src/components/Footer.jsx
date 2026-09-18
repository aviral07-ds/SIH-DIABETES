import React from 'react';
import { Shield, Eye, AlertCircle } from 'lucide-react';

export default function Footer({ setActiveTab }) {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 mt-16 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Top Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 pb-8 border-b border-slate-800">
          
          <div className="md:col-span-2">
            <div className="flex items-center space-x-2 text-white font-extrabold text-lg mb-3">
              <Eye className="w-5 h-5 text-sky-400" />
              <span>Drishti Care Diagnostic Suite</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-md">
              Point-of-care explainable artificial intelligence for early diabetic retinopathy detection, purpose-engineered for primary health centers and rural camps across India.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">Quick Navigation</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><button onClick={() => setActiveTab('screening')} className="hover:text-sky-400 transition-colors">Screening Workflow</button></li>
              <li><button onClick={() => setActiveTab('how-it-works')} className="hover:text-sky-400 transition-colors">Explainability Matrix</button></li>
              <li><button onClick={() => setActiveTab('how-it-works')} className="hover:text-sky-400 transition-colors">Rural Health Deployment</button></li>
              <li><button onClick={() => setActiveTab('report')} className="hover:text-sky-400 transition-colors">HIPAA / DISHA Compliance</button></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">Technical Validation</h4>
            <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700 text-xs space-y-1">
              <p className="text-emerald-400 font-semibold flex items-center space-x-1">
                <Shield className="w-3.5 h-3.5" />
                <span>ICMR Validated Standards</span>
              </p>
              <p className="text-slate-400 text-[11px]">Sub-continental fundus dataset calibration (IDRiD + APTOS + DRIVE)</p>
            </div>
          </div>

        </div>

        {/* Disclaimer Banner */}
        <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/60 mb-6 flex items-start space-x-3 text-xs text-slate-300">
          <AlertCircle className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <span className="font-semibold text-white">Clinical Disclaimer:</span> Drishti Care is an AI-assisted diagnostic screening support tool designed to facilitate rapid clinical triage. It is not an autonomous medical device and does not replace formal examination by a licensed ophthalmologist or registered retinal specialist.
          </p>
        </div>

        {/* Bottom Rights */}
        <div className="flex flex-col sm:flex-row justify-between items-center text-xs text-slate-400 pt-4">
          <p>© 2026 Drishti Care India. Open Clinical Standards.</p>
          <p className="mt-2 sm:mt-0">Engineered for Edge Deployment • v2.4.0-edge</p>
        </div>

      </div>
    </footer>
  );
}
