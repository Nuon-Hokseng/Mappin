import * as turf from '@turf/turf';
import { MapPoint, LandMeasurements } from '@/types';

export function calculateMeasurements(points: MapPoint[]): LandMeasurements | null {
  if (points.length < 3) return null;

  // Create a closed polygon (last point must be same as first)
  const coordinates = points.map(p => [p.longitude, p.latitude]);
  coordinates.push([points[0].longitude, points[0].latitude]);

  try {
    const polygon = turf.polygon([coordinates]);

    // 1. Area in square meters
    const area = turf.area(polygon);

    // 2. Perimeter (length of the polygon)
    const line = turf.lineString(coordinates);
    const perimeter = turf.length(line, { units: 'meters' });

    // 3. Width & Height using Bounding Box (bbox)
    const bbox = turf.bbox(polygon); // [minX, minY, maxX, maxY]
    const minLng = bbox[0];
    const minLat = bbox[1];
    const maxLng = bbox[2];
    const maxLat = bbox[3];

    // Width = East-West extent
    const width = turf.distance(
      turf.point([minLng, minLat]),
      turf.point([maxLng, minLat]),
      { units: 'meters' }
    );

    // Height = North-South extent
    const height = turf.distance(
      turf.point([minLng, minLat]),
      turf.point([minLng, maxLat]),
      { units: 'meters' }
    );

    // 4. Side Lengths
    const sides: number[] = [];
    for (let i = 0; i < points.length; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length];
      const dist = turf.distance(
        turf.point([p1.longitude, p1.latitude]),
        turf.point([p2.longitude, p2.latitude]),
        { units: 'meters' }
      );
      sides.push(dist);
    }

    return {
      area,
      perimeter,
      width,
      height,
      sides,
    };
  } catch (error) {
    console.error("Invalid polygon points:", error);
    return null;
  }
}
