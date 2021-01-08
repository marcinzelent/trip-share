/**
 * Converts time in seconds to HH:mm format.
 * @param time Time to convert in seconds.
 */
export function secondsToTimeString(time: number): string {
  const h = Math.floor(time / 3600);
  const m = Math.floor((time % 3600) / 60);

  return `${h < 10 ? `0${h}` : h}:${m < 10 ? `0${m}` : m}`;
}

/**
 * Calculates distance between two geographical points.
 * @param latlng1 Coordinates of the first point.
 * @param latlng2 Coordinates of the second point.
 */
export function distanceBetween(latlng1: number[], latlng2: number[]): number {
  const R = 6371000;
  const rad = Math.PI / 180;
  const lat1 = latlng1[0] * rad;
  const lat2 = latlng2[0] * rad;
  const sinDLat = Math.sin(((latlng2[0] - latlng1[0]) * rad) / 2);
  const sinDLon = Math.sin(((latlng2[1] - latlng1[1]) * rad) / 2);
  const a = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export default { secondsToTimeString, distanceBetween };
