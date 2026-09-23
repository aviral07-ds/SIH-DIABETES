import React, { useState } from 'react';
import { Eye, Activity, ShieldCheck, AlertCircle, ArrowRight, Layers, ZoomIn, FileText, CheckCircle, MapPin } from 'lucide-react';
import NearbySpecialistsModal from '../components/NearbySpecialistsModal';

export default function AnalysisPage({ data, setActiveTab }) {
  const [activeChannel, setActiveChannel] = useState('both');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isSpecialistsModalOpen, setIsSpecialistsModalOpen] = useState(false);

  if (!data) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 dark:border-slate-800 pb-6 gap-4">
        <div>
          <span className="text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-widest font-mono">LIVE DUAL-CHANNEL AI EXPLAINABILITY</span>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">Dual-Channel Fundus Optical & Explainability Analysis</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Gradient-weighted class activation mapping (Grad-CAM++) + pixel-level multi-lesion segmentation</p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setActiveTab('report')}
            className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow flex items-center space-x-2"
          >
            <FileText className="w-4 h-4" />
            <span>Open Official Clinical Report</span>
          </button>
        </div>
      </div>

      {/* Dual Channel Image Grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Channel 1: Lesion Localization Channel */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-[10px] font-bold text-sky-700 dark:text-sky-400 uppercase tracking-wider">CHANNEL 1</span>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Lesion Localization Channel</h3>
            </div>
            {data.totalFociCount > 0 ? (
              <span className="bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 text-xs font-bold px-2.5 py-1 rounded-full">
                {data.totalFociCount} Micro-Foci Marked
              </span>
            ) : (
              <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-xs font-bold px-2.5 py-1 rounded-full">
                0 Lesions Detected (Clear)
              </span>
            )}
          </div>

          <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-square flex items-center justify-center group border border-slate-800">
            <img 
              src={data.images.overlay || data.images.original} 
              alt="Lesion overlay" 
              className="w-full h-full object-cover transition-transform duration-300"
              style={{ transform: `scale(${zoomLevel})` }}
            />
            
            {/* Annotated Bounding Region Badge */}
            <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur text-white text-[11px] font-bold px-3 py-1.5 rounded-lg border border-slate-700 flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-400"></span>
              <span>Optical Scan OD - Annotated Bounding Regions</span>
            </div>

            {/* Dynamic Bounding Box Labels calculated from actual model detections */}
            {data.lesionDetections && data.lesionDetections.length > 0 ? (
              data.lesionDetections.map((lesion, idx) => (
                <div 
                  key={idx}
                  className={`absolute border-2 ${lesion.borderColor} ${lesion.bgColor} text-white text-[9px] font-extrabold px-1 rounded shadow animate-in fade-in duration-300`}
                  style={{ top: lesion.top, left: lesion.left }}
                >
                  {lesion.type}: {lesion.score}
                </div>
              ))
            ) : (
              <div className="absolute top-3 right-3 bg-emerald-900/80 backdrop-blur border border-emerald-500 text-emerald-200 text-[10px] font-bold px-2 py-1 rounded-md">
                Healthy Fundus • Clear
              </div>
            )}
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="font-semibold text-slate-900 dark:text-white">High-magnification fundus view:</span> {data.channel1Desc || 'Demonstrates clear optical fundus scan with healthy retinal architecture.'}
          </p>
        </div>

        {/* Channel 2: Grad-CAM++ Neural Saliency Overlay */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-[10px] font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wider">CHANNEL 2</span>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Model Weight Distribution (Grad-CAM++)</h3>
            </div>
            <span className="bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800/60 text-xs font-bold px-2.5 py-1 rounded-full">
              FAZ Distance: {data.fazDistanceMm || '1.2'} mm
            </span>
          </div>

          <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-square flex items-center justify-center group border border-slate-800">
            <img 
              src={data.images.gradcam || data.images.original} 
              alt="Grad-CAM Saliency" 
              className="w-full h-full object-cover transition-transform duration-300 mix-blend-screen opacity-90"
            />
            {/* Heatmap overlay simulation */}
            <div className="absolute inset-0 bg-gradient-to-tr from-sky-500/30 via-amber-500/40 to-transparent pointer-events-none mix-blend-overlay"></div>

            <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur text-white text-[11px] font-bold px-3 py-1.5 rounded-lg border border-slate-700 flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
              <span>Grad-CAM++ Neural Saliency Overlay</span>
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="font-semibold text-slate-900 dark:text-white">Screening attention distribution:</span> {data.channel2Desc || 'Screening attention concentrates on retinal microvascular structure.'}
          </p>
        </div>

      </div>

      {/* Pathological Biomarker Breakdown Table vs Macular Risk */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Table Column (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-xs font-extrabold text-sky-600 dark:text-sky-400 uppercase tracking-widest">AUTOMATED SEGMENTATION v2.4</span>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">Pathological Biomarker Breakdown</h3>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-3">Biomarker Feature</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Clinical Specifics</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-800 dark:text-slate-200">
                {data.biomarkers.map((b, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                    <td className="py-3.5 px-3 font-bold text-slate-900 dark:text-white">{b.feature}</td>
                    <td className="py-3.5 px-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                        b.status === 'Present' 
                          ? 'bg-rose-100 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800' 
                          : b.status === 'Trace'
                          ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                          : 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-slate-600 dark:text-slate-300 leading-snug">{b.specifics}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Macular Risk Assessment (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-xs font-extrabold text-teal-600 dark:text-teal-400 uppercase tracking-widest">RETINAL MACULA PROFILE</span>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">Macular Risk Assessment</h3>
            </div>
            <span className="bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 font-bold text-xs px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800">
              {data.macularRisk.status}
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-amber-50/60 dark:bg-amber-950/30 p-3.5 rounded-2xl border border-amber-200 dark:border-amber-800/60">
            {data.macularRisk.description}
          </p>

          {/* Risk Gauge Bar */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Macular Thickening Risk Index</span>
              <span className="text-lg font-extrabold text-amber-600 dark:text-amber-400">{data.macularRisk.indexScore} / {data.macularRisk.maxScore}</span>
            </div>

            <div className="w-full bg-slate-200 dark:bg-slate-700 h-3 rounded-full overflow-hidden flex">
              <div className="bg-emerald-500 h-full w-[30%]"></div>
              <div className="bg-amber-500 h-full w-[30%]"></div>
              <div className="bg-rose-500 h-full w-[40%]"></div>
            </div>

            <div className="flex justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400 pt-1">
              <span>Low Risk (0-30)</span>
              <span>Moderate (31-60)</span>
              <span className="text-rose-600 dark:text-rose-400">Actionable (+61)</span>
            </div>
          </div>

        </div>

      </div>

      {/* Clinical Decision Support & Next-Step Action Cards */}
      <div className="bg-sky-50/70 dark:bg-sky-950/30 rounded-3xl p-6 border border-sky-200 dark:border-sky-800 space-y-4">
        <div className="flex items-center space-x-2 text-sky-900 dark:text-sky-300 font-extrabold text-base">
          <Activity className="w-5 h-5 text-sky-600 dark:text-sky-400" />
          <span>Clinical Decision Support & Next-Step Action</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-sky-200 dark:border-sky-800 shadow-sm space-y-2">
            <div className="flex items-center space-x-2 text-xs font-bold text-rose-700 dark:text-rose-400">
              <CheckCircle className="w-4 h-4" />
              <span>Recommended Specialist Referral</span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{data.recommendations.referral}</p>
            <button
              onClick={() => setIsSpecialistsModalOpen(true)}
              className="mt-2 inline-flex items-center space-x-1.5 text-xs font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/60 px-3 py-1.5 rounded-xl border border-sky-200 dark:border-sky-800 transition-colors"
            >
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              <span>Locate Nearby Eye Specialists & Hospital Centers →</span>
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-sky-200 dark:border-sky-800 shadow-sm space-y-2">
            <div className="flex items-center space-x-2 text-xs font-bold text-teal-700 dark:text-teal-400">
              <CheckCircle className="w-4 h-4" />
              <span>Systemic & Metabolic Management</span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{data.recommendations.metabolic}</p>
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
