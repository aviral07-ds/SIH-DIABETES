"""Routes for finding nearby eye specialists, ophthalmologists, and eye clinics via OpenStreetMap (Overpass API)."""

import json
import math
import re
import urllib.error
import urllib.parse
import urllib.request

from fastapi import APIRouter, HTTPException, Query, status

doctor_router = APIRouter(tags=["doctors"])

# Public Overpass API mirrors for high availability
OVERPASS_API_SERVERS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://lz4.overpass-api.de/api/interpreter",
]
USER_AGENT = "SIH-Diabetes-Doctor-Finder/1.0 (OpenStreetMap Integration)"

# Terms identifying dedicated eye-care, ophthalmology clinics, and retinal centers
EYE_CARE_KEYWORDS = [
    r"\beye\b",
    r"\beyes\b",
    r"\bophthalm\w*",
    r"\bretina\w*",
    r"\bvision\b",
    r"\bnetra\w*",
    r"\bdrishti\w*",
    r"\bdrasti\w*",
    r"\boptom\w*",
    r"\bcornea\w*",
    r"\blasik\b",
    r"\bcataract\w*",
]
EYE_REGEX = re.compile("|".join(EYE_CARE_KEYWORDS), re.IGNORECASE)


def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great-circle distance between two points on the Earth in kilometers."""
    r = 6371.0  # Earth's mean radius in km
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (
        math.sin(d_lat / 2.0) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lon / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(r * c, 1)


def is_eye_care_facility(tags: dict, name: str) -> bool:
    """Determine whether an OSM element explicitly represents an eye-care or ophthalmology provider."""
    # Check explicit OSM healthcare tag
    healthcare_tag = tags.get("healthcare", "").lower()
    if healthcare_tag in {"ophthalmologist", "ophthalmology", "optometrist"}:
        return True

    # Check explicit OSM specialty tags
    speciality_tag = (
        tags.get("healthcare:speciality", "")
        or tags.get("speciality", "")
        or tags.get("medical_system:speciality", "")
    ).lower()
    if "ophthalmology" in speciality_tag or "eye" in speciality_tag:
        return True

    # Check clinic or hospital name for eye-care keywords
    if EYE_REGEX.search(name):
        return True

    return False


def build_overpass_query(lat: float, lng: float, radius: int) -> str:
    """Build a fast Overpass QL query retrieving ophthalmologists, eye clinics, and healthcare facilities."""
    return f"""
    [out:json][timeout:10];
    (
      node["healthcare"="ophthalmologist"](around:{radius},{lat},{lng});
      node["healthcare:speciality"~"ophthalmology",i](around:{radius},{lat},{lng});
      node["healthcare"="optometrist"](around:{radius},{lat},{lng});
      way["healthcare"="ophthalmologist"](around:{radius},{lat},{lng});
      way["healthcare:speciality"~"ophthalmology",i](around:{radius},{lat},{lng});
      node["amenity"="hospital"](around:{min(radius, 8000)},{lat},{lng});
      node["amenity"="clinic"](around:{min(radius, 8000)},{lat},{lng});
      node["amenity"="doctors"](around:{min(radius, 8000)},{lat},{lng});
      way["amenity"="hospital"](around:{min(radius, 8000)},{lat},{lng});
    );
    out center 35;
    """


@doctor_router.get("/nearby-doctors")
def get_nearby_doctors(
    lat: float = Query(..., description="Patient latitude (-90 to 90)"),
    lng: float = Query(..., description="Patient longitude (-180 to 180)"),
    radius: int = Query(15000, ge=500, le=50000, description="Search radius in meters"),
) -> dict:
    """Find nearby eye specialists, ophthalmology clinics, or fallback health facilities using OpenStreetMap."""
    if not (-90.0 <= lat <= 90.0):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Latitude must be between -90 and 90 degrees.",
        )
    if not (-180.0 <= lng <= 180.0):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Longitude must be between -180 and 180 degrees.",
        )

    query_str = build_overpass_query(lat, lng, radius)
    encoded_data = urllib.parse.urlencode({"data": query_str}).encode("utf-8")

    payload = None
    last_error = None

    # Try mirrors in sequence for resilient uptime
    for server_url in OVERPASS_API_SERVERS:
        try:
            req = urllib.request.Request(
                server_url,
                data=encoded_data,
                headers={
                    "Content-Type": "application/x-www-form-urlencoded",
                    "User-Agent": USER_AGENT,
                },
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=10) as response:
                payload = json.loads(response.read().decode("utf-8"))
                if payload is not None:
                    break
        except Exception as error:
            last_error = error
            continue

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail=f"OpenStreetMap directory service is temporarily busy. Please retry in a few moments. ({last_error})",
        )

    raw_elements = payload.get("elements", [])
    if not raw_elements:
        return {"status": "success", "source": "OpenStreetMap", "count": 0, "results": []}

    seen_keys = set()
    eye_care_results = []
    fallback_generic_results = []

    for elem in raw_elements:
        tags = elem.get("tags", {})
        elem_id = str(elem.get("id"))

        # Extract coordinates (node lat/lon or way center)
        dest_lat = elem.get("lat") or elem.get("center", {}).get("lat")
        dest_lng = elem.get("lon") or elem.get("center", {}).get("lon")

        # Resolve primary name
        name = (
            tags.get("name")
            or tags.get("name:en")
            or tags.get("operator")
            or tags.get("official_name")
        )
        if not name:
            facility_type = tags.get("healthcare") or tags.get("amenity") or "Health Facility"
            name = f"{facility_type.replace('_', ' ').title()} (Local Clinic)"

        # Deduplicate facilities sharing close proximity and similar name
        dedup_key = f"{name.lower().strip()}_{round(dest_lat, 3) if dest_lat else 0}_{round(dest_lng, 3) if dest_lng else 0}"
        if dedup_key in seen_keys:
            continue
        seen_keys.add(dedup_key)

        # Assemble address from OSM address tags
        address_components = [
            tags.get("addr:full")
            or (
                f"{tags.get('addr:housenumber', '')} {tags.get('addr:street', '')}".strip()
                if tags.get("addr:street")
                else ""
            ),
            tags.get("addr:suburb") or tags.get("addr:district"),
            tags.get("addr:city") or tags.get("addr:town") or tags.get("addr:village"),
            tags.get("addr:postcode"),
        ]
        address = ", ".join([comp for comp in address_components if comp])
        if not address and tags.get("addr:street"):
            address = tags.get("addr:street")

        # Phone number
        phone = (
            tags.get("phone")
            or tags.get("contact:phone")
            or tags.get("mobile")
            or tags.get("contact:mobile")
            or None
        )

        # Calculate Haversine distance
        distance_km = None
        if dest_lat is not None and dest_lng is not None:
            distance_km = calculate_haversine_distance(lat, lng, dest_lat, dest_lng)

        # Build directions URL
        if dest_lat is not None and dest_lng is not None:
            directions_url = f"https://www.google.com/maps/dir/?api=1&destination={dest_lat},{dest_lng}"
        else:
            directions_url = f"https://www.openstreetmap.org/search?query={urllib.parse.quote(name)}"

        item_data = {
            "id": elem_id,
            "name": name,
            "rating": None,
            "user_ratings_total": None,
            "address": address or "Address details in local health registry",
            "distance_km": distance_km,
            "phone_number": phone,
            "directions_url": directions_url,
        }

        if is_eye_care_facility(tags, name):
            eye_care_results.append(item_data)
        else:
            fallback_generic_results.append(item_data)

    # Sort each list by closest distance first
    eye_care_results.sort(
        key=lambda item: item["distance_km"] if item["distance_km"] is not None else float("inf")
    )
    fallback_generic_results.sort(
        key=lambda item: item["distance_km"] if item["distance_km"] is not None else float("inf")
    )

    # Prioritize dedicated eye-care facilities.
    # Generic hospitals/clinics are only included as fallback if no eye-care facilities were found in range.
    if eye_care_results:
        final_results = eye_care_results[:10]
    else:
        final_results = fallback_generic_results[:10]

    return {
        "status": "success",
        "source": "OpenStreetMap",
        "count": len(final_results),
        "results": final_results,
    }
