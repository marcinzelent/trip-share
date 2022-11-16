import Group from './Group';

export default interface Trip {
  /**
   * ID of the trip, used internally within the application.
   */
  id: string;

  /**
   * Name of the trip, displayed to the user.
   */
  name: string;

  /**
   * Groups the trip is split into.
   */
  groups?: Group[];

  /**
   * URL to a JSON file containing data for the trip.
   */
  url: string;

  /**
   * Property indicating if the trip data has been already downloaded.
   */
  downloaded: boolean;
}
