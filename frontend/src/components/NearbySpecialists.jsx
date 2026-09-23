import React, { useState, useEffect } from 'react';
import { 
  Compass, Eye, Star, MapPin, Phone, Navigation, Loader2, 
  AlertCircle, RefreshCw, Building2, ExternalLink, ShieldCheck, 
  Clock, Search, CheckCircle2, Edit3 
} from 'lucide-react';
import { getStoredApiConfig } from '../config/api';
import { useLanguage } from '../context/LanguageContext';
import { NEARBY_HOSPITALS, getLiveMapsSearchUrl } from '../services/nearbyHospitals';

export default function NearbySpecialists({ initialLocation, onOpenDirectory }) {
  const { language } = useLanguage();
  const isHi = language === 'hi';

  const defaultLoc = initialLocation || 'PHC Shirwal, Satara District';
  const [locationQuery, setLocationQuery] = useState(defaultLoc);
  const [isEditingLoc, setIsEditingLoc] = useState(false);
  const [status, setStatus] = useState('ready'); // 'ready' | 'locating' | 'fetching' | 'success' | 'fallback'
  const [errorMessage, setErrorMessage] = useState('');
  const [activeDistrict, setActiveDistrict] = useState('All');
  const [userCoords, setUserCoords] = useState(null);
  const [specialists, setSpecialists] = useState([]);

  // Compute Haversine distance in km
  const calculateHaversine = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  };

  // Synchronize when initialLocation prop changes
  useEffect(() => {
    if (initialLocation) {
      setLocationQuery(initialLocation);
      applyLocationFilter(initialLocation);
    }
  }, [initialLocation]);

  // Initialize with curated accredited centers
  useEffect(() => {
    const initialList = NEARBY_HOSPITALS.map(h => ({
      id: h.id,
      name: h.name,
      doctor: h.doctor,
      doctorTitle: h.doctorTitle,
      district: h.district,
      address: h.address,
      distance_km: parseFloat(h.distance) || null,
      distanceLabel: h.distance,
      phone_number: h.phone,
      opd_timings: h.opdTimings,
      is_pmjay: h.isPMJAY,
      is_govt: h.isGovt,
      directions_url: h.googleMapsUrl,
      source: 'Curated Registry'
    }));
    setSpecialists(initialList);

    if (defaultLoc) {
      applyLocationFilter(defaultLoc);
    }
  }, []);

  // When location input changes, auto-adjust district filter if matched
  const applyLocationFilter = (locText) => {
    const lower = (locText || '').toLowerCase();
    if (lower.includes('satara') || lower.includes('shirwal')) {
      setActiveDistrict('Satara');
    } else if (lower.includes('pune')) {
      setActiveDistrict('Pune');
    } else if (lower.includes('mumbai') || lower.includes('thane') || lower.includes('byculla')) {
      setActiveDistrict('Mumbai');
    } else if (lower.includes('delhi') || lower.includes('aiims')) {
      setActiveDistrict('All');
    }
  };

  const handleLocationChange = (val) => {
    setLocationQuery(val);
    setUserCoords(null); // Switching back to manual text location
    applyLocationFilter(val);
  };

  const handleFindSpecialists = () => {
    if (!navigator.geolocation) {
      setErrorMessage(isHi ? 'आपके ब्राउज़र में जीपीएस लोकेशन समर्थित नहीं है।' : 'Geolocation is not supported by your browser.');
      setStatus('fallback');
      return;
    }

    setStatus('locating');
    setErrorMessage('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setUserCoords({ latitude, longitude });
        setLocationQuery(isHi ? `लाइव जीपीएस (${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°)` : `Live GPS (${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°)`);
        setStatus('fetching');

        try {
          const config = getStoredApiConfig();
          const baseUrl = config.useLocalFallback ? config.localUrl : config.aptosUrl;
          const url = `${baseUrl}/api/nearby-doctors?lat=${latitude}&lng=${longitude}`;

          const res = await fetch(url, {
            method: 'GET',
            headers: {
              ...(config.apiKey ? { 'X-API-Key': config.apiKey } : {}),
            },
          });

          if (!res.ok) {
            throw new Error(`Server returned HTTP ${res.status}`);
          }

          const data = await res.json();
          const results = data.results || [];

          if (results.length > 0) {
            setSpecialists(results.map(r => ({
              ...r,
              distanceLabel: r.distance_km ? `${r.distance_km} km` : null
            })));
            setStatus('success');
          } else {
            applyGpsFallback(latitude, longitude);
          }
        } catch (err) {
          console.warn('Backend doctor route unreachable, computing client-side GPS distances:', err);
          applyGpsFallback(latitude, longitude);
        }
      },
      (geoError) => {
        setStatus('fallback');
        if (geoError.code === geoError.PERMISSION_DENIED) {
          setErrorMessage(isHi 
            ? 'स्थान अनुमति अस्वीकृत। डिफ़ॉल्ट प्रमाणित केंद्र और लाइव मैप्स खोज नीचे उपलब्ध हैं।' 
            : 'Location permission denied. Showing accredited regional centers and live Google Maps finder below.');
        } else {
          setErrorMessage(isHi 
            ? 'जीपीएस स्थान प्राप्त करने में असमर्थ। नीचे दिए गए प्रमाणित केंद्र देखें।' 
            : 'Unable to retrieve precise GPS. Showing accredited regional referral centers below.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const applyGpsFallback = (lat, lng) => {
    const updated = NEARBY_HOSPITALS.map(h => {
      let hLat = 17.6805, hLng = 74.0183;
      if (h.district === 'Pune') { hLat = 18.5204; hLng = 73.8567; }
      else if (h.district === 'Mumbai') { hLat = 18.9634; hLng = 72.8339; }
      else if (h.district?.includes('National')) { hLat = 28.5672; hLng = 77.2100; }

      const dist = calculateHaversine(lat, lng, hLat, hLng);
      return {
        id: h.id,
        name: h.name,
        doctor: h.doctor,
        doctorTitle: h.doctorTitle,
        district: h.district,
        address: h.address,
        distance_km: dist,
        distanceLabel: `${dist} km away`,
        phone_number: h.phone,
        opd_timings: h.opdTimings,
        is_pmjay: h.isPMJAY,
        is_govt: h.isGovt,
        directions_url: h.googleMapsUrl,
        source: 'Accredited Health Registry'
      };
    });

    updated.sort((a, b) => (a.distance_km || 9999) - (b.distance_km || 9999));
    setSpecialists(updated);
    setStatus('success');
  };

  // Build live Google Maps search URL based on current coordinates or typed text location
  const getDynamicMapsUrl = () => {
    if (userCoords) {
      return getLiveMapsSearchUrl(userCoords);
    }
    const query = locationQuery ? `eye specialist ophthalmologist retina hospital in ${locationQuery}` : 'eye specialist ophthalmologist retina hospital near me';
    return `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
  };

  // Filter specialists by district / PMJAY
  const filteredSpecialists = specialists.filter(h => {
    if (activeDistrict === 'All') return true;
    if (activeDistrict === 'PMJAY') return h.is_pmjay || h.isPMJAY;
    return h.district === activeDistrict;
  });

  const districts = ['All', 'Satara', 'Pune', 'Mumbai', 'PMJAY'];

  return (
    <div className="bg-gradient-to-br from-sky-50 via-teal-50/40 to-white dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 rounded-3xl p-6 sm:p-7 border-2 border-sky-300 dark:border-sky-800 shadow-md space-y-5">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-sky-600 text-white flex items-center justify-center font-bold shadow-md shrink-0">
            <Eye className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-extrabold text-sky-700 dark:text-sky-400 uppercase tracking-widest bg-sky-100 dark:bg-sky-950/70 px-2 py-0.5 rounded-full">
                {isHi ? 'नेत्र विशेषज्ञ सहायता' : 'LOCAL CLINICAL CARE'}
              </span>
              <span className="flex items-center space-x-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/70 px-2 py-0.5 rounded-full">
                <ShieldCheck className="w-3 h-3" />
                <span>{isHi ? 'प्रमाणित केंद्र' : 'Verified Centers'}</span>
              </span>
            </div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-lg mt-0.5">
              {isHi ? 'क्या आपको नेत्र विशेषज्ञ से परामर्श की आवश्यकता है?' : 'Need to consult an eye specialist?'}
            </h3>
          </div>
        </div>

        {/* Live Google Maps Quick Link */}
        <a
          href={getDynamicMapsUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center space-x-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-sm transition-all shrink-0"
        >
          <Compass className="w-4 h-4" />
          <span>{isHi ? 'गूगल मैप्स पर खोजें' : 'Search on Google Maps'}</span>
          <ExternalLink className="w-3 h-3 ml-0.5 opacity-80" />
        </a>
      </div>

      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
        {isHi 
          ? 'रेटिनोपैथी के लक्षणों की तुरंत पुष्टि के लिए अपने नजदीकी जिला अस्पताल, नेत्र ओपीडी या आयुष्मान भारत (PMJAY) रेटिना विशेषज्ञ से संपर्क करें।' 
          : 'Connect with nearby accredited ophthalmologists, government district eye OPDs, and Ayushman Bharat (PMJAY) vitreo-retinal centers.'}
      </p>

      {/* User Input Center / Location Bar */}
      <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border-2 border-sky-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="flex items-center space-x-2 flex-1">
          <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
          <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-200 shrink-0">
            {isHi ? 'स्क्रीनिंग केंद्र / शहर:' : 'Center / Location:'}
          </span>
          <input
            type="text"
            value={locationQuery}
            onChange={(e) => handleLocationChange(e.target.value)}
            placeholder={isHi ? 'उदा. Satara, Pune, Mumbai, या अपना शहर' : 'e.g. Satara, Pune, Mumbai, or your city'}
            className="flex-1 bg-sky-50/50 dark:bg-slate-900/60 text-xs font-bold text-sky-900 dark:text-sky-200 px-3 py-1.5 rounded-xl border border-sky-100 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>

        <button
          onClick={handleFindSpecialists}
          disabled={status === 'locating' || status === 'fetching'}
          className="inline-flex items-center justify-center space-x-1.5 text-xs font-bold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/60 px-3 py-1.5 rounded-xl border border-sky-200 dark:border-sky-800 transition-colors shrink-0"
        >
          {status === 'locating' || status === 'fetching' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Compass className="w-3.5 h-3.5" />
          )}
          <span>{isHi ? 'लाइव GPS का पता लगाएं' : 'Detect Live GPS'}</span>
        </button>
      </div>

      {/* Location Status Label */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-1">
        <span>
          {userCoords ? (
            <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isHi ? 'सक्रिय स्थान: उपयोगकर्ता का लाइव डिवाइस जीपीएस' : 'Active Location: Live Device GPS Coordinates'}</span>
            </span>
          ) : (
            <span>
              {isHi 
                ? `सक्रिय स्थान: "${locationQuery}" (रोगी फॉर्म / इनपुट द्वारा निर्धारित)` 
                : `Active Location: "${locationQuery}" (Set by user input / patient form)`}
            </span>
          )}
        </span>
      </div>

      {/* Error or Notice Alert */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 flex items-start space-x-2 text-xs text-amber-800 dark:text-amber-300">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="flex-1">{errorMessage}</p>
        </div>
      )}

      {/* District & Category Filter Pills */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mr-1">
          {isHi ? 'क्षेत्र:' : 'Filter:'}
        </span>
        {districts.map(dist => (
          <button
            key={dist}
            onClick={() => setActiveDistrict(dist)}
            className={`text-xs px-3 py-1 rounded-xl font-bold transition-all ${
              activeDistrict === dist
                ? 'bg-sky-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
            }`}
          >
            {dist === 'PMJAY' ? (isHi ? 'आयुष्मान भारत (PMJAY)' : 'PMJAY Free') : dist}
          </button>
        ))}
      </div>

      {/* Hospital Cards List */}
      <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
        {filteredSpecialists.length === 0 ? (
          <div className="p-6 text-center bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
            <Building2 className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {isHi ? 'इस क्षेत्र में कोई केंद्र सूचीबद्ध नहीं है' : 'No centers match this filter'}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              {isHi ? 'कृपया "All" चुनें या लाइव गूगल मैप्स पर देखें।' : 'Please switch to "All" or search live on Google Maps.'}
            </p>
          </div>
        ) : (
          filteredSpecialists.slice(0, 4).map((doc, idx) => (
            <div
              key={doc.id || idx}
              className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-sky-100 dark:border-slate-700/80 shadow-sm space-y-3 transition-all hover:border-sky-300 dark:hover:border-sky-600"
            >
              <div className="flex justify-between items-start gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-1.5 font-extrabold text-slate-900 dark:text-white text-sm">
                    <Building2 className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                    <span>{doc.name}</span>
                  </div>
                  {doc.doctor && (
                    <p className="text-xs font-semibold text-sky-700 dark:text-sky-300">
                      {doc.doctor} {doc.doctorTitle ? `• ${doc.doctorTitle}` : ''}
                    </p>
                  )}
                  {doc.address && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-start space-x-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                      <span>{doc.address}</span>
                    </p>
                  )}
                  {doc.opd_timings && (
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center space-x-1 font-medium">
                      <Clock className="w-3 h-3 shrink-0" />
                      <span>{doc.opd_timings}</span>
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-end space-y-1 shrink-0">
                  {doc.distanceLabel && (
                    <span className="bg-sky-100 dark:bg-sky-950/70 text-sky-800 dark:text-sky-300 font-extrabold text-[11px] px-2.5 py-0.5 rounded-lg border border-sky-200 dark:border-sky-800">
                      {doc.distanceLabel}
                    </span>
                  )}
                  {(doc.is_pmjay || doc.isPMJAY) && (
                    <span className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                      PMJAY Free
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 pt-2 border-t border-slate-100 dark:border-slate-700/80">
                {doc.phone_number && (
                  <a
                    href={`tel:${doc.phone_number.replace(/\s+/g, '')}`}
                    className="flex-1 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-bold text-xs py-2 px-3 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-center space-x-1 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{isHi ? 'कॉल करें' : 'Call OPD'}</span>
                  </a>
                )}

                <a
                  href={doc.directions_url || `https://www.google.com/maps/search/${encodeURIComponent(doc.name)}`}
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

      {/* Directory Modal Trigger Button */}
      <button
        onClick={onOpenDirectory}
        className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-sky-700 dark:hover:bg-sky-600 text-white font-bold py-3 px-4 rounded-xl text-xs transition-all flex items-center justify-center space-x-2 shadow-sm"
      >
        <MapPin className="w-4 h-4 text-sky-400" />
        <span>
          {isHi 
            ? `सभी निकटतम नेत्र अस्पताल और क्लीनिक देखें (${specialists.length} केंद्र)` 
            : `View All Nearby Eye Specialists & Clinics (${specialists.length} Centers)`}
        </span>
      </button>

      {/* Footer Note */}
      <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center leading-normal">
        {isHi 
          ? 'सरकारी जिला अस्पताल व आयुष्मान भारत (PMJAY) पंजीकृत केंद्रों में निःशुल्क रेटिना जांच उपलब्ध है।' 
          : 'Free retinal diagnosis & laser consultations are available at PMJAY / MJPJAY empaneled district hospitals.'}
      </p>

    </div>
  );
}
