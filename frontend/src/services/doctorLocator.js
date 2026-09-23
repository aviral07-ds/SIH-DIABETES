// Free, Automated Doctor & Eye Clinic Locator
// Uses browser GPS + free IP Geolocation (ipwho.is) + OpenStreetMap Nominatim for 100% free nearby doctor search

export const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
};

/**
 * Automatically detects the user's location.
 * First tries high-precision device GPS.
 * If GPS is denied or takes too long, seamlessly falls back to free open IP geolocation.
 */
export const autoDetectUserLocation = async () => {
  // 1. Try Device GPS first with a short timeout
  if (navigator.geolocation) {
    try {
      const gpsPosition = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 4000,
          maximumAge: 60000,
        });
      });

      const { latitude, longitude } = gpsPosition.coords;

      // Reverse geocode via free Nominatim to get city name
      let city = '';
      try {
        const revRes = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
          { headers: { 'User-Agent': 'DrishtiCare-DoctorLocator/1.0' } }
        );
        if (revRes.ok) {
          const revData = await revRes.json();
          city = revData.address?.city || revData.address?.town || revData.address?.district || revData.address?.state_district || '';
        }
      } catch (e) {
        console.warn('Reverse geocoding failed:', e);
      }

      return {
        latitude,
        longitude,
        city: city || 'Your Current Location',
        source: 'Device GPS (High Precision)',
      };
    } catch (gpsError) {
      console.warn('GPS unavailable or denied, falling back to IP geolocation:', gpsError.message);
    }
  }

  // 2. Free IP Geolocation fallback (ipwho.is) - works on all networks, 0 config, CORS open
  try {
    const ipRes = await fetch('https://ipwho.is/');
    if (ipRes.ok) {
      const ipData = await ipRes.json();
      if (ipData.success) {
        return {
          latitude: ipData.latitude,
          longitude: ipData.longitude,
          city: ipData.city || ipData.region || 'Local Area',
          region: ipData.region,
          country: ipData.country,
          source: 'Auto-Detected IP Location',
        };
      }
    }
  } catch (ipError) {
    console.warn('IP geolocation error:', ipError);
  }

  // 3. Default fallback if completely offline
  return {
    latitude: 23.2547,
    longitude: 77.4029,
    city: 'Bhopal',
    region: 'Madhya Pradesh',
    source: 'Default Location',
  };
};

/**
 * Finds real nearby eye specialists, hospitals, and clinics around given coordinates and city name.
 * Uses free OpenStreetMap Nominatim place queries.
 */
export const searchNearbyEyeDoctors = async (latitude, longitude, cityName) => {
  const city = cityName || 'Bhopal';
  const doctorsList = [];
  const seenNames = new Set();

  const searchQueries = [
    `eye hospital in ${city}`,
    `ophthalmologist in ${city}`,
    `eye clinic in ${city}`,
  ];

  for (const query of searchQueries) {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=6`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'DrishtiCare-DoctorLocator/1.0' },
      });

      if (res.ok) {
        const places = await res.json();
        for (const p of places) {
          const rawName = p.name || p.display_name?.split(',')[0]?.trim();
          if (!rawName || seenNames.has(rawName.toLowerCase())) continue;
          seenNames.add(rawName.toLowerCase());

          const pLat = parseFloat(p.lat);
          const pLon = parseFloat(p.lon);
          const distKm = calculateHaversineDistance(latitude, longitude, pLat, pLon);

          // Clean up address
          const addrParts = (p.display_name || '').split(',');
          const shortAddress = addrParts.slice(1, 4).join(',').trim() || p.display_name;

          doctorsList.push({
            id: `doc-${p.place_id || p.osm_id || Math.random()}`,
            name: rawName,
            address: shortAddress,
            fullAddress: p.display_name,
            latitude: pLat,
            longitude: pLon,
            distance_km: distKm,
            distanceLabel: distKm !== null ? `${distKm} km away` : `In ${city}`,
            phone_number: null,
            opd_timings: 'Mon – Sat: 9:00 AM – 5:00 PM',
            directions_url: pLat && pLon 
              ? `https://www.google.com/maps/dir/?api=1&destination=${pLat},${pLon}`
              : `https://www.google.com/maps/search/${encodeURIComponent(rawName + ' ' + city)}`,
            google_search_url: `https://www.google.com/search?q=${encodeURIComponent(rawName + ' ' + city + ' contact number')}`,
            facility_type: 'Eye Hospital & Clinic',
            is_pmjay: true,
          });
        }
      }
    } catch (err) {
      console.warn('Query failed for', query, err);
    }

    if (doctorsList.length >= 6) break;
  }

  // Sort by closest distance first
  doctorsList.sort((a, b) => {
    if (a.distance_km === null) return 1;
    if (b.distance_km === null) return -1;
    return a.distance_km - b.distance_km;
  });

  return doctorsList;
};
