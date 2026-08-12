import proj4 from 'proj4';

// WGS84 / UTM Zone 48N
export const SOURCE_CRS = "EPSG:32648";
// WGS84 lat/lon
export const TARGET_CRS = "EPSG:4326";

// Define the CRS in proj4 if not already built-in
proj4.defs(SOURCE_CRS, "+proj=utm +zone=48 +datum=WGS84 +units=m +no_defs");

export function convertUTMtoLatLng(easting: number, northing: number): { latitude: number, longitude: number } {
  // proj4 returns [longitude, latitude] for EPSG:4326
  const [longitude, latitude] = proj4(SOURCE_CRS, TARGET_CRS, [easting, northing]);
  return { latitude, longitude };
}

export function convertLatLngToUTM(latitude: number, longitude: number): { easting: number, northing: number } {
  const [easting, northing] = proj4(TARGET_CRS, SOURCE_CRS, [longitude, latitude]);
  return { easting, northing };
}
