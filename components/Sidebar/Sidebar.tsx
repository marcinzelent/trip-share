import { useEffect, useRef } from 'react';

import { Trip } from 'models';
import { secondsToTimeString } from 'lib/util';

import styles from './Sidebar.module.css';

interface Props {
  trips: Trip[];
  currentTrip: Trip;
  asideOpen: boolean;
  handleClose: () => void;
  setCurrentTrip: (trip: Trip) => void;
}

export default function Sidebar({
  trips,
  currentTrip,
  asideOpen,
  handleClose,
  setCurrentTrip,
}: Props): JSX.Element {
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        handleClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [wrapperRef]);

  function handleTripChange(trip: Trip): void {
    setCurrentTrip(trip);
    handleClose();
  }

  return (
    <aside ref={wrapperRef} className={`${styles.aside} ${asideOpen && styles.asideOpen}`}>
      <h2>Trips</h2>
      <ul className={styles.list}>
        {trips.map((t) => (
          <li key={t.name}>
            <a
              onClick={() => handleTripChange(t)}
              onKeyPress={() => handleTripChange(t)}
              tabIndex={0}
              role="menuitem"
              className={`${styles.listItem} ${
                t.name === currentTrip.name && styles.listItemActive
              }`}
            >
              <b>{new Date(t.start).toDateString()}</b>
              <br />
              Total distance: {t.distance} km
              <br />
              Duration: {secondsToTimeString(t.duration)}
              <br />
              Average speed: {t.speed} km/h
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}
