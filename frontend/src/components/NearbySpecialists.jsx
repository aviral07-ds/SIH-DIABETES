import React, { useState, useEffect } from 'react';
import { 
  Compass, Eye, Star, MapPin, Phone, Navigation, Loader2, 
  AlertCircle, RefreshCw, Building2, ExternalLink, ShieldCheck, 
  Clock, Search, CheckCircle2, Navigation2, Crosshair 
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { 
  autoDetectUserLocation, 
  searchNearbyEyeDoctors, 
  extractCityFromFacility 
} from '../services/doctorLocator';

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

  // Popular quick-select cities for instant testing across regions
  const quickCities = ['Bhopal', 'Indore', 'Lucknow', 'Jaipur', 'Patna', 'Pune', 'Nagpur', 'Satara', 'Delhi'];

  // Initialize location and doctors on mount or when initialLocation changes
  useEffect(() => {
    initLocation(initialLocation);
  }, [initialLocation]);

  const initLocation = async (facilityInput) => {
    setLoading(true);
    setErrorMessage('');

    try {
      const extracted = extractCityFromFacility(facilityInput);
      if (extracted) {
        // User entered a facility/city in patient intake
        setActiveLocationLabel(extracted);
        setLocationInput(extracted);
        setLocationSource('Patient Demographics Facility');
        const docs = await searchNearbyEyeDoctors(null, null, extracted);
        setSpecialists(docs);
      } else {
        // Automatically detect user location using GPS or IP geolocation
        const loc = await autoDetectUserLocation();
        setUserCoords(loc.latitude && loc.longitude ? { latitude: loc.latitude, longitude: loc.longitude } : null);
        setActiveLocationLabel(loc.city || 'Your Area');
        setLocationSource(loc.source);
        setLocationInput(loc.city || '');

        const docs = await searchNearbyEyeDoctors(loc.latitude, loc.longitude, loc.city);
        setSpecialists(docs);
      }
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

        let detectedCity = 'Current GPS Area';
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
          ? 'जीपीएस अनुमति नहीं मिली। आप नीचे किसी भी शहर का नाम चुन या लिख सकते हैं।' 
          : 'GPS permission not granted. You can type or click any city below.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Select a city directly
  const handleSelectCity = async (cityName) => {
    if (!cityName) return;
    setLoading(true);
    setErrorMessage('');
    setActiveLocationLabel(cityName);
    setLocationInput(cityName);
    setLocationSource('City Selected');

    try {
      const docs = await searchNearbyEyeDoctors(null, null, cityName);
      setSpecialists(docs);
    } catch (err) {
      console.error('City search failed:', err);
      setErrorMessage(isHi ? 'इस शहर के लिए डॉक्टर खोजने में त्रुटि।' : 'Error searching doctors for this city.');
    } finally {
      setLoading(false);
    }
  };

  // Search doctors when user submits a city name
  const handleCitySearch = (e) => {
    e.preventDefault();
    const city = locationInput.trim();
    if (city) {
      handleSelectCity(city);
    }
  };

  // Google Maps search query link for user's exact active location
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
              {isHi ? 'निकटतम नेत्र विशेषज्ञ और अस्पताल' : 'Nearby Eye Specialists & Eye Clinics'}
            </h3>
          </div>
        </div>

        {/* 1-Click Live Google Maps Button for Current City */}
        <a
          href={mapsSearchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl shadow-md transition-all shrink-0"
        >
          <Navigation2 className="w-4 h-4 fill-white" />
          <span>{isHi ? `${activeLocationLabel || 'पास में'} मैप्स पर देखें` : `Open ${activeLocationLabel || 'Local'} in Google Maps`}</span>
          <ExternalLink className="w-3 h-3 ml-0.5 opacity-80" />
        </a>
      </div>

      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
        {isHi 
          ? 'आपके शहर या वर्तमान जीपीएस स्थान के आधार पर प्रमाणित नेत्र क्लीनिक और रेटिना सर्जनों की लाइव सूची। नीचे किसी भी शहर पर क्लिक करें या अपना शहर लिखें।' 
          : 'Live verified eye hospitals and retina specialists detected for your location. Click any city below or type your town to switch immediately.'}
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
              placeholder={isHi ? 'शहर या जिला दर्ज करें (उदा. Indore, Jaipur, Lucknow, Pune)' : 'Type any city or district (e.g. Indore, Jaipur, Lucknow, Pune)'}
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
            <span>{isHi ? 'मेरा GPS' : 'My GPS'}</span>
          </button>
        </form>

        {/* Quick-Switch City Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mr-1">
            {isHi ? 'त्वरित शहर:' : 'Quick Select:'}
          </span>
          {quickCities.map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => handleSelectCity(city)}
              className={`text-xs px-2.5 py-1 rounded-xl font-bold transition-all ${
                activeLocationLabel.toLowerCase().includes(city.toLowerCase())
                  ? 'bg-sky-600 text-white shadow-sm ring-2 ring-sky-300 dark:ring-sky-700'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-sky-100 dark:hover:bg-slate-600'
              }`}
            >
              {city}
            </button>
          ))}
        </div>

        {/* Current Active Location Indicator */}
        <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-700/60">
          <div className="flex items-center space-x-1.5 font-bold text-slate-700 dark:text-slate-300">
            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span>
              {isHi ? 'प्रदर्शित शहर / स्थान:' : 'Current City / Location:'}{' '}
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

      {/* Error / Notice Alert */}
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
            {isHi ? `${activeLocationLabel} में नेत्र क्लीनिक और डॉक्टर खोजे जा रहे हैं...` : `Finding verified eye specialists in ${activeLocationLabel}...`}
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            Querying OpenStreetMap Healthcare Registry
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
                {isHi ? `"${activeLocationLabel}" में कोई विशिष्ट क्लिनिक नहीं मिला` : `No direct clinics found in "${activeLocationLabel}"`}
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
                    <span>{isHi ? 'दिशा-निर्देश' : 'Get Directions'}</span>
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
          {isHi ? `राष्ट्रीय व जिला स्तरीय प्रमाणित अस्पताल निर्देशिका देखें` : `View Full Hospital Directory & Network`}
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
