import { GeoJsonObject } from 'geojson';
import Photo from './Photo';

export default interface Trip {
  /**
   * Name of the trip.
   */
  name: string;

  /**
   * Total distance made during the trip.
   */
  distance: number;

  /**
   * Date and time of the beginning of the trip.
   * This property is a string because Date is not serializable in Next.js.
   */
  start: string;

  /**
   * Date and time of the end of the trip.
   * This property is a string because Date is not serializable in Next.js.
   */
  end: string;

  /**
   * Total duration of the trip in seconds.
   */
  duration: number;

  /**
   * Average speed in km/h.
   */
  speed: number;

  /**
   * GeoJSON object representing waypoints of the trip
   */
  track: GeoJsonObject;

  /**
   * Photos taken during the trip.
   */
  photos: Photo[];
}
