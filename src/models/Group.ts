import { FeatureCollection } from 'geojson';
import MediaItem from './MediaItem';

export default interface Group {
  /**
   * ID of the group used in URLs.
   */
  id: string;

  /**
   * Name of the group.
   */
  name?: string;

  /**
   * Description of the group.
   */

  description?: string;

  /**
   * Media in the group.
   */
  media: MediaItem[];

  /**
   * Geo data track info in GeoJSON format.
   */
  geoData?: FeatureCollection[];

  /**
   * Metadata that can be displayed in the description.
   */
  metadata?: { [key: string]: string | number };

  [key: string]: any;
}
