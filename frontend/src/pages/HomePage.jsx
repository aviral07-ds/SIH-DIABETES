import React from 'react';
import { PlayCircle, ShieldCheck, Zap, Server, Cpu, Activity, Award, CheckCircle, ArrowRight } from 'lucide-react';

export default function HomePage({ setActiveTab }) {


  const pipelineStages = [
    { num: '01', title: 'Fundus Capture', desc: 'Smartphone / desktop fundus camera attachment (45-50° FOV)', detail: 'Raw 12MP • Retina Scope' },
    { num: '02', title: 'Edge Quality Triage', desc: 'Deterministic Laplacian variance & luminance validation in <40ms', detail: 'Reject Bad Scan • <40ms' },
    { num: '03', title: 'Anatomical Masking', desc: 'Automated segmentation for optic disc, macula, and vessel architecture', detail: 'Segmentation • Dice 0.91' },
    { num: '04', title: 'Severity Staging', desc: 'Multi-task classification across ICDR severity stages 0 to 4', detail: 'Classification • 5 Stages' },
    { num: '05', title: 'Heatmap Synthesis', desc: 'High-resolution gradient-weighted attribution mapping for micro-lesion localization', detail: 'Explainability • Pixel Saliency' },
    { num: '06', title: 'Clinician Report', desc: 'Generates ABDM compliant DICOM / PDF triage summary for MO review', detail: 'Triage Output • ABHA Ready' }
  ];


  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-sky-950 via-slate-900 to-sky-900 rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden shadow-2xl border border-sky-800/40">
        
        {/* Background glow effects */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl space-y-6">
          
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-sky-900/80 border border-sky-700/60 text-sky-300 text-xs font-semibold tracking-wide">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping"></span>
            <span>SIH-2026 Special Section • Rural Health Tech</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Automated Retinal Screening Purpose—Built for India's <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-teal-300">Rural Healthcare Frontier</span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Bridging the 1:100,000 specialist gap with edge-first automated analysis, image quality filtering, and transparent visual reasoning on low-cost fundus optical devices.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <button
              onClick={() => setActiveTab('screening')}
              className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-6 py-3.5 rounded-xl shadow-lg hover:shadow-sky-500/25 transition-all flex items-center space-x-2 text-sm"
            >
              <PlayCircle className="w-5 h-5 fill-slate-950 text-sky-400" />
              <span>Start Live Screening Demo</span>
            </button>
            <button
              onClick={() => setActiveTab('how-it-works')}
              className="bg-slate-800/90 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold px-6 py-3.5 rounded-xl transition-all text-sm"
            >
              Explore Screening Pipeline
            </button>
          </div>

          {/* Key Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-6 border-t border-slate-800/80">
            <div>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">End-to-End Analysis</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-white mt-0.5">1.78s <span className="text-xs font-normal text-sky-400">(On Device)</span></p>
            </div>
            <div>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">AUROC Clinical Accuracy</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-0.5">0.962 <span className="text-xs font-normal text-slate-400">(IDRiD Cohort)</span></p>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Deployment Readiness</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-sky-300 mt-0.5">Offline <span className="text-xs font-normal text-slate-400">(Zero Cloud)</span></p>
            </div>
          </div>

        </div>

      </div>

      {/* Six-Stage Pipeline */}
      <div className="space-y-6">
        <div>
          <span className="text-xs font-extrabold tracking-widest text-sky-600 uppercase">Modular Tele-Health Pipeline</span>
          <h2 className="text-2xl font-bold text-slate-900 mt-1">Six-Stage Clinical Screening Pipeline</h2>
          <p className="text-slate-600 text-sm mt-1">Fully self-contained pipeline designed for zero-connectivity health centers, progressing from raw camera capture to an exportable ABDM-ready triage report.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {pipelineStages.map((stage) => (
            <div key={stage.num} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="text-3xl font-extrabold text-slate-200 group-hover:text-sky-500 transition-colors mb-2">
                {stage.num}
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-1">{stage.title}</h3>
              <p className="text-slate-500 text-xs leading-snug mb-3">{stage.desc}</p>
              <div className="text-[10px] font-semibold text-sky-700 bg-sky-50 px-2 py-1 rounded inline-block">
                {stage.detail}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Referral Dilemma Comparison */}
      <div className="space-y-6">
        <div>
          <span className="text-xs font-extrabold tracking-widest text-teal-600 uppercase font-mono">The Triage Paradigm</span>
          <h2 className="text-2xl font-bold text-slate-900 mt-1">Overcoming the Referral Dilemma in Rural Camps</h2>
          <p className="text-slate-600 text-sm mt-1">Why opaque diagnostics collapse under real-world clinical scrutiny, and how Drishti Care's topographic contours give community medical officers confidence instantly.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Opaque Box */}
          <div className="bg-rose-50/70 rounded-2xl p-6 border border-rose-200/80 space-y-4">
            <div className="flex justify-between items-center">
              <span className="bg-rose-100 text-rose-800 text-xs font-bold px-2.5 py-1 rounded-full flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                <span>Conventional Opaque Screening</span>
              </span>
              <span className="text-xs text-rose-700 font-medium">Standard Non-Explanatory Method</span>
            </div>

            <h3 className="text-lg font-bold text-slate-900">Opaque Probability Score</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Generates a raw percentage probability with zero visual grounding. Clinicians are forced into an "all-or-nothing" trust gamble, leading to high referral refusal rates.
            </p>

            <div className="p-4 rounded-xl bg-white border border-rose-200 text-center space-y-1">
              <p className="text-xs text-slate-500 font-medium">Output Diagnosis:</p>
              <p className="text-2xl font-extrabold text-rose-600">92.4% DR Detected</p>
              <p className="text-[11px] text-slate-400">No indication whether caused by microaneurysms, hemorrhages, or optic disc artifacts.</p>
            </div>

            <ul className="text-xs text-rose-900 space-y-1.5 font-medium">
              <li className="flex items-center space-x-2">
                <span className="text-rose-500 font-bold">✕</span>
                <span>Causes patient panic without verifiable clinical evidence</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-rose-500 font-bold">✕</span>
                <span>Overloads district hospitals with unverified false positives</span>
              </li>
            </ul>
          </div>

          {/* Explainable Box */}
          <div className="bg-emerald-50/70 rounded-2xl p-6 border border-emerald-200/80 space-y-4">
            <div className="flex justify-between items-center">
              <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                <span>Drishti Care Topographic Explainability</span>
              </span>
              <span className="text-xs text-emerald-700 font-medium">Visual Saliency Mapping</span>
            </div>

            <h3 className="text-lg font-bold text-slate-900">Saliency-Guided Microvascular Attribution</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Isolates exactly why the system raised the severity flag by overlaying calibrated heatmap contours directly onto the fundus scan.
            </p>

            <div className="p-4 rounded-xl bg-white border border-emerald-200 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-800">Visual Localization Map</span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">High Precision (0.94)</span>
              </div>
              <p className="text-xs text-slate-600">Screening attention concentrates heavily on temporal hemorrhages and foveal exudate circinates, confirming lesion significance.</p>
            </div>

            <ul className="text-xs text-emerald-900 space-y-1.5 font-medium">
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>30-second visual audit by visiting doctor or telemedicine hub</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Pinpoints microaneurysms, hemorrhages, and exudates explicitly</span>
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* Features Grid for HWCs */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-10 border border-slate-800 space-y-8">
        <div>
          <span className="text-xs font-extrabold tracking-widest text-sky-400 uppercase">Field Deployment Pillars</span>
          <h2 className="text-2xl font-bold text-white mt-1">Engineered for India's 150,000+ Ayushman Bharat Health & Wellness Centres</h2>
          <p className="text-slate-400 text-sm mt-1">Built from the ground up for environments with zero cellular signal, high ambient dust, erratic power supply, and operators with varying digital literacy.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center font-bold">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white">Zero Cloud Latency</h3>
            <p className="text-xs text-slate-400">100% Edge Local Inference. In-device model execution runs directly on base laptops/mobile devices without needing cellular signal.</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white">DISHA & ABDM Compliant</h3>
            <p className="text-xs text-slate-400">Local Ephemeral Memory. No patient retina images saved on disk without encrypted ABHA consent tokens for inter-consultation.</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white">Hardware Agnostic</h3>
            <p className="text-xs text-slate-400">Universal Optical Normalization. Evaluates fundus photography across ₹10,000 to ₹10,00,000 hospital fundus units.</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
              <Server className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white">ABHA Worker Centric</h3>
            <p className="text-xs text-slate-400">Interactive Audio + Guidance. On-screen audio-guided prompts in Hindi, Marathi, Tamil, Telugu, and Bengali.</p>
          </div>
        </div>
      </div>


      {/* CTA Footer */}
      <div className="bg-gradient-to-r from-sky-600 to-teal-600 rounded-2xl p-6 text-white flex flex-col sm:flex-row justify-between items-center shadow-lg">
        <div>
          <h3 className="font-extrabold text-lg">Experience the Diagnostic Engine Live</h3>
          <p className="text-xs text-sky-100">Test sample patient fundus scans with real-time visual feature maps and automated triage reports.</p>
        </div>
        <button
          onClick={() => setActiveTab('screening')}
          className="mt-4 sm:mt-0 bg-white text-slate-900 hover:bg-slate-100 font-bold px-6 py-3 rounded-xl shadow transition-all flex items-center space-x-2 text-sm"
        >
          <span>Launch Screening Simulator</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
}
