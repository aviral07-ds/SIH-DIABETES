import React, { useState } from 'react';
import { X, MapPin, Phone, Clock, ExternalLink, Navigation, Building2, ShieldCheck, Search, Crosshair } from 'lucide-react';
import { NEARBY_HOSPITALS, getLiveMapsSearchUrl } from '../services/nearbyHospitals';
import { useLanguage } from '../context/LanguageContext';

export default function NearbySpecialistsModal({ 
  isOpen, 
  onClose, 
  specialists = [], 
  activeCity = '',
  selectedDistrict = 'All' 
}) {
  const { language } = useLanguage();
  const isHi = language === 'hi';
  const [filterDistrict, setFilterDistrict] = useState(selectedDistrict);
  const [searchQuery, setSearchQuery] = useState('');
  const [locating, setLocating] = useState(false);

  if (!isOpen) return null;

  // Build combined list of active specialists + regional centers, deduplicating by name
  const combinedHospitals = [];
  const seenNames = new Set();

  if (Array.isArray(specialists) && specialists.length > 0) {
    for (const s of specialists) {
      if (!s.name || seenNames.has(s.name.toLowerCase())) continue;
      seenNames.add(s.name.toLowerCase());
      combinedHospitals.push({
        id: s.id || `spec-${Math.random()}`,
        name: s.name,
        doctor: s.doctor || 'Senior Ophthalmology Consultant',
        doctorTitle: s.doctorTitle || 'Retina & Cornea Unit',
        district: activeCity || s.district || 'Local Area',
        address: s.address || s.fullAddress || `${activeCity} Medical Registry`,
        distance: s.distanceLabel || (s.distance_km ? `${s.distance_km} km` : 'Local Area'),
        phone: s.phone_number,
        opdTimings: s.opd_timings || 'Mon – Sat: 9:00 AM – 5:00 PM',
        isGovt: s.facility_type?.includes('Government') || false,
        isPMJAY: s.is_pmjay || false,
        googleMapsUrl: s.directions_url || `https://www.google.com/maps/search/${encodeURIComponent(s.name + ' ' + (activeCity || ''))}`,
        facilities: ['Diabetic Retinopathy Screening', 'Slit Lamp Biomicroscopy', 'Fundus Evaluation', 'Verified Local Clinic'],
        isLocalActive: true,
      });
    }
  }

  // Also append accredited regional tertiary hospitals
  for (const h of NEARBY_HOSPITALS) {
    if (!seenNames.has(h.name.toLowerCase())) {
      seenNames.add(h.name.toLowerCase());
      combinedHospitals.push(h);
    }
  }

  const districts = ['All', 'Local Area', 'Satara', 'Pune', 'Mumbai', 'PMJAY Free'];

  const filteredHospitals = combinedHospitals.filter((hosp) => {
    // District / category filter
    if (filterDistrict === 'PMJAY Free' && !hosp.isPMJAY) return false;
    if (filterDistrict === 'Local Area' && !hosp.isLocalActive) return false;
    if (filterDistrict !== 'All' && filterDistrict !== 'PMJAY Free' && filterDistrict !== 'Local Area' && hosp.district !== filterDistrict) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        hosp.name.toLowerCase().includes(q) ||
        (hosp.doctor && hosp.doctor.toLowerCase().includes(q)) ||
        (hosp.address && hosp.address.toLowerCase().includes(q)) ||
        (hosp.district && hosp.district.toLowerCase().includes(q))
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
          window.open(activeCity ? `https://www.google.com/maps/search/eye+specialist+ophthalmologist+in+${encodeURIComponent(activeCity)}` : getLiveMapsSearchUrl(), '_blank', 'noopener,noreferrer');
        },
        { timeout: 5000 }
      );
    } else {
      setLocating(false);
      window.open(activeCity ? `https://www.google.com/maps/search/eye+specialist+ophthalmologist+in+${encodeURIComponent(activeCity)}` : getLiveMapsSearchUrl(), '_blank', 'noopener,noreferrer');
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
              {activeCity && (
                <span className="bg-sky-500/30 text-sky-200 text-[10px] font-bold px-2 py-0.5 rounded-full border border-sky-400/40">
                  {activeCity}
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold flex items-center space-x-2">
              <MapPin className="w-6 h-6 text-sky-400 shrink-0" />
              <span>{isHi ? `${activeCity || 'निकटतम'} नेत्र विशेषज्ञ और अस्पताल केंद्र` : `Eye Specialists & Hospital Centers in ${activeCity || 'Your Area'}`}</span>
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
              <Crosshair className={`w-3.5 h-3.5 ${locating ? 'animate-spin' : ''}`} />
              <span>{isHi ? 'मैप्स पर लाइव खोजें' : 'Open in Google Maps'}</span>
            </button>
          </div>

          {/* District filter pills */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mr-1">{isHi ? 'फ़िल्टर:' : 'Filter:'}</span>
            {districts.map((d) => (
              <button
                key={d}
                onClick={() => setFilterDistrict(d)}
                className={`text-xs px-3 py-1 rounded-xl font-bold transition-all ${
                  filterDistrict === d
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {d === 'PMJAY Free' ? (isHi ? 'आयुष्मान भारत (PMJAY)' : 'PMJAY Free') : d}
              </button>
            ))}
          </div>
        </div>

        {/* Hospitals Cards Directory List */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {filteredHospitals.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <Building2 className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">
                {isHi ? 'कोई अस्पताल या केंद्र नहीं मिला' : 'No referral centers found matching your search'}
              </p>
              <p className="text-xs text-slate-400">
                {isHi ? 'कृपया अपना खोज शब्द बदलें या "सभी" फ़िल्टर चुनें।' : 'Try searching for another city or clear the search query.'}
              </p>
            </div>
          ) : (
            filteredHospitals.map((hosp) => (
              <div
                key={hosp.id}
                className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 sm:p-5 shadow-sm space-y-3.5 hover:border-sky-300 dark:hover:border-sky-700 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-extrabold text-sky-700 dark:text-sky-300 uppercase bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded-full border border-sky-200 dark:border-sky-800">
                        {hosp.district}
                      </span>
                      {hosp.isPMJAY && (
                        <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center space-x-1">
                          <ShieldCheck className="w-3 h-3" />
                          <span>PMJAY Free</span>
                        </span>
                      )}
                    </div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base leading-snug">
                      {hosp.name}
                    </h3>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {hosp.doctor} {hosp.doctorTitle ? `• ${hosp.doctorTitle}` : ''}
                    </p>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-1 shrink-0">
                    <span className="bg-slate-100 dark:bg-slate-700/80 text-slate-800 dark:text-slate-200 text-xs font-extrabold px-2.5 py-1 rounded-lg">
                      {hosp.distance}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-700/60 pt-3">
                  <div className="flex items-start space-x-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{hosp.address}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{hosp.opdTimings}</span>
                  </div>
                </div>

                {/* Facility Tags */}
                {hosp.facilities && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {hosp.facilities.map((fac, i) => (
                      <span
                        key={i}
                        className="text-[10px] bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700"
                      >
                        {fac}
                      </span>
                    ))}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center space-x-2 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                  {hosp.phone ? (
                    <a
                      href={`tel:${hosp.phone.replace(/\s+/g, '')}`}
                      className="flex-1 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-bold text-xs py-2 px-3 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-center space-x-1 transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>{isHi ? 'ओपीडी कॉल' : 'Call OPD'}</span>
                    </a>
                  ) : (
                    <a
                      href={`https://www.google.com/search?q=${encodeURIComponent(hosp.name + ' contact phone')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 font-bold text-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center space-x-1 transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>{isHi ? 'संपर्क खोजें' : 'Contact Phone'}</span>
                    </a>
                  )}

                  <a
                    href={hosp.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs py-2 px-3 rounded-xl shadow-sm flex items-center justify-center space-x-1 transition-all"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>{isHi ? 'दिशा-निर्देश' : 'Directions'}</span>
                  </a>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-center shrink-0">
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {isHi 
              ? 'आपातकालीन रेटिना व विट्रेक्टोमी सर्जरी के लिए निकटतम सरकारी मेडिकल कॉलेज से तुरंत संपर्क करें।' 
              : 'For urgent retinal detachment or acute macular hemorrhage, report directly to the nearest Medical College Emergency Eye OPD.'}
          </p>
        </div>

      </div>
    </div>
  );
}
