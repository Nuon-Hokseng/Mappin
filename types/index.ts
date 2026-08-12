export type UTMCoordinate = {
  id: string;
  index: number;
  x: number; // Easting
  y: number; // Northing
};

export type MapPoint = {
  id: string;
  index: number;
  latitude: number;
  longitude: number;
};

export type LandMeasurements = {
  area: number;
  perimeter: number;
  width: number;
  height: number;
  sides: number[];
};

export type SavedProperty = {
  id: string;
  center: { latitude: number; longitude: number };
  points: MapPoint[];
  area: number;
  sides: number[];
};
