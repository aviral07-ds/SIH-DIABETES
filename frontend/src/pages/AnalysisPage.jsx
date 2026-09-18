import React, { useState } from 'react';
import { Eye, Activity, ShieldCheck, AlertCircle, ArrowRight, Layers, ZoomIn, FileText, CheckCircle } from 'lucide-react';

export default function AnalysisPage({ data, setActiveTab }) {
  const [activeChannel, setActiveChannel] = useState('both');
  const [zoomLevel, setZoomLevel] = useState(1);

  if (!data) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-6 gap-4">
        <div>
          <span className="text-xs font-bold text-sky-600 uppercase tracking-widest font-mono">LIVE DUAL-CHANNEL AI EXPLAINABILITY</span>
          <h1 className="text-3xl font-extrabold text-slate-900 mt-1">Dual-Channel Fundus Optical & Explainability Analysis</h1>
          <p className="text-xs text-slate-500 mt-0.5">Gradient-weighted class activation mapping (Grad-CAM++) + pixel-level multi-lesion segmentation</p>
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
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-[10px] font-bold text-sky-700 uppercase tracking-wider">CHANNEL 1</span>
              <h3 className="font-extrabold text-slate-900 text-base">Lesion Localization Channel</h3>
            </div>
            <span className="bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold px-2.5 py-1 rounded-full">
              34 Micro-Foci Marked
            </span>
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

            {/* Bounding Box Labels simulation matching Screenshot 1 */}
            <div className="absolute top-1/3 left-1/3 border-2 border-rose-500 bg-rose-500/20 text-white text-[9px] font-extrabold px-1 rounded shadow">
              MA: 0.94
            </div>
            <div className="absolute bottom-1/3 right-1/3 border-2 border-amber-400 bg-amber-400/20 text-white text-[9px] font-extrabold px-1 rounded shadow">
              EX: 0.88
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="font-semibold text-slate-900">High-magnification fundus view:</span> Demonstrates clustering of microaneurysms and hard exudates in superior and inferior-temporal perimacular quadrants.
          </p>
        </div>

        {/* Channel 2: Grad-CAM++ Neural Saliency Overlay */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider">CHANNEL 2</span>
              <h3 className="font-extrabold text-slate-900 text-base">Model Weight Distribution (Grad-CAM++)</h3>
            </div>
            <span className="bg-teal-50 text-teal-700 border border-teal-200 text-xs font-bold px-2.5 py-1 rounded-full">
              FAZ Distance: 1.2 mm
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

          <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="font-semibold text-slate-900">Network attention distribution:</span> Concentrates heavily on temporal hemorrhages and foveal exudative circinates, confirming lesion significance.
          </p>
        </div>

      </div>

      {/* Pathological Biomarker Breakdown Table vs Macular Risk */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Table Column (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-xs font-extrabold text-sky-600 uppercase tracking-widest">AUTOMATED SEGMENTATION v2.4</span>
              <h3 className="font-extrabold text-slate-900 text-lg">Pathological Biomarker Breakdown</h3>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-3">Biomarker Feature</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Clinical Specifics</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {data.biomarkers.map((b, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80">
                    <td className="py-3.5 px-3 font-bold text-slate-900">{b.feature}</td>
                    <td className="py-3.5 px-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                        b.status === 'Present' 
                          ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                          : b.status === 'Trace'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-slate-600 leading-snug">{b.specifics}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Macular Risk Assessment (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-xs font-extrabold text-teal-600 uppercase tracking-widest">RETINAL MACULA PROFILE</span>
              <h3 className="font-extrabold text-slate-900 text-lg">Macular Risk Assessment</h3>
            </div>
            <span className="bg-amber-100 text-amber-800 font-bold text-xs px-2.5 py-1 rounded-full border border-amber-200">
              {data.macularRisk.status}
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed bg-amber-50/60 p-3.5 rounded-2xl border border-amber-200">
            {data.macularRisk.description}
          </p>

          {/* Risk Gauge Bar */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-700">Macular Thickening Risk Index</span>
              <span className="text-lg font-extrabold text-amber-600">{data.macularRisk.indexScore} / {data.macularRisk.maxScore}</span>
            </div>

            <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden flex">
              <div className="bg-emerald-500 h-full w-[30%]"></div>
              <div className="bg-amber-500 h-full w-[30%]"></div>
              <div className="bg-rose-500 h-full w-[40%]"></div>
            </div>

            <div className="flex justify-between text-[10px] font-bold text-slate-500 pt-1">
              <span>Low Risk (0-30)</span>
              <span>Moderate (31-60)</span>
              <span className="text-rose-600">Actionable (+61)</span>
            </div>
          </div>

        </div>

      </div>

      {/* Clinical Decision Support & Next-Step Action Cards */}
      <div className="bg-sky-50/70 rounded-3xl p-6 border border-sky-200 space-y-4">
        <div className="flex items-center space-x-2 text-sky-900 font-extrabold text-base">
          <Activity className="w-5 h-5 text-sky-600" />
          <span>Clinical Decision Support & Next-Step Action</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-5 rounded-2xl border border-sky-200 shadow-sm space-y-2">
            <div className="flex items-center space-x-2 text-xs font-bold text-rose-700">
              <CheckCircle className="w-4 h-4" />
              <span>Recommended Specialist Referral</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">{data.recommendations.referral}</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-sky-200 shadow-sm space-y-2">
            <div className="flex items-center space-x-2 text-xs font-bold text-teal-700">
              <CheckCircle className="w-4 h-4" />
              <span>Systemic & Metabolic Management</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">{data.recommendations.metabolic}</p>
          </div>
        </div>
      </div>

    </div>
  );
}
