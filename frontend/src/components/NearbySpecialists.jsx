import React, { useState, useEffect } from 'react';
import { 
  Compass, Eye, Star, MapPin, Phone, Navigation, Loader2, 
  AlertCircle, RefreshCw, Building2, ExternalLink, ShieldCheck, 
  Clock, Search, CheckCircle2, Navigation2, Crosshair 
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { autoDetectUserLocation, searchNearbyEyeDoctors, calculateHaversineDistance } from '../services/doctorLocator';

export default function NearbySpecialists({ initialLocation, onOpenDirectory }) {
  const { language } = useLanguage();
  const isHi = language === 'hi';

  const [locationInput, setLocationInput] = useState('');
  const [activeLocationLabel, setActiveLocationLabel] = useState('');
  const [locationSource, setLocationSource] = useState('');
  const [userCoords, setUserCoords] = useState(null);
  const [specialists, setSpecialists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // Auto-detect user's location immediately on mount
  useEffect(() => {
    initUserLocationAndDoctors();
  }, [initialLocation]);

  const initUserLocationAndDoctors = async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      let loc;
      // If user typed a custom facility on the screening form, use that first
      if (initialLocation && initialLocation !== 'PHC Shirwal, Satara District') {
        loc = {
          city: initialLocation,
          latitude: null,
          longitude: null,
          source: 'Patient Form Input',
        };
      } else {
        // Automatically detect user location using Free GPS / IP geolocation
        loc = await autoDetectUserLocation();
      }

      setUserCoords(loc.latitude && loc.longitude ? { latitude: loc.latitude, longitude: loc.longitude } : null);
      setActiveLocationLabel(loc.city || 'Your Area');
      setLocationSource(loc.source);
      setLocationInput(loc.city || '');

      // Fetch real nearby doctors for this location
      const docs = await searchNearbyEyeDoctors(loc.latitude, loc.longitude, loc.city);
      setSpecialists(docs);
    } catch (err) {
      console.error('Failed to locate doctors:', err);
      setErrorMessage(isHi ? 'स्थान या डॉक्टर लोड करने में असमर्थ। कृपया नीचे अपना शहर खोजें।' : 'Could not automatically load doctors. Please enter your city below.');
    } finally {
      setLoading(false);
    }
  };

  // Re-detect using high-accuracy device GPS
  const handleGPSDetect = () => {
    if (!navigator.geolocation) {
      setErrorMessage(isHi ? 'आपके डिवाइस में जीपीएस समर्थित नहीं है।' : 'GPS is not supported on this device.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserCoords({ latitude, longitude });

        // Reverse geocode to get city name
        let detectedCity = 'Current GPS Location';
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`, {
            headers: { 'User-Agent': 'DrishtiCare/1.0' }
          });
          if (res.ok) {
            const data = await res.json();
            detectedCity = data.address?.city || data.address?.town || data.address?.district || detectedCity;
          }
        } catch (e) {
          console.warn('Reverse geocode error:', e);
        }

        setActiveLocationLabel(detectedCity);
        setLocationInput(detectedCity);
        setLocationSource('Live Device GPS');

        const docs = await searchNearbyEyeDoctors(latitude, longitude, detectedCity);
        setSpecialists(docs);
        setLoading(false);
      },
      (err) => {
        console.warn('GPS denied or error:', err);
        setLoading(false);
        setErrorMessage(isHi 
          ? 'जीपीएस अनुमति नहीं मिली। आप नीचे किसी भी शहर का नाम लिखकर खोज सकते हैं।' 
          : 'GPS permission not granted. You can type any city or district below.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Search doctors when user submits a city name
  const handleCitySearch = async (e) => {
    e.preventDefault();
    const city = locationInput.trim();
    if (!city) return;

    setLoading(true);
    setErrorMessage('');
    setActiveLocationLabel(city);
    setLocationSource('Custom City Search');

    try {
      // Geocode city to get its coordinates
      let cityLat = null, cityLon = null;
      try {
        const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}&limit=1`, {
          headers: { 'User-Agent': 'DrishtiCare/1.0' }
        });
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          if (geoData.length > 0) {
            cityLat = parseFloat(geoData[0].lat);
            cityLon = parseFloat(geoData[0].lon);
            setUserCoords({ latitude: cityLat, longitude: cityLon });
          }
        }
      } catch (e) {
        console.warn('City geocoding error:', e);
      }

      const docs = await searchNearbyEyeDoctors(cityLat, cityLon, city);
      setSpecialists(docs);
    } catch (err) {
      console.error('Search failed:', err);
      setErrorMessage(isHi ? 'इस शहर के लिए डॉक्टर खोजने में त्रुटि। कृपया पुनः प्रयास करें।' : 'Error searching doctors for this city. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Google Maps search query link for user's exact area
  const mapsSearchUrl = userCoords
    ? `https://www.google.com/maps/search/eye+specialist+ophthalmologist+retina+hospital/@${userCoords.latitude},${userCoords.longitude},13z`
    : activeLocationLabel
      ? `https://www.google.com/maps/search/eye+specialist+ophthalmologist+in+${encodeURIComponent(activeLocationLabel)}`
      : 'https://www.google.com/maps/search/eye+specialist+near+me/';

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
                <span>{isHi ? 'सत्यापित डॉक्टर' : 'Verified Clinics'}</span>
              </span>
            </div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-lg mt-0.5">
              {isHi ? 'आपके नजदीकी नेत्र विशेषज्ञ और अस्पताल' : 'Nearby Eye Specialists & Eye Clinics'}
            </h3>
          </div>
        </div>

        {/* 1-Click Live Google Maps Button */}
        <a
          href={mapsSearchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl shadow-md transition-all shrink-0"
        >
          <Navigation2 className="w-4 h-4 fill-white" />
          <span>{isHi ? 'गूगल मैप्स पर पास के डॉक्टर देखें' : 'Open in Google Maps'}</span>
          <ExternalLink className="w-3 h-3 ml-0.5 opacity-80" />
        </a>
      </div>

      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
        {isHi 
          ? 'आपके वर्तमान स्थान के आधार पर निकटतम नेत्र क्लीनिक और रेटिना सर्जनों की लाइव सूची। आप नीचे किसी भी शहर या पिनकोड को खोज सकते हैं।' 
          : 'Live verified eye hospitals and retina specialists detected near your location. Search any city or district below.'}
      </p>

      {/* Interactive Location & City Search Bar */}
      <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border-2 border-sky-200 dark:border-slate-700 shadow-sm space-y-3">
        <form onSubmit={handleCitySearch} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="flex items-center space-x-2 flex-1 bg-slate-50 dark:bg-slate-900/80 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
            <Search className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
            <input
              type="text"
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              placeholder={isHi ? 'अपना शहर या जिला लिखें (उदा. Bhopal, Lucknow, Jaipur, Indore)' : 'Enter your city or district (e.g. Bhopal, Lucknow, Jaipur, Indore)'}
              className="flex-1 bg-transparent text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !locationInput.trim()}
            className="bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-sm shrink-0 flex items-center justify-center space-x-1"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            <span>{isHi ? 'शहर खोजें' : 'Search City'}</span>
          </button>

          <button
            type="button"
            onClick={handleGPSDetect}
            disabled={loading}
            className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all border border-slate-200 dark:border-slate-600 shrink-0 flex items-center justify-center space-x-1.5"
            title="Use Device GPS"
          >
            <Crosshair className="w-3.5 h-3.5 text-rose-500" />
            <span>{isHi ? 'लाइव GPS' : 'My GPS'}</span>
          </button>
        </form>

        {/* Current Active Location Indicator */}
        <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-700/60">
          <div className="flex items-center space-x-1.5 font-bold text-slate-700 dark:text-slate-300">
            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span>
              {isHi ? 'सक्रिय स्थान:' : 'Active Location:'}{' '}
              <span className="text-sky-600 dark:text-sky-400 font-extrabold underline">{activeLocationLabel || 'Locating...'}</span>
            </span>
          </div>

          {locationSource && (
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
              {locationSource}
            </span>
          )}
        </div>
      </div>

      {/* Error or Notice Alert */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 flex items-start space-x-2 text-xs text-amber-800 dark:text-amber-300">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="flex-1">{errorMessage}</p>
        </div>
      )}

      {/* Loading Indicator */}
      {loading && (
        <div className="py-8 flex flex-col items-center justify-center space-y-2 text-center bg-white/60 dark:bg-slate-800/60 rounded-2xl border border-sky-100 dark:border-slate-700">
          <Loader2 className="w-7 h-7 text-sky-600 animate-spin" />
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
            {isHi ? 'आपके आसपास के प्रमाणित नेत्र डॉक्टर खोजे जा रहे हैं...' : 'Finding nearby eye hospitals and specialists around you...'}
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            Free OpenStreetMap & Location API Query
          </p>
        </div>
      )}

      {/* Doctors / Hospitals Cards List */}
      {!loading && (
        <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
          {specialists.length === 0 ? (
            <div className="p-6 text-center bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
              <Building2 className="w-8 h-8 mx-auto text-slate-400" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {isHi ? 'इस क्षेत्र में कोई विशिष्ट क्लिनिक नहीं मिला' : `No eye clinics found directly in "${activeLocationLabel}"`}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                {isHi ? 'सीधे गूगल मैप्स पर अपने आसपास के सभी नेत्र विशेषज्ञ देखने के लिए नीचे क्लिक करें।' : 'Click below to view all ophthalmologists and eye specialists in this area on Google Maps.'}
              </p>
              <a
                href={mapsSearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all"
              >
                <Search className="w-3.5 h-3.5" />
                <span>{isHi ? `गूगल मैप्स पर ${activeLocationLabel} के डॉक्टर देखें` : `Search ${activeLocationLabel} on Google Maps`}</span>
              </a>
            </div>
          ) : (
            specialists.map((doc, idx) => (
              <div
                key={doc.id || idx}
                className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-sky-100 dark:border-slate-700/80 shadow-sm space-y-2.5 transition-all hover:border-sky-300 dark:hover:border-sky-600"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-1.5 font-extrabold text-slate-900 dark:text-white text-sm">
                      <Building2 className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                      <span>{doc.name}</span>
                    </div>
                    {doc.address && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-start space-x-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{doc.address}</span>
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
                    {doc.is_pmjay && (
                      <span className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                        PMJAY Free
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions: Call & Directions */}
                <div className="flex items-center space-x-2 pt-2 border-t border-slate-100 dark:border-slate-700/80">
                  <a
                    href={doc.google_search_url || `https://www.google.com/search?q=${encodeURIComponent(doc.name + ' contact phone')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center space-x-1 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>{isHi ? 'संपर्क / फोन' : 'Contact & Reviews'}</span>
                  </a>

                  <a
                    href={doc.directions_url || `https://www.google.com/maps/search/${encodeURIComponent(doc.name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs py-2 px-3 rounded-xl shadow-sm flex items-center justify-center space-x-1 transition-all"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>{isHi ? 'गूगल मैप्स दिशा' : 'Get Directions'}</span>
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Directory Modal Trigger Button */}
      <button
        onClick={onOpenDirectory}
        className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-sky-700 dark:hover:bg-sky-600 text-white font-bold py-3 px-4 rounded-xl text-xs transition-all flex items-center justify-center space-x-2 shadow-sm"
      >
        <MapPin className="w-4 h-4 text-sky-400" />
        <span>
          {isHi ? 'राष्ट्रीय व जिला स्तरीय प्रमाणित अस्पताल निर्देशिका देखें' : 'View Accredited Referral Hospital Directory'}
        </span>
      </button>

      {/* Footer Note */}
      <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center leading-normal">
        {isHi 
          ? 'सरकारी जिला अस्पतालों व आयुष्मान भारत (PMJAY) पंजीकृत केंद्रों में निःशुल्क रेटिना जांच और लेजर उपचार उपलब्ध है।' 
          : 'Free retinal diagnosis & laser consultations are available at all PMJAY / MJPJAY empaneled district hospitals.'}
      </p>

    </div>
  );
}
