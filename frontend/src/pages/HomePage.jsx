import React from 'react';
import { PlayCircle, ShieldCheck, Zap, Server, Cpu, Activity, Award, CheckCircle, ArrowRight, Layers, Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function HomePage({ setActiveTab }) {
  const { t, language, lang } = useLanguage();
  const isHi = (language || lang) === 'hi';

  const pipelineStages = [
    { num: '01', title: isHi ? 'फंडस कैप्चर' : 'Fundus Capture', desc: isHi ? 'स्मार्टफोन / डेस्कटॉप फंडस कैमरा अटैचमेंट (45-50° FOV)' : 'Smartphone / desktop fundus camera attachment (45-50° FOV)', detail: '12MP Optical • Retina Scope' },
    { num: '02', title: isHi ? 'गुणवत्ता जांच' : 'Edge Quality Triage', desc: isHi ? 'लाप्लासियन भिन्नता एवं रोशनी जांच <40ms में' : 'Deterministic Laplacian variance & luminance validation in <40ms', detail: 'Reject Bad Scan • <40ms' },
    { num: '03', title: isHi ? 'घाव विभाजन' : 'Lesion Segmentation', desc: isHi ? 'ऑप्टिक डिस्क, मैकुला और वाहिकाओं का स्वचालित U-Net विभाजन' : 'Automated U-Net segmentation for micro-lesions and vascular architecture', detail: 'U-Net • Multi-Class' },
    { num: '04', title: isHi ? 'गंभीरता वर्गीकरण' : 'Severity Staging', desc: isHi ? 'ICDR स्टेज 0 से 4 तक मल्टी-टास्क क्लासिफिकेशन' : 'Multi-task classification across ICDR severity stages 0 to 4', detail: 'ResNet-50 • 5 Stages' },
    { num: '05', title: isHi ? 'हीटमैप संश्लेषण' : 'Heatmap Synthesis', desc: isHi ? 'माइक्रो-घावों के स्थानीयकरण के लिए उच्च-रिज़ॉल्यूशन ग्रैड-सीएएम++' : 'High-resolution gradient-weighted attribution mapping for micro-lesion localization', detail: 'Grad-CAM++ • Saliency' },
    { num: '06', title: isHi ? 'क्लीनिकल रिपोर्ट' : 'Clinician Report', desc: isHi ? 'एमओ समीक्षा के लिए ABDM अनुपालन DICOM / PDF ट्राइएज सारांश' : 'Generates ABDM compliant DICOM / PDF triage summary for MO review', detail: 'Triage Output • ABHA Ready' }
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
            <Award className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span>{t.heroTag || "Smart India Hackathon 2026 • Rural Health Tech"}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            {isHi ? (
              <>सुलभ ग्रामीण स्वास्थ्य सेवा के लिए <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-teal-300">एआई-संचालित रेटिना स्क्रीनिंग</span></>
            ) : (
              <>AI-Powered Retinal Screening for <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-teal-300">Accessible Rural Healthcare</span></>
            )}
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            {t.heroDesc || "Bridging the 1:100,000 specialist gap with edge-first deep learning, automated image quality filtering, and transparent Grad-CAM++ visual reasoning on low-cost fundus optical devices."}
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <button
              onClick={() => setActiveTab('screening')}
              className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-6 py-3.5 rounded-xl shadow-lg hover:shadow-sky-500/25 transition-all flex items-center space-x-2 text-sm"
            >
              <PlayCircle className="w-5 h-5 fill-slate-950 text-sky-400" />
              <span>{t.heroCtaStart || "Start Live Screening Demo"}</span>
            </button>
            <button
              onClick={() => setActiveTab('how-it-works')}
              className="bg-slate-800/90 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold px-6 py-3.5 rounded-xl transition-all text-sm flex items-center space-x-2"
            >
              <Layers className="w-4 h-4 text-sky-400" />
              <span>{isHi ? "कार्यप्रणाली एवं आर्किटेक्चर देखें" : "Explore Screening Pipeline & Architecture"}</span>
            </button>
          </div>

          {/* Key Stat Cards - Exactly as requested */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-slate-800/80">
            <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800/80">
              <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">{t.statAiScreening || "AI-POWERED SCREENING"}</p>
              <p className="text-lg sm:text-xl font-black text-white mt-1">Multi-Model <span className="text-xs font-semibold text-sky-400">Pipeline</span></p>
            </div>
            <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800/80">
              <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">{t.statExplainableAi || "EXPLAINABLE AI"}</p>
              <p className="text-lg sm:text-xl font-black text-emerald-400 mt-1">Grad-CAM++ <span className="text-xs font-semibold text-emerald-200">Insights</span></p>
            </div>
            <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800/80">
              <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">{t.statDeployment || "DEPLOYMENT"}</p>
              <p className="text-lg sm:text-xl font-black text-sky-300 mt-1">API-Based <span className="text-xs font-semibold text-sky-200">Inference</span></p>
            </div>
          </div>

        </div>

      </div>

      {/* Six-Stage Pipeline */}
      <div className="space-y-6">
        <div>
          <span className="text-xs font-extrabold tracking-widest text-sky-600 dark:text-sky-400 uppercase">Modular Tele-Health Pipeline</span>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">Six-Stage Clinical Screening Pipeline</h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Fully self-contained pipeline designed for zero-connectivity health centers, progressing from raw camera capture to an exportable ABDM-ready triage report.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {pipelineStages.map((stage) => (
            <div key={stage.num} className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="text-3xl font-extrabold text-slate-200 dark:text-slate-700 group-hover:text-sky-500 dark:group-hover:text-sky-400 transition-colors mb-2">
                {stage.num}
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1">{stage.title}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs leading-snug mb-3">{stage.desc}</p>
              <div className="text-[10px] font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-900/40 px-2 py-1 rounded inline-block">
                {stage.detail}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Referral Dilemma Comparison */}
      <div className="space-y-6">
        <div>
          <span className="text-xs font-extrabold tracking-widest text-teal-600 dark:text-teal-400 uppercase font-mono">The Triage Paradigm</span>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">Overcoming the Referral Dilemma in Rural Camps</h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Why opaque diagnostics collapse under real-world clinical scrutiny, and how Drishti Care's topographic contours give community medical officers confidence instantly.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Opaque Box */}
          <div className="bg-rose-50/70 dark:bg-rose-950/30 rounded-2xl p-6 border border-rose-200/80 dark:border-rose-800/50 space-y-4">
            <div className="flex justify-between items-center">
              <span className="bg-rose-100 dark:bg-rose-900/50 text-rose-800 dark:text-rose-300 text-xs font-bold px-2.5 py-1 rounded-full flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 dark:bg-rose-400"></span>
                <span>Conventional Opaque Screening</span>
              </span>
              <span className="text-xs text-rose-700 dark:text-rose-400 font-medium">Standard Non-Explanatory Method</span>
            </div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Opaque Probability Score</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Generates a raw percentage probability with zero visual grounding. Clinicians are forced into an "all-or-nothing" trust gamble, leading to high referral refusal rates.
            </p>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-800/50 text-center space-y-1">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Output Diagnosis:</p>
              <p className="text-2xl font-extrabold text-rose-600 dark:text-rose-400">92.4% DR Detected</p>
              <p className="text-[11px] text-slate-400">No indication whether caused by microaneurysms, hemorrhages, or optic disc artifacts.</p>
            </div>

            <ul className="text-xs text-rose-900 dark:text-rose-300 space-y-1.5 font-medium">
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
          <div className="bg-emerald-50/70 dark:bg-emerald-950/30 rounded-2xl p-6 border border-emerald-200/80 dark:border-emerald-800/50 space-y-4">
            <div className="flex justify-between items-center">
              <span className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-xs font-bold px-2.5 py-1 rounded-full flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400"></span>
                <span>Drishti Care Topographic Explainability</span>
              </span>
              <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">Visual Saliency Mapping</span>
            </div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Saliency-Guided Microvascular Attribution</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Isolates exactly why the system raised the severity flag by overlaying calibrated heatmap contours directly onto the fundus scan.
            </p>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800/50 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Visual Localization Map</span>
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/40 px-2 py-0.5 rounded">High Precision (0.94)</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">Screening attention concentrates heavily on temporal hemorrhages and foveal exudate circinates, confirming lesion significance.</p>
            </div>

            <ul className="text-xs text-emerald-900 dark:text-emerald-300 space-y-1.5 font-medium">
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>30-second visual audit by visiting doctor or telemedicine hub</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Pinpoints microaneurysms, hemorrhages, and exudates explicitly</span>
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* Features Grid for HWCs */}
      <div className="bg-slate-900 dark:bg-slate-800/50 text-white rounded-3xl p-8 sm:p-10 border border-slate-800 dark:border-slate-700 space-y-8">
        <div>
          <span className="text-xs font-extrabold tracking-widest text-sky-400 uppercase">Field Deployment Pillars</span>
          <h2 className="text-2xl font-bold text-white mt-1">Engineered for India's 150,000+ Ayushman Bharat Health & Wellness Centres</h2>
          <p className="text-slate-400 text-sm mt-1">Built from the ground up for environments with zero cellular signal, high ambient dust, erratic power supply, and operators with varying digital literacy.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-5 rounded-2xl bg-slate-800/80 dark:bg-slate-900/60 border border-slate-700/80 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center font-bold">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white">Zero Cloud Latency</h3>
            <p className="text-xs text-slate-400">100% Edge Local Inference. In-device model execution runs directly on base laptops/mobile devices without needing cellular signal.</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-800/80 dark:bg-slate-900/60 border border-slate-700/80 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white">DISHA & ABDM Compliant</h3>
            <p className="text-xs text-slate-400">Local Ephemeral Memory. No patient retina images saved on disk without encrypted ABHA consent tokens for inter-consultation.</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-800/80 dark:bg-slate-900/60 border border-slate-700/80 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white">Hardware Agnostic</h3>
            <p className="text-xs text-slate-400">Universal Optical Normalization. Evaluates fundus photography across ₹10,000 to ₹10,00,000 hospital fundus units.</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-800/80 dark:bg-slate-900/60 border border-slate-700/80 space-y-2">
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
