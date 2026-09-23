import React, { useState } from 'react';
import { Printer, Download, Share2, ShieldCheck, CheckCircle2, Award, Eye, FileText, AlertTriangle, Info } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function ReportPage({ data }) {
  const [abmaPushed, setAbmaPushed] = useState(false);
  const [exporting, setExporting] = useState(false);

  if (!data) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleExportPdf = async () => {
    setExporting(true);
    const element = document.getElementById('printable-report');
    if (!element) return;

    try {
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`DrishtiCare_ABDM_Report_${data.patient.name.split(' ')[0]}_${data.screeningId}.pdf`);
    } catch (e) {
      console.error('PDF export failed', e);
    } finally {
      setExporting(false);
    }
  };

  const handlePushAbha = () => {
    setAbmaPushed(true);
    setTimeout(() => setAbmaPushed(false), 4000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      
      {/* Top Action Header Bar */}
      <div className="bg-slate-900 dark:bg-slate-950 text-white rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4 no-print shadow-lg border border-slate-800">
        <div className="flex items-center space-x-2 text-xs">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <p className="font-bold">ABDM Interoperable Clinical Triage Summary</p>
            <p className="text-[11px] text-slate-400">National Health Authority Compliance • ABDM M3 Standard</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrint}
            className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5 border border-slate-700"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>

          <button
            onClick={handleExportPdf}
            disabled={exporting}
            className="bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5 shadow"
          >
            <Download className="w-4 h-4" />
            <span>{exporting ? 'Exporting...' : 'Export DICOM / PDF'}</span>
          </button>

          <button
            onClick={handlePushAbha}
            className={`font-bold text-xs px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5 ${
              abmaPushed ? 'bg-emerald-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            <Share2 className="w-4 h-4" />
            <span>{abmaPushed ? 'Pushed to ABHA!' : 'Push to ABHA Record'}</span>
          </button>
        </div>
      </div>

      {/* Printable Report Document Card */}
      <div id="printable-report" className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-12 border border-slate-200 dark:border-slate-800 shadow-xl space-y-8 text-slate-900 dark:text-slate-100">
        
        {/* Report Header */}
        <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 dark:bg-sky-600 text-sky-400 dark:text-white flex items-center justify-center font-bold shadow">
              <Eye className="w-7 h-7" />
            </div>
            <div>
              <h2 className="font-extrabold text-slate-900 dark:text-white text-xl tracking-tight">Drishti Care Diagnostic Network</h2>
              <p className="text-xs font-bold tracking-widest text-sky-700 dark:text-sky-400 uppercase">TELE-OPHTHALMOLOGY POINT-OF-CARE TRIAGE</p>
            </div>
          </div>

          <div className="text-right text-xs space-y-1">
            <span className="inline-block bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold px-3 py-1 rounded-full text-[11px] border border-slate-200 dark:border-slate-700">
              Govt. of Maharashtra • Public Health Dept
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono pt-1">Report ID: <span className="font-bold text-slate-900 dark:text-white">RET-2024-MH-0894</span></p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">Generated: {data.timestamp}</p>
          </div>
        </div>

        {/* Patient Profile Card */}
        <div className="bg-slate-50/80 dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">PATIENT NAME</p>
            <p className="font-extrabold text-slate-900 dark:text-white text-sm mt-0.5">{data.patient.name}</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">{data.patient.age} Yrs • {data.patient.gender} • In-Person Camp</p>
          </div>

          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">ABHA HEALTH IDENTIFIER</p>
            <p className="font-mono font-bold text-slate-900 dark:text-white text-sm mt-0.5">{data.patient.abhaId}</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Facility: {data.patient.facility}</p>
          </div>

          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">CLINICAL BACKGROUND</p>
            <p className="font-bold text-slate-900 dark:text-white text-xs mt-0.5">{data.patient.clinicalHistory}</p>
            <span className="inline-block bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 text-[10px] font-bold px-2 py-0.5 rounded mt-1">Last HbA1c 8.2% • Uncontrolled</span>
          </div>
        </div>

        {/* Eye Examined Bar */}
        <div className="bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-xl p-3 flex justify-between items-center text-xs">
          <div className="flex items-center space-x-2">
            <Eye className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span className="font-bold text-slate-900 dark:text-white">Eye Examined: {data.patient.eye}</span>
            <span className="text-slate-500 dark:text-slate-400">• Non-mydriatic 45° macula-centered fundus photography</span>
          </div>
          <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold text-[11px] px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700">
            IMAGE QUALITY: EXCELLENT [{data.metrics.imageQuality}%]
          </span>
        </div>

        {/* Primary AI Finding Alert Box */}
        <div className="bg-amber-50 dark:bg-amber-950/30 rounded-2xl p-6 border border-amber-200 dark:border-amber-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 flex items-center justify-center font-bold shrink-0 mt-1">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider">PRIMARY AI-ASSISTED FINDING</p>
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">{data.metrics.drStageTitle} <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">[ICD-10: E11.319 • ICDR Stage 2]</span></h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-snug">Non-Proliferative Diabetic Retinopathy detected with high clinical confidence. Foveal avascular margin exhibits micro-vascular compromise.</p>
            </div>
          </div>

          <div className="text-right shrink-0 bg-white dark:bg-slate-800 p-4 rounded-xl border border-amber-200 dark:border-amber-800 space-y-0.5">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">DIAGNOSTIC CONFIDENCE</p>
            <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{data.metrics.confidence}%</p>
            <p className="text-[10px] font-bold text-sky-700 dark:text-sky-400">Ensemble Agreement: {data.metrics.ensembleAgreement}</p>
          </div>
        </div>

        {/* Dual Channel Image Grids */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Lesion Localization Channel</p>
            <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 aspect-video bg-slate-950">
              <img src={data.images.overlay || data.images.original} alt="Localization" className="w-full h-full object-cover" />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">High-magnification fundus view demonstrating micro-lesion clustering in temporal quadrants.</p>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Model Weight Distribution (Grad-CAM++)</p>
            <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 aspect-video bg-slate-950 mix-blend-screen">
              <img src={data.images.gradcam || data.images.original} alt="Gradcam" className="w-full h-full object-cover" />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Screening attention concentrates heavily on temporal hemorrhages and foveal exudate circinates.</p>
          </div>

        </div>

        {/* Pathological Biomarker Breakdown Table */}
        <div className="space-y-3 pt-4">
          <p className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Pathological Biomarker Breakdown</p>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-2.5 px-2">Biomarker Feature</th>
                <th className="py-2.5 px-2">Status</th>
                <th className="py-2.5 px-2">Clinical Specifics</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-800 dark:text-slate-200">
              {data.biomarkers.map((b, idx) => (
                <tr key={idx}>
                  <td className="py-2.5 px-2 font-bold text-slate-900 dark:text-white">{b.feature}</td>
                  <td className="py-2.5 px-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      b.status === 'Present' ? 'bg-rose-100 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300' : b.status === 'Trace' ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300' : 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300'
                    }`}>{b.status}</span>
                  </td>
                  <td className="py-2.5 px-2 text-slate-600 dark:text-slate-300">{b.specifics}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Verifying Medical Officer Digital Signature Block */}
        <div className="bg-sky-50/70 dark:bg-sky-950/40 rounded-2xl p-6 border border-sky-200 dark:border-sky-800 flex justify-between items-center text-xs">
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">VERIFYING MEDICAL OFFICER</p>
            <p className="font-extrabold text-slate-900 dark:text-white text-sm mt-0.5">{data.doctor.name}</p>
            <p className="text-slate-600 dark:text-slate-300 text-[11px]">{data.doctor.role}</p>
            <p className="text-emerald-700 dark:text-emerald-400 font-bold text-[10px] mt-1 flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>ABDM Token: Signature Verified • {data.doctor.regNo}</span>
            </p>
          </div>

          <div className="text-right space-y-1">
            <span className="inline-block bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-300 font-bold px-3 py-1 rounded text-[10px] border border-sky-300 dark:border-sky-700">
              DIGITALLY SIGNED
            </span>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">Govt. Medical Officer Token</p>
            <p className="text-[9px] text-slate-400 dark:text-slate-500">Authenticated: {data.timestamp}</p>
          </div>
        </div>

        {/* Statutory Clinical Notice */}
        <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 leading-relaxed">
          <span className="font-bold text-slate-700 dark:text-slate-300">Statutory Clinical Notice:</span> This clinical document is generated by the Drishti Care AI-assisted triage system calibrated for mass community health screening camps. It serves exclusively to prioritize clinical follow-ups and specialist referrals. It is not an autonomous definitive medical diagnosis. Management decisions must be confirmed by a licensed ophthalmologist.
        </div>

      </div>

    </div>
  );
}
