import React, { useState } from 'react';
import { Upload, FileImage, User, Eye, Sparkles, AlertCircle, ArrowRight, Loader2, CheckCircle2, XCircle, ShieldAlert } from 'lucide-react';
import { analyzeRetinaImage } from '../services/apiService';
import { validateFundusImage } from '../services/imageValidator';
import { useLanguage } from '../context/LanguageContext';

export default function ScreeningPage({ onAnalysisComplete }) {
  const { lang, t } = useLanguage();
  const isHi = lang === 'hi';
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analysisPhase, setAnalysisPhase] = useState('');
  const [isCloudWaking, setIsCloudWaking] = useState(false);
  const [validationResult, setValidationResult] = useState(null); // null | { isValid, score, reasons }

  // Form State
  const [patient, setPatient] = useState({
    name: 'Rajesh Patil (Pseudonymized)',
    abhaId: '91-8274-1029-4412',
    age: 54,
    gender: 'Male',
    eye: 'OD [Right Eye]',
    history: 'T2DM (8 Yrs) + Hypertension | HbA1c 8.2%',
    facility: 'PHC Shirwal, Satara District'
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Pre-loaded real clinical sample fundus images for instant demo
  const sampleFundusImages = [
    { 
      id: 'sample_dr_hemorrhage', 
      label: isHi ? 'नमूना 1: डायबिटिक रेटिनोपैथी (रक्तस्राव/ब्लोट)' : 'Sample 1: Diabetic Retinopathy (Hemorrhages)', 
      desc: isHi ? 'गंभीर रेटिनल हेमोरेज और माइक्रोएन्यूरिज्म' : 'Severe blot hemorrhages & microaneurysms',
      badge: 'ICDR Stage 3',
      badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
      url: '/samples/sample_dr_hemorrhage.jpg',
      fileName: 'sample_dr_hemorrhage.jpg'
    },
    { 
      id: 'sample_normal_retina', 
      label: isHi ? 'नमूना 2: सामान्य स्वस्थ रेटिना' : 'Sample 2: Normal Healthy Retina', 
      desc: isHi ? 'स्पष्ट ऑप्टिक डिस्क व स्वस्थ वाहिकाएं' : 'Clear fundus, intact macula & optic disc',
      badge: 'ICDR Stage 0',
      badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
      url: '/samples/sample_normal_retina.jpg',
      fileName: 'sample_normal_retina.jpg'
    }
  ];

  const applyFile = async (file, skipValidation = false) => {
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setValidationResult(null);

    if (!skipValidation) {
      setValidating(true);
      try {
        const result = await validateFundusImage(file);
        setValidationResult(result);
      } catch (err) {
        console.warn('Validation error', err);
        setValidationResult({ isValid: false, score: 0, reasons: ['Could not validate image. Please try a different file.'] });
      } finally {
        setValidating(false);
      }
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) applyFile(file);
  };

  const handleSelectSample = async (sample) => {
    try {
      const response = await fetch(sample.url);
      const blob = await response.blob();
      const file = new File([blob], sample.fileName, { type: 'image/jpeg' });
      applyFile(file, true);
      setValidationResult({ isValid: true, score: 98, reasons: [] });
    } catch (err) {
      console.error('Error loading sample image:', err);
    }
  };

  const handleRunAnalysis = async () => {
    if (!selectedFile) return;
    if (validationResult && !validationResult.isValid) return;

    setLoading(true);
    setProgress(12);
    setIsCloudWaking(false);
    setAnalysisPhase(t.executingAi || 'Optical Preprocessing & Contrast Enhancement...');

    const startTime = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      
      // If requests take > 3.5 seconds (likely Render free tier spinning up), alert user
      if (elapsed > 3500) {
        setIsCloudWaking(true);
      }

      setProgress((prev) => {
        if (prev < 30) {
          setAnalysisPhase('Preprocessing fundus optics & CLAHE normalization...');
          return prev + 6;
        } else if (prev < 60) {
          setAnalysisPhase('Querying PyTorch U-Net for microvascular lesions (IDRiD)...');
          return prev + 4;
        } else if (prev < 80) {
          setAnalysisPhase('Executing APTOS deep convolutional DR classification...');
          return prev + 3;
        } else if (prev < 95) {
          setAnalysisPhase('Synthesizing Grad-CAM++ saliency & clinical triage index...');
          return prev + 1;
        }
        // Slowly advance through 95% -> 98% so it never freezes
        return Math.min(prev + (Math.random() > 0.6 ? 1 : 0), 98);
      });
    }, 280);

    try {
      const results = await analyzeRetinaImage(selectedFile, patient);
      clearInterval(interval);
      setProgress(100);
      setAnalysisPhase('Triage analysis complete! Preparing clinical report...');
      setTimeout(() => {
        setLoading(false);
        onAnalysisComplete(results);
      }, 350);
    } catch (e) {
      console.error(e);
      setLoading(false);
      clearInterval(interval);
    }
  };

  const isReadyToRun = selectedFile && !loading && !validating && validationResult?.isValid;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      
      {/* Header & Step Indicator */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-widest font-mono">
              {step === 1 ? t.step1Tag : t.step2Tag}
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{t.workflowTitle}</h1>
          </div>
          <div className="flex items-center space-x-2 text-xs font-semibold">
            <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step === 1 ? 'bg-sky-600 text-white' : 'bg-emerald-600 text-white'}`}>1</span>
            <span className="text-slate-400">---</span>
            <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step === 2 ? 'bg-sky-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>2</span>
          </div>
        </div>
      </div>

      {/* Step 1: Patient Information */}
      {step === 1 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center space-x-3 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white text-base">{t.demographicsTitle}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t.demographicsDesc}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">{t.patientName}</label>
              <input 
                type="text" 
                value={patient.name}
                onChange={(e) => setPatient({...patient, name: e.target.value})}
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">{t.abhaId}</label>
              <input 
                type="text" 
                value={patient.abhaId}
                onChange={(e) => setPatient({...patient, abhaId: e.target.value})}
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">{t.ageGender}</label>
              <div className="grid grid-cols-2 gap-3">
                <input 
                  type="number" 
                  value={patient.age}
                  onChange={(e) => setPatient({...patient, age: e.target.value})}
                  className="p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                />
                <select 
                  value={patient.gender}
                  onChange={(e) => setPatient({...patient, gender: e.target.value})}
                  className="p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                >
                  <option value="Male">{t.male}</option>
                  <option value="Female">{t.female}</option>
                  <option value="Other">{t.other}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">{t.examinedEye}</label>
              <select 
                value={patient.eye}
                onChange={(e) => setPatient({...patient, eye: e.target.value})}
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
              >
                <option value="OD [Right Eye]">{t.rightEye}</option>
                <option value="OS [Left Eye]">{t.leftEye}</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">{t.clinicalHistory}</label>
              <input 
                type="text" 
                value={patient.history}
                onChange={(e) => setPatient({...patient, history: e.target.value})}
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">{t.facilityLocation}</label>
              <input 
                type="text" 
                value={patient.facility}
                placeholder="e.g. PHC Shirwal, Satara District or Pune, Maharashtra"
                onChange={(e) => setPatient({...patient, facility: e.target.value})}
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setStep(2)}
              className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-6 py-3 rounded-xl transition-all flex items-center space-x-2 text-sm shadow"
            >
              <span>{t.nextUpload}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Image Upload & Live AI Analysis */}
      {step === 2 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                <FileImage className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 dark:text-white text-base">{t.fundusInputTitle}</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">{t.fundusInputDesc}</p>
              </div>
            </div>
            <button
              onClick={() => setStep(1)}
              className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-semibold"
            >
              {t.editDetails}
            </button>
          </div>

          {/* Upload Dropzone */}
          <div className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer relative group ${
            validationResult?.isValid === true ? 'border-emerald-400 dark:border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/20 hover:border-emerald-500' :
            validationResult?.isValid === false ? 'border-rose-400 dark:border-rose-600 bg-rose-50/40 dark:bg-rose-950/20' :
            'border-slate-300 dark:border-slate-700 hover:border-sky-500 bg-slate-50 dark:bg-slate-800/40 hover:bg-sky-50/40 dark:hover:bg-slate-800'
          }`}>
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/tiff,image/tif,image/bmp"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
            />

            {previewUrl ? (
              <div className="space-y-4">
                <div className="relative inline-block">
                  <img src={previewUrl} alt="Fundus preview" className={`w-48 h-48 mx-auto object-cover rounded-2xl shadow-md border-2 ${
                    validationResult?.isValid === true ? 'border-emerald-400' :
                    validationResult?.isValid === false ? 'border-rose-400' :
                    'border-sky-500'
                  }`} />
                  {validationResult?.isValid === true && (
                    <span className="absolute -top-2 -right-2 bg-emerald-500 text-white rounded-full p-1 shadow">
                      <CheckCircle2 className="w-4 h-4" />
                    </span>
                  )}
                  {validationResult?.isValid === false && (
                    <span className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 shadow">
                      <XCircle className="w-4 h-4" />
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white text-sm">{selectedFile?.name}</p>
                  {validating ? (
                    <p className="text-xs text-sky-600 dark:text-sky-400 font-semibold flex items-center justify-center space-x-1 mt-1">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{t.validatingImage}</span>
                    </p>
                  ) : validationResult?.isValid === true ? (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center justify-center space-x-1 mt-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{t.validationPassed} — Score: {validationResult.score}/100</span>
                    </p>
                  ) : validationResult?.isValid === false ? (
                    <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold flex items-center justify-center space-x-1 mt-1">
                      <XCircle className="w-4 h-4" />
                      <span>{t.validationFailed} — Score: {validationResult.score}/100</span>
                    </p>
                  ) : (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center justify-center space-x-1 mt-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{t.imageLoaded}</span>
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                  <Upload className="w-8 h-8" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white text-base">{t.dragDropText}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t.dragDropSub}</p>
                </div>
              </div>
            )}
          </div>

          {/* Validation Failure Error Card */}
          {validationResult && !validationResult.isValid && (
            <div className="rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 p-5 space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-extrabold text-rose-800 dark:text-rose-300 text-sm">{t.invalidImageTitle}</p>
                  <p className="text-xs text-rose-700 dark:text-rose-400 mt-1 leading-relaxed">{t.invalidImageDesc}</p>
                </div>
              </div>

              {/* Reason list */}
              {validationResult.reasons.length > 0 && (
                <ul className="space-y-1 pl-2">
                  {validationResult.reasons.map((reason, i) => (
                    <li key={i} className="flex items-start space-x-2 text-xs text-rose-700 dark:text-rose-300">
                      <span className="text-rose-500 font-bold mt-0.5">✕</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              )}

              {/* Hint box */}
              <div className="bg-white dark:bg-slate-800 border border-rose-100 dark:border-rose-900/40 rounded-xl p-3 flex items-start space-x-2 text-xs text-slate-600 dark:text-slate-300">
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>{t.invalidImageHint}</span>
              </div>

              {/* Try again prompt */}
              <p className="text-xs text-center text-slate-500 dark:text-slate-400 font-medium">
                {t.tryAgain} — <span className="text-sky-600 dark:text-sky-400 font-semibold">Click above or pick a sample scan below</span>
              </p>
            </div>
          )}

          {/* Validation Success Badge */}
          {validationResult?.isValid && (
            <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/30 p-4 flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-emerald-800 dark:text-emerald-300 text-sm">{t.validationPassed}</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">Fundus image quality verified. AI analysis is ready to run.</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-xs text-emerald-500 dark:text-emerald-400 font-semibold">{t.validationScore}</p>
                <p className="font-extrabold text-emerald-700 dark:text-emerald-300 text-lg">{validationResult.score}<span className="text-xs">/100</span></p>
              </div>
            </div>
          )}

          {/* Sample Fundus Quick Picker */}
          <div className="space-y-3 pt-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t.samplePickerTitle}</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sampleFundusImages.map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => handleSelectSample(sample)}
                  className="flex items-center space-x-3.5 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-sky-500 bg-slate-50 dark:bg-slate-800/80 hover:bg-sky-50/80 dark:hover:bg-slate-700/80 text-left transition-all group shadow-sm hover:shadow"
                >
                  <img 
                    src={sample.url} 
                    alt={sample.label} 
                    className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-300 dark:border-slate-600 group-hover:scale-105 transition-transform"
                  />
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center space-x-2">
                      <p className="font-bold text-xs text-slate-900 dark:text-white truncate">{sample.label}</p>
                      <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full shrink-0 ${sample.badgeColor}`}>
                        {sample.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">{sample.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Loading Progress Bar */}
          {loading && (
            <div className="space-y-3 p-5 bg-sky-50 dark:bg-sky-950/40 rounded-2xl border border-sky-200 dark:border-sky-800 shadow-sm transition-all duration-300">
              <div className="flex justify-between items-center text-xs font-bold text-sky-900 dark:text-sky-200">
                <span className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin text-sky-600 dark:text-sky-400" />
                  <span className="font-semibold">{analysisPhase || t.executingAi}</span>
                </span>
                <span className="font-mono text-sm">{progress}%</span>
              </div>
              <div className="w-full bg-sky-200 dark:bg-sky-900 h-2.5 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-sky-500 to-sky-600 h-full transition-all duration-300 ease-out" style={{ width: `${progress}%` }}></div>
              </div>
              {isCloudWaking && (
                <div className="flex items-center space-x-2 text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 p-2.5 rounded-xl border border-amber-200 dark:border-amber-800 animate-in fade-in duration-300">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>Cloud microservices warming up from sleep (Render free-tier cold start) — finalizing model inference...</span>
                </div>
              )}
            </div>
          )}

          {/* Validating Spinner */}
          {validating && (
            <div className="flex items-center space-x-3 p-4 bg-sky-50 dark:bg-sky-950/40 rounded-2xl border border-sky-200 dark:border-sky-800 text-xs font-semibold text-sky-800 dark:text-sky-300">
              <Loader2 className="w-5 h-5 animate-spin text-sky-600 dark:text-sky-400 shrink-0" />
              <span>{t.validatingImage} — Running retinal image quality checks...</span>
            </div>
          )}

          {/* Submit Action CTA */}
          <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={handleRunAnalysis}
              disabled={!isReadyToRun}
              className={`font-bold px-8 py-4 rounded-xl text-white transition-all flex items-center space-x-2 text-sm shadow-lg ${
                isReadyToRun
                  ? 'bg-sky-600 hover:bg-sky-700 hover:shadow-sky-500/25'
                  : 'bg-slate-300 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed'
              }`}
            >
              <Sparkles className="w-5 h-5" />
              <span>{loading ? t.analyzingImage : t.runAiTriage}</span>
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
