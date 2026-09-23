import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, Clock, FileText, Printer, ArrowRight, Info, ShieldAlert, CheckSquare, UserPlus, MapPin, Phone, Navigation, Building2, ExternalLink } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import NearbySpecialists from '../components/NearbySpecialists';
import NearbySpecialistsModal from '../components/NearbySpecialistsModal';

export default function ResultPage({ data, setActiveTab }) {
  const { t, language } = useLanguage();
  const [isSpecialistsModalOpen, setIsSpecialistsModalOpen] = useState(false);
  if (!data) return null;

  const handlePrint = () => {
    window.print();
  };

  const drStageCode = data.metrics?.drStageCode !== undefined ? data.metrics.drStageCode : 2;
  const isHi = language === 'hi';

  const getTimeframe = (stage) => {
    switch (stage) {
      case 0: return isHi ? "नियमित वार्षिक जांच (12 महीने के भीतर)" : "Routine Annual Checkup (Within 12 Months)";
      case 1: return isHi ? "अनुवर्ती जांच (6 से 12 महीने के भीतर)" : "Follow-Up Visit (Within 6 to 12 Months)";
      case 2: return isHi ? "अनुशंसित परामर्श (3 से 4 सप्ताह के भीतर)" : "Recommended Visit (Within 3 to 4 Weeks)";
      case 3: return isHi ? "तत्काल विशेषज्ञ रेफरल (7 से 14 दिनों के भीतर)" : "Urgent Specialist Referral (Within 7 to 14 Days)";
      case 4: return isHi ? "तत्काल आपातकालीन रेफरल (24 से 48 घंटे के भीतर)" : "Immediate Emergency Referral (Within 24 to 48 Hours)";
      default: return isHi ? "3 से 4 सप्ताह के भीतर अनुशंसित परामर्श" : "Recommended Visit (Within 3 to 4 Weeks)";
    }
  };

  const getConsultMsg = (stage) => {
    if (data.recommendations?.referral && !isHi) return data.recommendations.referral;
    switch (stage) {
      case 0: return isHi ? "डायबिटिक रेटिनोपैथी के कोई लक्षण नहीं मिले। अपने नजदीकी स्वास्थ्य केंद्र में वार्षिक नेत्र जांच जारी रखें।" : "No active signs of diabetic retinopathy detected. Continue routine annual diabetic eye screening at your local health center.";
      case 1: return isHi ? "हल्के सूक्ष्म संवहनी परिवर्तन पाए गए। कृपया रक्त शर्करा नियंत्रण बनाए रखें और 6-12 महीनों में अनुवर्ती जांच कराएं।" : "Mild microvascular changes detected. Maintain strict blood sugar control and schedule a follow-up eye exam within 6 to 12 months.";
      case 2: return isHi ? "मध्यम डायबिटिक रेटिनोपैथी देखी गई। कृपया विस्तृत आंख की जांच और बायोमाइक्रोस्कोपी के लिए 3 से 4 सप्ताह के भीतर नेत्र रोग विशेषज्ञ से परामर्श लें।" : "Moderate non-proliferative changes observed. Please consult a qualified eye-care professional or ophthalmologist within 3 to 4 weeks.";
      case 3: return isHi ? "गंभीर संवहनी क्षति पाई गई। मैकुलर ओसीटी और विशेषज्ञ परामर्श के लिए 7 से 14 दिनों के भीतर तत्काल रेफरल आवश्यक है।" : "Severe microvascular compromise detected. Urgent referral for dilated biomicroscopy and Macular SD-OCT within 7 to 14 days.";
      case 4: return isHi ? "प्रोलिफेरेटिव डायबिटिक रेटिनोपैथी पाई गई। लेजर या एंटी-वीईजीएफ उपचार के लिए 24-48 घंटों के भीतर तत्काल आपातकालीन विशेषज्ञ मूल्यांकन आवश्यक है।" : "Proliferative diabetic retinopathy (PDR) detected. Immediate emergency specialist evaluation required for anti-VEGF or laser treatment within 24 to 48 hours.";
      default: return t.consultDoctorMsg;
    }
  };

  const targetTimeframeText = getTimeframe(drStageCode);
  const consultAdviceText = getConsultMsg(drStageCode);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      
      {/* Step Indicator Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 dark:border-slate-800 pb-6 gap-4">
        <div>
          <span className="text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-widest font-mono">{t.step3Tag}</span>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{t.screeningResultTitle}</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t.screeningResultSub}</p>
        </div>

        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-4 py-2.5 rounded-2xl flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
          <div>
            <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">{t.triageLevelTag}</p>
            <p className="text-sm font-extrabold text-amber-900 dark:text-amber-200">{t.followUpRec}</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Observation vs Action Plan */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Automated Observation (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          <div className="bg-amber-50/50 dark:bg-amber-950/20 rounded-3xl p-6 sm:p-8 border border-amber-200/80 dark:border-amber-900/40 shadow-sm space-y-6 relative overflow-hidden">
            
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 flex items-center justify-center font-bold">
                  <AlertTriangle className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider">{t.automatedObsTag}</span>
                  <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
                    {drStageCode === 0 ? (isHi ? "स्वस्थ रेटिना — सामान्य फंडस" : "Healthy Retina — Clear Fundus") : t.possibleSignsTitle}
                  </h2>
                </div>
              </div>

              <span className="bg-amber-100 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200 font-extrabold text-xs px-3 py-1.5 rounded-full border border-amber-300 dark:border-amber-700">
                {data.metrics.icdrStage || data.metrics.drStageTitle}
              </span>
            </div>

            {/* Primary Classification Box */}
            <div className="bg-white/80 dark:bg-slate-900/80 rounded-2xl p-5 border border-amber-200 dark:border-amber-900/40 space-y-3">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t.primaryTriageTag}</span>
                <span className="text-sky-700 dark:text-sky-400">{t.aiConfidence}: {data.metrics.confidence}%</span>
              </div>
              
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">{data.metrics.drStageTitle}</h3>
              
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-amber-500 to-amber-600 h-full rounded-full" style={{ width: `${data.metrics.confidence}%` }}></div>
              </div>
            </div>

            {/* Info Box */}
            <div className="flex items-start space-x-3 text-xs text-slate-700 dark:text-slate-300">
              <Info className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">{t.aiFoundSigns}</p>
            </div>

            {/* 4 Stat Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-amber-200/80 dark:border-amber-900/40 text-xs">
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{t.eyeExaminedLabel}</p>
                <p className="font-bold text-slate-900 dark:text-white mt-0.5">{data.patient.eye}</p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-amber-200/80 dark:border-amber-900/40 text-xs">
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{t.imageQualityLabel}</p>
                <p className="font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">Optimal ({data.metrics.imageQuality}%)</p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-amber-200/80 dark:border-amber-900/40 text-xs">
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{t.screeningIdLabel}</p>
                <p className="font-mono font-bold text-slate-900 dark:text-white mt-0.5">#{data.screeningId}</p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-amber-200/80 dark:border-amber-900/40 text-xs">
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{t.evalTimeLabel}</p>
                <p className="font-bold text-slate-900 dark:text-white mt-0.5">{data.metrics.inferenceTime}</p>
              </div>
            </div>

          </div>

          {/* View AI Analysis Accordion Box */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">{t.whyResultQuestion}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">{t.whyResultSub}</p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('results')}
              className="bg-sky-50 dark:bg-sky-900/40 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-300 font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center space-x-1"
            >
              <span>{t.viewAiAnalysis}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

        {/* Right Column: Action Plan (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-teal-700 dark:text-teal-400 uppercase tracking-widest">{t.actionPlanTag}</span>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">{t.recommendedNextStep}</h3>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
              {consultAdviceText}
            </div>

            {/* Timeframe Card */}
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-start space-x-3 text-xs">
              <Clock className="w-5 h-5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider">{t.targetTimeframeTag}</p>
                <p className="font-bold text-amber-950 dark:text-amber-200 text-sm mt-0.5">{targetTimeframeText}</p>
              </div>
            </div>

            {/* Worker Checklist */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t.workerChecklistTag}</p>
              <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300 font-medium">
                <label className="flex items-center space-x-2">
                  <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>{t.chkReferral}</span>
                </label>
                <label className="flex items-center space-x-2">
                  <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>{t.chkContact}</span>
                </label>
                <label className="flex items-center space-x-2">
                  <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>{t.chkBloodSugar}</span>
                </label>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={handlePrint}
                className="w-full bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold py-3.5 px-4 rounded-xl text-sm transition-all flex items-center justify-center space-x-2 shadow"
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
                className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-3 px-4 rounded-xl text-xs transition-all flex items-center justify-center space-x-2"
              >
                <UserPlus className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <span>{t.btnScreenAnother}</span>
              </button>
            </div>

          </div>

          {/* Nearby Eye Specialists Finder */}
          <NearbySpecialists onOpenDirectory={() => setIsSpecialistsModalOpen(true)} />

          {/* Full Directory Modal */}
          <NearbySpecialistsModal 
            isOpen={isSpecialistsModalOpen} 
            onClose={() => setIsSpecialistsModalOpen(false)} 
          />

          {/* Bottom Disclaimer */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-start space-x-3">
            <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <p>{t.resultDisclaimer}</p>
          </div>

        </div>

      </div>

      {/* Nearby Specialists Interactive Directory Modal */}
      <NearbySpecialistsModal 
        isOpen={isSpecialistsModalOpen}
        onClose={() => setIsSpecialistsModalOpen(false)}
        selectedDistrict={data?.patient?.facility?.includes('Satara') ? 'Satara' : 'All'}
      />

    </div>
  );
}
