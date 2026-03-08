/**
 * Calculate the great-circle distance between two GPS coordinates
 * using the Haversine formula.
 *
 * @param {number} lat1 - Latitude of point 1 (degrees)
 * @param {number} lon1 - Longitude of point 1 (degrees)
 * @param {number} lat2 - Latitude of point 2 (degrees)
 * @param {number} lon2 - Longitude of point 2 (degrees)
 * @returns {number} Distance in meters
 */
const haversine = (lat1, lon1, lat2, lon2) => {
    const R = 6371000; // Earth's radius in meters
    const toRad = (deg) => (deg * Math.PI) / 180;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.asin(Math.sqrt(a));
    return R * c;
};

/**
 * Check if coordinates are within campus radius
 */
const isWithinCampus = (lat, lon) => {
    const campusLat = parseFloat(process.env.CAMPUS_LAT);
    const campusLon = parseFloat(process.env.CAMPUS_LON);
    const campusRadius = parseFloat(process.env.CAMPUS_RADIUS);

    const distance = haversine(lat, lon, campusLat, campusLon);
    return { withinCampus: distance <= campusRadius, distance: Math.round(distance) };
};

module.exports = { haversine, isWithinCampus };
