import React, { useState } from 'react';
import { Upload, FileImage, User, Eye, Sparkles, AlertCircle, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { analyzeRetinaImage } from '../services/apiService';
import { useLanguage } from '../context/LanguageContext';

export default function ScreeningPage({ onAnalysisComplete }) {
  const { t } = useLanguage();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

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

  // Pre-loaded sample fundus images for instant demo
  const sampleFundusImages = [
    { id: 'sample1', label: 'Sample 1: Moderate NPDR (IDRiD_01)', desc: 'Microaneurysms + Hemorrhages' },
    { id: 'sample2', label: 'Sample 2: Severe Exudate Cluster', desc: 'Hard Exudates Circinate' },
    { id: 'sample3', label: 'Sample 3: Normal Healthy Retina', desc: 'Clear Fundus' }
  ];

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSelectSample = async (sample) => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 512, 512);
    ctx.beginPath();
    ctx.arc(256, 256, 230, 0, 2 * Math.PI);
    ctx.fillStyle = '#C85010';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(360, 230, 40, 0, 2 * Math.PI);
    ctx.fillStyle = '#FFE090';
    ctx.fill();

    ctx.strokeStyle = '#600505';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(360, 230);
    ctx.quadraticCurveTo(280, 200, 180, 140);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(360, 230);
    ctx.quadraticCurveTo(280, 300, 180, 380);
    ctx.stroke();

    ctx.fillStyle = '#880000';
    ctx.beginPath(); ctx.arc(210, 240, 6, 0, 2 * Math.PI); ctx.fill();
    ctx.beginPath(); ctx.arc(230, 290, 8, 0, 2 * Math.PI); ctx.fill();

    ctx.fillStyle = '#FFFF00';
    ctx.beginPath(); ctx.arc(240, 200, 7, 0, 2 * Math.PI); ctx.fill();
    ctx.beginPath(); ctx.arc(260, 210, 5, 0, 2 * Math.PI); ctx.fill();

    canvas.toBlob((blob) => {
      const file = new File([blob], `${sample.id}.jpg`, { type: 'image/jpeg' });
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }, 'image/jpeg');
  };

  const handleRunAnalysis = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setProgress(15);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 15;
      });
    }, 250);

    try {
      const results = await analyzeRetinaImage(selectedFile, patient);
      setProgress(100);
      clearInterval(interval);

      // Transition to results cleanly without confetti
      setTimeout(() => {
        setLoading(false);
        onAnalysisComplete(results);
      }, 300);

    } catch (e) {
      console.error(e);
      setLoading(false);
      clearInterval(interval);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      
      {/* Header & Step Indicator */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-xs font-bold text-sky-600 uppercase tracking-widest font-mono">
              {step === 1 ? t.step1Tag : t.step2Tag}
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-1">{t.workflowTitle}</h1>
          </div>
          <div className="flex items-center space-x-2 text-xs font-semibold">
            <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step === 1 ? 'bg-sky-600 text-white' : 'bg-emerald-600 text-white'}`}>1</span>
            <span className="text-slate-400">---</span>
            <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step === 2 ? 'bg-sky-600 text-white' : 'bg-slate-200 text-slate-600'}`}>2</span>
          </div>
        </div>
      </div>

      {/* Step 1: Patient Information */}
      {step === 1 && (
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center space-x-3 pb-4 border-b border-slate-200">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-base">{t.demographicsTitle}</h2>
              <p className="text-xs text-slate-500">{t.demographicsDesc}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">{t.patientName}</label>
              <input 
                type="text" 
                value={patient.name}
                onChange={(e) => setPatient({...patient, name: e.target.value})}
                className="w-full p-3 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">{t.abhaId}</label>
              <input 
                type="text" 
                value={patient.abhaId}
                onChange={(e) => setPatient({...patient, abhaId: e.target.value})}
                className="w-full p-3 rounded-xl border border-slate-300 font-mono font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">{t.ageGender}</label>
              <div className="grid grid-cols-2 gap-3">
                <input 
                  type="number" 
                  value={patient.age}
                  onChange={(e) => setPatient({...patient, age: e.target.value})}
                  className="p-3 rounded-xl border border-slate-300 font-medium"
                />
                <select 
                  value={patient.gender}
                  onChange={(e) => setPatient({...patient, gender: e.target.value})}
                  className="p-3 rounded-xl border border-slate-300 font-medium"
                >
                  <option value="Male">{t.male}</option>
                  <option value="Female">{t.female}</option>
                  <option value="Other">{t.other}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">{t.examinedEye}</label>
              <select 
                value={patient.eye}
                onChange={(e) => setPatient({...patient, eye: e.target.value})}
                className="w-full p-3 rounded-xl border border-slate-300 font-medium"
              >
                <option value="OD [Right Eye]">{t.rightEye}</option>
                <option value="OS [Left Eye]">{t.leftEye}</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">{t.clinicalHistory}</label>
              <input 
                type="text" 
                value={patient.history}
                onChange={(e) => setPatient({...patient, history: e.target.value})}
                className="w-full p-3 rounded-xl border border-slate-300 font-medium"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-200">
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
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-slate-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <FileImage className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-base">{t.fundusInputTitle}</h2>
                <p className="text-xs text-slate-500">{t.fundusInputDesc}</p>
              </div>
            </div>
            <button
              onClick={() => setStep(1)}
              className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
            >
              {t.editDetails}
            </button>
          </div>

          {/* Upload Dropzone */}
          <div className="border-2 border-dashed border-slate-300 hover:border-sky-500 rounded-2xl p-8 text-center bg-slate-50 hover:bg-sky-50/40 transition-all cursor-pointer relative group">
            <input 
              type="file" 
              accept="image/*"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
            />
            
            {previewUrl ? (
              <div className="space-y-4">
                <img src={previewUrl} alt="Fundus preview" className="w-48 h-48 mx-auto object-cover rounded-2xl shadow-md border-2 border-sky-500" />
                <div>
                  <p className="font-bold text-slate-900 text-sm">{selectedFile?.name}</p>
                  <p className="text-xs text-emerald-600 font-semibold flex items-center justify-center space-x-1 mt-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{t.imageLoaded}</span>
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                  <Upload className="w-8 h-8" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-base">{t.dragDropText}</p>
                  <p className="text-xs text-slate-500 mt-1">{t.dragDropSub}</p>
                </div>
              </div>
            )}
          </div>

          {/* Sample Fundus Quick Picker */}
          <div className="space-y-3 pt-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">{t.samplePickerTitle}</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {sampleFundusImages.map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => handleSelectSample(sample)}
                  className="p-3 rounded-xl border border-slate-200 hover:border-sky-500 bg-slate-50 hover:bg-sky-50 text-left transition-all text-xs space-y-1"
                >
                  <p className="font-bold text-slate-900">{sample.label}</p>
                  <p className="text-[11px] text-slate-500">{sample.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Loading Progress Bar */}
          {loading && (
            <div className="space-y-3 p-4 bg-sky-50 rounded-2xl border border-sky-200 animate-pulse">
              <div className="flex justify-between items-center text-xs font-bold text-sky-900">
                <span className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
                  <span>{t.executingAi}</span>
                </span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-sky-200 h-2 rounded-full overflow-hidden">
                <div className="bg-sky-600 h-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
          )}

          {/* Submit Action CTA */}
          <div className="flex justify-end pt-4 border-t border-slate-200">
            <button
              onClick={handleRunAnalysis}
              disabled={!selectedFile || loading}
              className={`font-bold px-8 py-4 rounded-xl text-white transition-all flex items-center space-x-2 text-sm shadow-lg ${
                selectedFile && !loading
                  ? 'bg-sky-600 hover:bg-sky-700 hover:shadow-sky-500/25'
                  : 'bg-slate-300 cursor-not-allowed'
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
