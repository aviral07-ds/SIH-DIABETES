import React from 'react';
import { AlertTriangle, CheckCircle, Clock, FileText, Printer, ArrowRight, Info, ShieldAlert, CheckSquare, UserPlus } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function ResultPage({ data, setActiveTab }) {
  const { t } = useLanguage();
  if (!data) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      
      {/* Step Indicator Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-6 gap-4">
        <div>
          <span className="text-xs font-bold text-sky-600 uppercase tracking-widest font-mono">{t.step3Tag}</span>
          <h1 className="text-3xl font-extrabold text-slate-900 mt-1">{t.screeningResultTitle}</h1>
          <p className="text-xs text-slate-500 mt-0.5">{t.screeningResultSub}</p>
        </div>

        <div className="bg-amber-50 border border-amber-200 px-4 py-2.5 rounded-2xl flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
          <div>
            <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">{t.triageLevelTag}</p>
            <p className="text-sm font-extrabold text-amber-900">{t.followUpRec}</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Observation vs Action Plan */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Automated Observation (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          <div className="bg-amber-50/50 rounded-3xl p-6 sm:p-8 border border-amber-200/80 shadow-sm space-y-6 relative overflow-hidden">
            
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <AlertTriangle className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">{t.automatedObsTag}</span>
                  <h2 className="text-3xl font-extrabold text-slate-900 leading-tight">{t.possibleSignsTitle}</h2>
                </div>
              </div>

              <span className="bg-amber-100 text-amber-900 font-extrabold text-xs px-3 py-1.5 rounded-full border border-amber-300">
                {data.metrics.drStageTitle.replace("Stage 2: ", "")}
              </span>
            </div>

            {/* Primary Classification Box */}
            <div className="bg-white/80 rounded-2xl p-5 border border-amber-200 space-y-3">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-500 uppercase tracking-wider">{t.primaryTriageTag}</span>
                <span className="text-sky-700">{t.aiConfidence}: {data.metrics.confidence}%</span>
              </div>
              
              <h3 className="text-xl font-extrabold text-slate-900">Diabetic Retinopathy: Moderate</h3>
              
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-amber-500 to-amber-600 h-full rounded-full" style={{ width: `${data.metrics.confidence}%` }}></div>
              </div>
            </div>

            {/* Info Box */}
            <div className="flex items-start space-x-3 text-xs text-slate-700">
              <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">{t.aiFoundSigns}</p>
            </div>

            {/* 4 Stat Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="bg-white p-3 rounded-xl border border-amber-200/80 text-xs">
                <p className="text-[10px] text-slate-400 font-medium">{t.eyeExaminedLabel}</p>
                <p className="font-bold text-slate-900 mt-0.5">{data.patient.eye}</p>
              </div>

              <div className="bg-white p-3 rounded-xl border border-amber-200/80 text-xs">
                <p className="text-[10px] text-slate-400 font-medium">{t.imageQualityLabel}</p>
                <p className="font-bold text-emerald-700 mt-0.5">Optimal ({data.metrics.imageQuality}%)</p>
              </div>

              <div className="bg-white p-3 rounded-xl border border-amber-200/80 text-xs">
                <p className="text-[10px] text-slate-400 font-medium">{t.screeningIdLabel}</p>
                <p className="font-mono font-bold text-slate-900 mt-0.5">#{data.screeningId}</p>
              </div>

              <div className="bg-white p-3 rounded-xl border border-amber-200/80 text-xs">
                <p className="text-[10px] text-slate-400 font-medium">{t.evalTimeLabel}</p>
                <p className="font-bold text-slate-900 mt-0.5">{data.metrics.inferenceTime}</p>
              </div>
            </div>

          </div>

          {/* View AI Analysis Accordion Box */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{t.whyResultQuestion}</h4>
                <p className="text-xs text-slate-500">{t.whyResultSub}</p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('results')}
              className="bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center space-x-1"
            >
              <span>{t.viewAiAnalysis}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

        {/* Right Column: Action Plan (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-teal-700 uppercase tracking-widest">{t.actionPlanTag}</span>
                <h3 className="font-extrabold text-slate-900 text-lg">{t.recommendedNextStep}</h3>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200 text-xs text-slate-800 leading-relaxed font-medium">
              {t.consultDoctorMsg}
            </div>

            {/* Timeframe Card */}
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start space-x-3 text-xs">
              <Clock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">{t.targetTimeframeTag}</p>
                <p className="font-bold text-amber-950 text-sm mt-0.5">{t.targetTimeframeMsg}</p>
              </div>
            </div>

            {/* Worker Checklist */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t.workerChecklistTag}</p>
              <div className="space-y-2 text-xs text-slate-700 font-medium">
                <label className="flex items-center space-x-2">
                  <CheckSquare className="w-4 h-4 text-emerald-600" />
                  <span>{t.chkReferral}</span>
                </label>
                <label className="flex items-center space-x-2">
                  <CheckSquare className="w-4 h-4 text-emerald-600" />
                  <span>{t.chkContact}</span>
                </label>
                <label className="flex items-center space-x-2">
                  <CheckSquare className="w-4 h-4 text-emerald-600" />
                  <span>{t.chkBloodSugar}</span>
                </label>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="space-y-3 pt-4 border-t border-slate-200">
              <button
                onClick={handlePrint}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-4 rounded-xl text-sm transition-all flex items-center justify-center space-x-2 shadow"
              >
                <Printer className="w-4 h-4" />
                <span>{t.btnPrintResult}</span>
              </button>

              <button
                onClick={() => setActiveTab('report')}
                className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3.5 px-4 rounded-xl text-sm transition-all flex items-center justify-center space-x-2 shadow"
              >
                <FileText className="w-4 h-4" />
                <span>{t.btnViewFullReport}</span>
              </button>

              <button
                onClick={() => setActiveTab('screening')}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl text-xs transition-all flex items-center justify-center space-x-2"
              >
                <UserPlus className="w-4 h-4 text-slate-500" />
                <span>{t.btnScreenAnother}</span>
              </button>
            </div>

          </div>

          {/* Bottom Disclaimer */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-start space-x-3">
            <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <p>{t.resultDisclaimer}</p>
          </div>

        </div>

      </div>

    </div>
  );
}
