import React, { useState } from 'react';
import { X, MapPin, Phone, Clock, ExternalLink, Navigation, Building2, ShieldCheck, Search, Crosshair } from 'lucide-react';
import { NEARBY_HOSPITALS, getLiveMapsSearchUrl } from '../services/nearbyHospitals';
import { useLanguage } from '../context/LanguageContext';

export default function NearbySpecialistsModal({ isOpen, onClose, selectedDistrict = 'All' }) {
  const { language } = useLanguage();
  const isHi = language === 'hi';
  const [filterDistrict, setFilterDistrict] = useState(selectedDistrict);
  const [searchQuery, setSearchQuery] = useState('');
  const [locating, setLocating] = useState(false);

  if (!isOpen) return null;

  const districts = ['All', 'Satara', 'Pune', 'Mumbai', 'PMJAY Free'];

  const filteredHospitals = NEARBY_HOSPITALS.filter((hosp) => {
    // District / category filter
    if (filterDistrict === 'PMJAY Free' && !hosp.isPMJAY) return false;
    if (filterDistrict !== 'All' && filterDistrict !== 'PMJAY Free' && hosp.district !== filterDistrict) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        hosp.name.toLowerCase().includes(q) ||
        hosp.doctor.toLowerCase().includes(q) ||
        hosp.address.toLowerCase().includes(q) ||
        hosp.district.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleOpenLiveMaps = () => {
    setLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocating(false);
          const url = getLiveMapsSearchUrl({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude
          });
          window.open(url, '_blank', 'noopener,noreferrer');
        },
        () => {
          setLocating(false);
          window.open(getLiveMapsSearchUrl(), '_blank', 'noopener,noreferrer');
        },
        { timeout: 5000 }
      );
    } else {
      setLocating(false);
      window.open(getLiveMapsSearchUrl(), '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-3xl w-full border border-slate-200 dark:border-slate-800 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-sky-900 via-slate-900 to-teal-900 text-white p-5 sm:p-6 flex justify-between items-start border-b border-slate-800 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[11px] font-bold text-sky-300 uppercase tracking-widest">
                {isHi ? 'प्रमाणित नेत्र रेफरल नेटवर्क' : 'Accredited Retinal Referral Network'}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold flex items-center space-x-2">
              <MapPin className="w-6 h-6 text-sky-400 shrink-0" />
              <span>{isHi ? 'निकटतम नेत्र विशेषज्ञ और अस्पताल केंद्र' : 'Nearby Eye Specialists & Hospital Centers'}</span>
            </h2>
            <p className="text-xs text-slate-300">
              {isHi 
                ? 'सरकारी जिला अस्पताल, मेडिकल कॉलेज और आयुष्मान भारत (PMJAY) सूचीबद्ध केंद्र'
                : 'Government District Hospitals, Medical Colleges & Ayushman Bharat (PMJAY) Empanelled Centers'}
            </p>
          </div>

          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search, Location Button & Filters Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 space-y-3 shrink-0 bg-slate-50/60 dark:bg-slate-900/60">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={isHi ? 'अस्पताल, डॉक्टर या शहर का नाम खोजें...' : 'Search hospital, doctor, or city name...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <button
              onClick={handleOpenLiveMaps}
              disabled={locating}
              className="bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow transition-all flex items-center justify-center space-x-2 shrink-0"
              title="Detect live GPS coordinates and open nearest eye specialists in Google Maps"
            >
              <Crosshair className={`w-4 h-4 ${locating ? 'animate-spin' : ''}`} />
              <span>{locating ? (isHi ? 'खोज रहे हैं...' : 'Locating...') : (isHi ? 'मैप्स पर लाइव खोजें' : 'Find Live on Google Maps')}</span>
            </button>
          </div>

          {/* District Filter Chips */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs font-semibold">
            <span className="text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider shrink-0">
              {isHi ? 'जिला/क्षेत्र:' : 'District:'}
            </span>
            {districts.map((d) => (
              <button
                key={d}
                onClick={() => setFilterDistrict(d)}
                className={`px-3 py-1 rounded-full text-xs transition-all shrink-0 ${
                  filterDistrict === d
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {d === 'All' ? (isHi ? 'सभी केंद्र' : 'All Centers') : d === 'PMJAY Free' ? (isHi ? 'आयुष्मान मुफ्त (PMJAY)' : 'PMJAY Free') : d}
              </button>
            ))}
          </div>
        </div>

        {/* Hospital Cards List */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {filteredHospitals.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <Building2 className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-slate-600 dark:text-slate-400 font-semibold text-sm">
                {isHi ? 'कोई केंद्र नहीं मिला।' : 'No referral centers match your search.'}
              </p>
              <button
                onClick={() => { setFilterDistrict('All'); setSearchQuery(''); }}
                className="text-xs text-sky-600 dark:text-sky-400 font-bold hover:underline"
              >
                {isHi ? 'फ़िल्टर रीसेट करें' : 'Reset filters'}
              </button>
            </div>
          ) : (
            filteredHospitals.map((hosp) => (
              <div 
                key={hosp.id}
                className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow space-y-3.5"
              >
                {/* Top Badge & Distance */}
                <div className="flex flex-wrap justify-between items-start gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        hosp.isGovt 
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700' 
                          : 'bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-700'
                      }`}>
                        {hosp.type}
                      </span>
                      {hosp.isPMJAY && (
                        <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-700 flex items-center space-x-1">
                          <ShieldCheck className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                          <span>PMJAY / Ayushman Bharat</span>
                        </span>
                      )}
                    </div>
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white leading-tight">
                      {hosp.name}
                    </h3>
                  </div>

                  <span className="bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold px-2.5 py-1 rounded-xl shrink-0 flex items-center space-x-1">
                    <Navigation className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                    <span>{hosp.distance}</span>
                  </span>
                </div>

                {/* Doctor On Duty */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs space-y-0.5">
                  <p className="font-bold text-slate-900 dark:text-white">{hosp.doctor}</p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">{hosp.doctorTitle}</p>
                </div>

                {/* Address & Timings */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-start space-x-2">
                    <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <span className="leading-snug">{hosp.address}</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Clock className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                    <span className="leading-snug">{hosp.opdTimings}</span>
                  </div>
                </div>

                {/* Facilities Tags */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {hosp.facilities.map((f, i) => (
                    <span key={i} className="text-[10px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded">
                      • {f}
                    </span>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                  <a
                    href={`tel:${hosp.phone.replace(/[^0-9+]/g, '')}`}
                    className="inline-flex items-center space-x-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 px-3 py-2 rounded-xl border border-emerald-200 dark:border-emerald-800 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{hosp.phone}</span>
                  </a>

                  <a
                    href={hosp.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 px-3.5 py-2 rounded-xl shadow transition-all"
                  >
                    <span>{isHi ? 'गूगल मैप्स पर देखें' : 'Directions on Google Maps'}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-2 shrink-0 text-xs">
          <p className="text-slate-500 dark:text-slate-400 text-center sm:text-left">
            {isHi 
              ? 'ABDM राष्ट्रीय स्वास्थ्य नेटवर्क के तहत सभी सरकारी जिला अस्पताल मुफ्त नेत्र परीक्षण प्रदान करते हैं।' 
              : 'All Government District Hospitals provide free retinal dilated examination under the National Health Mission.'}
          </p>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold transition-colors"
          >
            {isHi ? 'बंद करें' : 'Close'}
          </button>
        </div>

      </div>
    </div>
  );
}
