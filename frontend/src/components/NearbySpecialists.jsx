import React, { useState } from 'react';
import { Compass, Eye, Star, MapPin, Phone, Navigation, Loader2, AlertCircle, RefreshCw, Building2 } from 'lucide-react';
import { getStoredApiConfig } from '../config/api';

export default function NearbySpecialists() {
  const [status, setStatus] = useState('idle'); // 'idle' | 'locating' | 'fetching' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [specialists, setSpecialists] = useState([]);

  const handleFindSpecialists = () => {
    if (!navigator.geolocation) {
      setStatus('error');
      setErrorMessage('Geolocation is not supported by your browser.');
      return;
    }

    setStatus('locating');
    setErrorMessage('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
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
            const errorData = await res.json().catch(() => null);
            throw new Error(errorData?.detail || `Server error (${res.status})`);
          }

          const data = await res.json();
          const results = data.results || [];

          setSpecialists(results);
          setStatus('success');
        } catch (err) {
          console.error('Failed to fetch nearby doctors:', err);
          setStatus('error');
          setErrorMessage(err.message || 'Unable to load nearby specialists at this time.');
        }
      },
      (geoError) => {
        setStatus('error');
        if (geoError.code === geoError.PERMISSION_DENIED) {
          setErrorMessage('Location permission was denied. Please allow location access in your browser settings to find specialists near you.');
        } else if (geoError.code === geoError.TIMEOUT) {
          setErrorMessage('Location request timed out. Please check your connection and try again.');
        } else {
          setErrorMessage('Unable to retrieve your current location. Please verify device GPS is enabled.');
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
      
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
          <Eye className="w-6 h-6" />
        </div>
        <div>
          <span className="text-[10px] font-bold text-sky-700 dark:text-sky-400 uppercase tracking-widest">
            LOCAL CLINICAL CARE
          </span>
          <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">
            Need to consult an eye specialist?
          </h3>
        </div>
      </div>

      {/* Idle State */}
      {status === 'idle' && (
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Connect with nearby ophthalmologists, eye clinics, and healthcare hospitals based on your current location.
          </p>
          <button
            onClick={handleFindSpecialists}
            className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3.5 px-4 rounded-xl text-sm transition-all flex items-center justify-center space-x-2 shadow hover:shadow-sky-500/25"
          >
            <Compass className="w-4 h-4" />
            <span>Find Nearby Eye Specialist</span>
          </button>
        </div>
      )}

      {/* Loading State */}
      {(status === 'locating' || status === 'fetching') && (
        <div className="py-6 flex flex-col items-center justify-center space-y-3 text-center">
          <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            {status === 'locating' ? 'Requesting GPS location...' : 'Searching for nearby eye specialists & clinics...'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Querying local healthcare directory within 15 km
          </p>
        </div>
      )}

      {/* Error State */}
      {status === 'error' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 flex items-start space-x-3 text-xs text-rose-800 dark:text-rose-300">
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold">Unable to find specialists</p>
              <p className="mt-0.5 leading-relaxed">{errorMessage}</p>
            </div>
          </div>
          <button
            onClick={handleFindSpecialists}
            className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold py-3 px-4 rounded-xl text-xs transition-all flex items-center justify-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
        </div>
      )}

      {/* Success State */}
      {status === 'success' && (
        <div className="space-y-4">
          {specialists.length === 0 ? (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200 space-y-2">
              <p className="font-bold">No Healthcare Facilities Found</p>
              <p className="leading-relaxed">
                No clinics or hospitals were found within 15 km of your location in the local directory. Please visit your nearest Primary Health Centre (PHC) or District Hospital for referral.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
                <span>Found {specialists.length} facility{specialists.length > 1 ? 'ies' : ''} nearby</span>
                <button
                  onClick={handleFindSpecialists}
                  className="text-sky-600 dark:text-sky-400 hover:underline flex items-center space-x-1 font-semibold"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Refresh</span>
                </button>
              </div>

              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {specialists.map((doc, idx) => (
                  <div
                    key={doc.id || idx}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3 transition-all hover:border-sky-300 dark:hover:border-sky-700"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm leading-snug">
                          {doc.name}
                        </h4>
                        {doc.address && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-start space-x-1">
                            <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400 mt-0.5" />
                            <span>{doc.address}</span>
                          </p>
                        )}
                      </div>

                      {doc.distance_km !== null && doc.distance_km !== undefined && (
                        <span className="shrink-0 bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 font-extrabold text-[11px] px-2.5 py-1 rounded-full border border-sky-200 dark:border-sky-800">
                          {doc.distance_km} km
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/80 dark:border-slate-700/60 text-xs">
                      {doc.rating !== null && doc.rating !== undefined ? (
                        <div className="flex items-center space-x-1 text-amber-500 font-bold">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span className="text-slate-800 dark:text-slate-200">{doc.rating}</span>
                          {doc.user_ratings_total !== null && doc.user_ratings_total !== undefined && (
                            <span className="text-slate-400 font-normal">({doc.user_ratings_total})</span>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center space-x-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                          <Building2 className="w-3 h-3" />
                          <span>Health Facility</span>
                        </span>
                      )}

                      <div className="flex items-center space-x-2">
                        {doc.phone_number && (
                          <a
                            href={`tel:${doc.phone_number}`}
                            className="bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 flex items-center space-x-1 transition-colors"
                          >
                            <Phone className="w-3 h-3" />
                            <span>Call</span>
                          </a>
                        )}

                        {doc.directions_url && (
                          <a
                            href={doc.directions_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-sky-600 hover:bg-sky-500 text-white font-bold px-3 py-1.5 rounded-lg flex items-center space-x-1 transition-colors shadow-sm"
                          >
                            <Navigation className="w-3 h-3" />
                            <span>Directions</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Attribution */}
              <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center pt-1">
                Directory data powered by OpenStreetMap contributors
              </p>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
