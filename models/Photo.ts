export default interface Photo {
  /**
   * Name of the photo or the file.
   */
  name: string;

  /**
   * Path to the photo.
   */
  src: string;

  /**
   * Latitude where the photo was taken.
   */
  latitude: number;

  /**
   * Logitude where the photo was taken.
   */
  longitude: number;

  /**
   * Date and time when the photo was taken.
   */
  time: string;

  /**
   * Photo thumnnail.
   */
  thumbnail: string;
}
