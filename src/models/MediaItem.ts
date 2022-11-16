import MediaType from "./MediaType";

export default interface MediaItem {
  /**
   * Name of the media item or the file.
   */
  name: string;

  /**
   * Path to the media item.
   */
  src: string;

  /**
   * Type of the media item. Can be a "photo" or a "video".
   */
  type: MediaType;

  /**
   * Width of the media item in pixels.
   */
  width: number;

  /**
   * Height of the media item in pixels.
   */
  height: number;

  /**
   * Latitude where the media item was taken.
   */
  latitude?: number;

  /**
   * Logitude where the media item was taken.
   */
  longitude?: number;

  /**
   * Date and time when the media item was taken.
   */
  time?: string;

  /**
   * Media item thumbnail.
   */
  thumbnail?: string;

  /**
   * Caption on the media item.
   */
  caption?: string;
}
