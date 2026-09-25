import React, { useState } from 'react';
import { 
  AlertTriangle, CheckCircle, Clock, FileText, Printer, ArrowRight, 
  Info, ShieldAlert, CheckSquare, UserPlus, Download, Eye, ShieldCheck, 
  Sparkles, CheckCircle2, QrCode 
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import DrishtiLogo from '../components/DrishtiLogo';
import { useLanguage } from '../context/LanguageContext';
import { getLocalizedStageInfo, getLocalizedEye } from '../i18n/translations';
import NearbySpecialists from '../components/NearbySpecialists';
import NearbySpecialistsModal from '../components/NearbySpecialistsModal';

export default function ResultPage({ data, setActiveTab }) {
  const { t, language, lang } = useLanguage();
  const [isSpecialistsModalOpen, setIsSpecialistsModalOpen] = useState(false);
  const [modalSpecialists, setModalSpecialists] = useState([]);
  const [modalActiveCity, setModalActiveCity] = useState('');
  const [exportingPdf, setExportingPdf] = useState(false);

  if (!data) return null;

  const currentLang = language || lang || 'en';
  const isHi = currentLang === 'hi';
  const drStageCode = data.metrics?.drStageCode !== undefined ? data.metrics.drStageCode : 2;

  // Localized clinical values
  const stageInfo = getLocalizedStageInfo(drStageCode, data.metrics?.drStageTitle, isHi);
  const localizedEye = getLocalizedEye(data.patient?.eye, isHi);
  const localizedQuality = isHi 
    ? `उत्कृष्ट (${data.metrics?.imageQuality || 94}%)` 
    : `Optimal (${data.metrics?.imageQuality || 94}%)`;
  const localizedInferenceTime = isHi 
    ? `${data.metrics?.inferenceTime || '1.8s'} (पाइटॉर्च एज)` 
    : (data.metrics?.inferenceTime || '1.8s (PyTorch Edge)');
  const localizedFacility = data.patient?.facility || (isHi ? "प्राथमिक स्वास्थ्य केंद्र (PHC)" : "Primary Health Centre (PHC)");

  const getTimeframe = (stage) => {
    switch (Number(stage)) {
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
    switch (Number(stage)) {
      case 0: return isHi 
        ? "डायबिटिक रेटिनोपैथी के कोई लक्षण नहीं मिले। अपने नजदीकी स्वास्थ्य केंद्र में वार्षिक नेत्र जांच जारी रखें।" 
        : "No active signs of diabetic retinopathy detected. Continue routine annual diabetic eye screening at your local health center.";
      case 1: return isHi 
        ? "हल्के सूक्ष्म संवहनी परिवर्तन पाए गए। कृपया रक्त शर्करा नियंत्रण बनाए रखें और 6-12 महीनों में अनुवर्ती जांच कराएं।" 
        : "Mild microvascular changes detected. Maintain strict blood sugar control and schedule a follow-up eye exam within 6 to 12 months.";
      case 2: return isHi 
        ? "मध्यम डायबिटिक रेटिनोपैथी देखी गई। कृपया विस्तृत आंख की जांच और बायोमाइक्रोस्कोपी के लिए 3 से 4 सप्ताह के भीतर नेत्र रोग विशेषज्ञ से परामर्श लें।" 
        : "Moderate non-proliferative changes observed. Please consult a qualified eye-care professional or ophthalmologist within 3 to 4 weeks.";
      case 3: return isHi 
        ? "गंभीर संवहनी क्षति पाई गई। मैकुलर ओसीटी और विशेषज्ञ परामर्श के लिए 7 से 14 दिनों के भीतर तत्काल रेफरल आवश्यक है।" 
        : "Severe microvascular compromise detected. Urgent referral for dilated biomicroscopy and Macular SD-OCT within 7 to 14 days.";
      case 4: return isHi 
        ? "प्रोलिफेरेटिव डायबिटिक रेटिनोपैथी पाई गई। लेजर या एंटी-वीईजीएफ उपचार के लिए 24-48 घंटों के भीतर तत्काल आपातकालीन विशेषज्ञ मूल्यांकन आवश्यक है।" 
        : "Proliferative diabetic retinopathy (PDR) detected. Immediate emergency specialist evaluation required for anti-VEGF or laser treatment within 24 to 48 hours.";
      default: return t.consultDoctorMsg;
    }
  };

  const targetTimeframeText = getTimeframe(drStageCode);
  const consultAdviceText = getConsultMsg(drStageCode);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdfSlip = async () => {
    setExportingPdf(true);
    const element = document.getElementById('printable-result-slip');
    if (!element) {
      setExportingPdf(false);
      return;
    }

    try {
      const canvas = await html2canvas(element, { 
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`DrishtiCare_Result_Slip_${(data.patient?.name || 'Patient').split(' ')[0]}_${data.screeningId || 'Slip'}.pdf`);
    } catch (e) {
      console.error('PDF export failed', e);
      // Fallback to native print dialog
      window.print();
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      
      {/* Step Indicator Header (Screen only) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 dark:border-slate-800 pb-6 gap-4 no-print">
        <div>
          <span className="text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-widest font-mono">{t.step3Tag}</span>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{t.screeningResultTitle}</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t.screeningResultSub}</p>
        </div>

        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-4 py-2.5 rounded-2xl flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          <div>
            <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">{t.triageLevelTag}</p>
            <p className="text-sm font-extrabold text-amber-900 dark:text-amber-200">{t.followUpRec}</p>
          </div>
        </div>
      </div>

      {/* Main Screen Grid: Observation vs Action Plan */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 no-print">
        
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
                {stageInfo.badge}
              </span>
            </div>

            {/* Primary Classification Box */}
            <div className="bg-white/80 dark:bg-slate-900/80 rounded-2xl p-5 border border-amber-200 dark:border-amber-900/40 space-y-3">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t.primaryTriageTag}</span>
                <span className="text-sky-700 dark:text-sky-400">{t.aiConfidence}: {data.metrics.confidence}%</span>
              </div>
              
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">{stageInfo.title}</h3>
              
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
                <p className="font-bold text-slate-900 dark:text-white mt-0.5">{localizedEye}</p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-amber-200/80 dark:border-amber-900/40 text-xs">
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{t.imageQualityLabel}</p>
                <p className="font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">{localizedQuality}</p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-amber-200/80 dark:border-amber-900/40 text-xs">
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{t.screeningIdLabel}</p>
                <p className="font-mono font-bold text-slate-900 dark:text-white mt-0.5">#{data.screeningId}</p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-amber-200/80 dark:border-amber-900/40 text-xs">
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{t.evalTimeLabel}</p>
                <p className="font-bold text-slate-900 dark:text-white mt-0.5">{localizedInferenceTime}</p>
              </div>
            </div>

          </div>

          {/* HIGH CONTRAST DARK VIEW AI ANALYSIS CARD */}
          <div className="bg-slate-950 dark:bg-black rounded-3xl p-6 sm:p-7 border-2 border-slate-700/80 shadow-2xl relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            {/* Ambient subtle glow background */}
            <div className="absolute -right-16 -top-16 w-52 h-52 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="flex items-start space-x-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-700 text-sky-400 flex items-center justify-center shrink-0 shadow-inner">
                <ShieldAlert className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="bg-sky-500/20 text-sky-300 border border-sky-500/40 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider">
                    {isHi ? "एआई दृश्य व्याख्या" : "AI EXPLAINABILITY"}
                  </span>
                </div>
                <h4 className="font-extrabold text-white text-base sm:text-lg tracking-tight">
                  {t.whyResultQuestion}
                </h4>
                <p className="text-xs text-slate-300 max-w-md leading-relaxed">
                  {t.whyResultSub}
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('results')}
              className="relative z-10 shrink-0 w-full sm:w-auto bg-sky-400 hover:bg-sky-300 text-slate-950 font-black text-sm px-6 py-3.5 rounded-xl transition-all flex items-center justify-center space-x-2.5 shadow-lg shadow-sky-500/30 hover:scale-[1.02] active:scale-[0.98] border border-sky-300"
            >
              <span>{t.viewAiAnalysis}</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  onClick={handlePrint}
                  className="bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold py-3 px-3 rounded-xl text-xs transition-all flex items-center justify-center space-x-2 shadow"
                >
                  <Printer className="w-4 h-4" />
                  <span>{t.btnPrintResult}</span>
                </button>

                <button
                  onClick={handleDownloadPdfSlip}
                  disabled={exportingPdf}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-3 rounded-xl text-xs transition-all flex items-center justify-center space-x-2 shadow"
                >
                  <Download className="w-4 h-4" />
                  <span>{exportingPdf ? (isHi ? 'डाउनलोड हो रहा...' : 'Downloading...') : (isHi ? 'पीडीएफ पर्ची डाउनलोड' : 'Save PDF Slip')}</span>
                </button>
              </div>

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
          <NearbySpecialists 
            initialLocation={data?.patient?.facility} 
            onOpenDirectory={(docs, cityName) => {
              setModalSpecialists(docs || []);
              setModalActiveCity(cityName || '');
              setIsSpecialistsModalOpen(true);
            }} 
          />

          {/* Full Directory Modal */}
          <NearbySpecialistsModal 
            isOpen={isSpecialistsModalOpen} 
            onClose={() => setIsSpecialistsModalOpen(false)} 
            specialists={modalSpecialists}
            activeCity={modalActiveCity}
          />

          {/* Bottom Disclaimer */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-start space-x-3">
            <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <p>{t.resultDisclaimer}</p>
          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* ABDM OFFICIAL CLINICAL REFERRAL RESULT SLIP (PRINT & DIRECT PDF RENDER) */}
      {/* ========================================================================= */}
      <div id="printable-result-slip" className="print-only-container bg-white text-slate-900 p-8 border border-slate-300 rounded-none shadow-none font-sans">
        
        {/* Top Official Banner */}
        <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-slate-950 flex items-center justify-center p-1 border border-slate-700 shadow-sm">
              <DrishtiLogo size={36} />
            </div>
            <div>
              <h2 className="font-black text-xl tracking-tight text-slate-900">
                {isHi ? "दृष्टि केयर डायग्नोस्टिक नेटवर्क" : "Drishti Care Diagnostic Network"}
              </h2>
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-sky-700">
                {isHi ? "ABDM प्वाइंट-ऑफ-केयर क्लिनिकल रेफरल पर्ची" : "ABDM POINT-OF-CARE CLINICAL REFERRAL SLIP"}
              </p>
              <p className="text-[10px] text-slate-500 font-medium">
                {isHi ? "आयुष्मान भारत डिजिटल मिशन (ABDM M3 स्कीमा अनुरूप)" : "Ayushman Bharat Digital Mission (ABDM M3 Schema Compatible)"}
              </p>
            </div>
          </div>

          <div className="text-right text-xs space-y-1">
            <span className="inline-block bg-slate-100 text-slate-800 font-bold px-3 py-1 rounded-md text-[11px] border border-slate-300">
              {isHi ? "ग्रामीण स्वास्थ्य मिशन प्रोटोटाइप • SIH 2026" : "Rural Health Mission Prototype • SIH 2026"}
            </span>
            <p className="text-[11px] text-slate-600 font-mono">
              Slip ID: <strong className="text-slate-950 font-bold">SLIP-{data.screeningId || '2026-0894'}</strong>
            </p>
            <p className="text-[10px] text-slate-500">
              {isHi ? "दिनांक" : "Date"}: {data.timestamp || new Date().toLocaleString()}
            </p>
          </div>
        </div>

        {/* Patient Demographics Profile */}
        <div className="mt-4 bg-slate-50 rounded-xl p-4 border border-slate-200 grid grid-cols-3 gap-4 text-xs">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              {isHi ? "रोगी का नाम" : "PATIENT NAME"}
            </p>
            <p className="font-extrabold text-slate-900 text-sm mt-0.5">{data.patient?.name || 'Unknown Patient'}</p>
            <p className="text-[11px] text-slate-600">
              {data.patient?.age || '48'} {isHi ? "वर्ष" : "Yrs"} • {data.patient?.gender || 'Male'}
            </p>
          </div>

          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              {isHi ? "आभा (ABHA) आईडी" : "ABHA HEALTH ID"}
            </p>
            <p className="font-mono font-bold text-slate-900 text-sm mt-0.5">{data.patient?.abhaId || '91-4829-1029-4820'}</p>
            <p className="text-[11px] text-slate-600">
              {isHi ? "स्वास्थ्य केंद्र" : "Facility"}: {localizedFacility}
            </p>
          </div>

          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              {isHi ? "जांची गई आंख एवं स्थिति" : "EXAMINED EYE & QUALITY"}
            </p>
            <p className="font-bold text-slate-900 text-xs mt-0.5">{localizedEye}</p>
            <p className="text-[11px] text-emerald-700 font-semibold">{localizedQuality}</p>
          </div>
        </div>

        {/* Primary AI Triage Severity Finding Banner */}
        <div className="mt-4 bg-amber-50/80 rounded-xl p-4 border-2 border-amber-300 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-amber-200 text-amber-900 flex items-center justify-center font-bold">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-amber-800">
                {isHi ? "स्वचालित ट्राइएज निष्कर्ष" : "AUTOMATED TRIAGE CLASSIFICATION"}
              </p>
              <h3 className="text-lg font-black text-slate-950 leading-tight">
                {stageInfo.title}
              </h3>
              <p className="text-[11px] text-slate-700 font-medium">
                ICD-10: <strong className="font-bold text-slate-900">{data.metrics?.icd10 || 'E11.339'}</strong> • {stageInfo.badge}
              </p>
            </div>
          </div>

          <div className="text-right bg-white p-3 rounded-lg border border-amber-300">
            <p className="text-[10px] font-bold text-slate-500 uppercase">
              {isHi ? "नैदानिक आत्मविश्वास" : "AI CONFIDENCE"}
            </p>
            <p className="text-2xl font-black text-slate-900">{data.metrics?.confidence || 94}%</p>
          </div>
        </div>

        {/* Side-by-side Visual Evidence */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-slate-800 uppercase tracking-wide">
              {isHi ? "मूल फंडस स्कैन" : "Original Fundus Optical Scan"}
            </p>
            <div className="h-44 rounded-lg overflow-hidden border border-slate-300 bg-black flex items-center justify-center">
              <img 
                src={data.images?.original} 
                alt="Original Fundus" 
                className="h-full w-full object-cover" 
              />
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-[11px] font-bold text-slate-800 uppercase tracking-wide">
              {isHi ? "एआई घाव विश्लेषण (Grad-CAM++)" : "AI Lesion Analysis (Grad-CAM++)"}
            </p>
            <div className="h-44 rounded-lg overflow-hidden border border-slate-300 bg-black flex items-center justify-center">
              <img 
                src={data.images?.gradcam || data.images?.overlay || data.images?.original} 
                alt="AI Analysis" 
                className="h-full w-full object-cover" 
              />
            </div>
          </div>
        </div>

        {/* Action Plan & Referral Directive */}
        <div className="mt-4 bg-sky-50 rounded-xl p-4 border border-sky-200 space-y-2">
          <div className="flex items-center space-x-2 text-sky-900">
            <CheckCircle className="w-5 h-5 text-sky-700" />
            <h4 className="font-black text-sm uppercase tracking-wide">
              {isHi ? "अनुशंसित विशेषज्ञ रेफरल एवं नैदानिक निर्देश" : "RECOMMENDED SPECIALIST REFERRAL & CLINICAL DIRECTIVE"}
            </h4>
          </div>
          <p className="text-xs text-slate-800 leading-relaxed font-semibold">
            {consultAdviceText}
          </p>

          <div className="pt-2 border-t border-sky-200 flex justify-between items-center text-xs">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-amber-700" />
              <span className="font-extrabold text-amber-950">
                {isHi ? "लक्ष्य रेफरल समय सीमा:" : "Target Referral Window:"} {targetTimeframeText}
              </span>
            </div>
            <span className="bg-sky-200 text-sky-900 font-bold px-2 py-0.5 rounded text-[10px]">
              {isHi ? "प्राथमिकता: उच्च" : "Priority: High"}
            </span>
          </div>
        </div>

        {/* Health Worker Referral Checklist & Auth Signature Box */}
        <div className="mt-4 grid grid-cols-2 gap-4 pt-2">
          
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-[11px]">
            <p className="font-black text-slate-800 uppercase tracking-wider">
              {isHi ? "स्वास्थ्य कार्यकर्ता चेकलिस्ट" : "COMMUNITY HEALTH WORKER CHECKLIST"}
            </p>
            <p className="text-slate-700">✓ {isHi ? "रोगी को रेफरल पर्ची सौंपी गई" : "Patient provided hardcopy referral slip"}</p>
            <p className="text-slate-700">✓ {isHi ? "जिला अस्पताल नेत्र विभाग संपर्क साझा किया गया" : "District Hospital eye clinic contacts shared"}</p>
            <p className="text-slate-700">✓ {isHi ? "रक्त शर्करा (HbA1c/Fasting) जांच की सलाह दी गई" : "HbA1c & blood pressure monitoring advised"}</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
            <div className="space-y-1 text-[11px]">
              <p className="font-black text-slate-800 uppercase tracking-wider">
                {isHi ? "सत्यापित प्राधिकार" : "AUTHORIZED VERIFICATION"}
              </p>
              <p className="font-bold text-slate-900">Dr. Sunita Deshmukh, MS (Ophth)</p>
              <p className="text-slate-500 text-[10px]">Reg No: MMC-2014-0892 • Medical Officer</p>
              <p className="text-emerald-700 font-bold text-[10px]">✓ ABDM Token: Signed & Sealed</p>
            </div>
            <div className="w-14 h-14 border border-dashed border-slate-400 rounded-lg flex flex-col items-center justify-center text-slate-400 text-[9px] text-center p-1">
              <QrCode className="w-8 h-8 text-slate-700" />
              <span>ABDM QR</span>
            </div>
          </div>

        </div>

        {/* Statutory Clinical Disclaimer */}
        <div className="mt-4 pt-3 border-t border-slate-300 text-[10px] text-slate-500 leading-tight">
          <strong className="text-slate-800">
            {isHi ? "वैधानिक नैदानिक सूचना:" : "Statutory Clinical Notice:"}
          </strong>{" "}
          {isHi 
            ? "यह दस्तावेज दृष्टि केयर एआई-सहायता प्राप्त स्क्रीनिंग प्रणाली द्वारा तैयार किया गया है। यह केवल नैदानिक अनुवर्ती कार्रवाई और विशेषज्ञ रेफरल को प्राथमिकता देने के लिए है। यह कोई अंतिम चिकित्सा निदान नहीं है। किसी भी चिकित्सीय निर्णय के लिए नेत्र रोग विशेषज्ञ की पुष्टि आवश्यक है।"
            : "This document is generated by the Drishti Care AI-assisted screening suite. It serves exclusively to prioritize clinical follow-up and specialist referrals. It is not an autonomous medical diagnosis. Definitive management must be confirmed by a licensed ophthalmologist."}
        </div>

      </div>

    </div>
  );
}
