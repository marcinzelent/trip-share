import React, { useEffect, useState } from 'react';
import { SlideData } from 'photoswipe';
import PhotoSwipeLightbox from 'photoswipe/lightbox';
import Sidebar from './components/Sidebar/Sidebar';
import Map from './components/Map/Map';
import { createLightbox } from './components/Lightbox/Lightbox';
import { MediaType, Trip } from './models';
import { isTrip } from './models/index.guard';

import styles from './App.module.css';
import 'photoswipe/style.css';
import LoadingScreen from './components/LoadingScreen/LoadingScreen';

function App(): JSX.Element {
  const [allTrips, setAllTrips] = useState<Trip[]>([]);
  const [currentTripIndex, setCurrentTripIndex] = useState<number>(0);
  const [currentGroupIndex, setCurrentGroupIndex] = useState<number>(1);
  const [asideOpen, setAsideOpen] = useState<boolean>(false);
  const [lightbox, setLightbox] = useState<PhotoSwipeLightbox>();
  const [openLightbox, setOpenLightbox] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>();

  const currentTrip = allTrips[currentTripIndex];
  const currentGroup = currentTrip?.groups?.[currentGroupIndex];

  async function getAllTrips(): Promise<Trip[]> {
    try {
      const url = process.env.REACT_APP_DATA_URL ?? '/data/index.json';

      const res = await fetch(url);
      const data = await res.json();

      if (!Array.isArray(data) || data.length === 0) {
        return [];
      }

      data.forEach((obj) => {
        if (!isTrip(obj)) {
          throw new Error('The requested data file has incorrect structure or types.');
        }
      });

      return data;
    } catch (err) {
      setError(`An error occurred while retrieving data: "${err as string}"`);
      console.error(err);
      return [];
    }
  }

  async function getTrip(url: string): Promise<Trip | undefined> {
    try {
      if (url === undefined) {
        return;
      }

      const res = await fetch(url);
      const data: Trip = await res.json();

      if (!isTrip(data)) {
        throw new Error('The requested data file has incorrect structure or types.');
      }

      const trip = {
        ...data,
        url,
        downloaded: true,
      };

      if (data.groups !== undefined) {
        
        trip.groups = [
          {
            id: 'all',
            name: 'Show all',
            media: data.groups?.flatMap((g) => g.media),
            geoData: data.groups?.flatMap((g) => g.geoData !== undefined ? g.geoData : [])
          },
          ...data.groups,
        ];
      }

      return trip;
    } catch (err) {
      setError(`An error occurred while retrieving data: "${err as string}"`);
      console.error(err);
    }
  }

  function updateAllTrips(trips: Trip[], trip: Trip): void {
    const updatedTrips = (trips).map((t) => {
      if (t.id === trip.id) {
        t = trip;
      }

      return t;
    });

    setAllTrips(updatedTrips);
  }

  function updateUrlHash(trip: Trip): void {
    const groupId = trip.groups?.[1] !== undefined ? `/${trip.groups[1].id}` : '';
    window.location.hash = `${trip.id}${groupId}`;
  }

  async function getFirstTrip(trips: Trip[]): Promise<void> {
    const trip = await getTrip(trips[0].url);

    if (trip !== undefined) {
      updateAllTrips(trips, trip);
      updateUrlHash(trip);
    }
  }

  async function getTripFromUrlHash(trips: Trip[]): Promise<void> {
    if (window.location.hash.length === 0) {
      return await getFirstTrip(trips);
    }

    const hash = window.location.hash.endsWith('/')
      ? window.location.hash.slice(0, window.location.hash.length - 1)
      : window.location.hash;

    const [tripId, groupId] = hash.substring(1).split('/');

    const tripIndex = trips.findIndex((t) => t.id === tripId);

    if (tripIndex < 0) {
      return await getFirstTrip(trips);
    }

    const trip = await getTrip(trips[tripIndex].url);

    if (trip === undefined) {
      return await getFirstTrip(trips);
    }

    updateAllTrips(trips, trip);
    setCurrentTripIndex(tripIndex);

    const groupIndex = trip.groups?.findIndex((g) => g.id === groupId);
    if (groupIndex !== undefined && groupIndex > -1) {
      setCurrentGroupIndex(groupIndex);
    } else {
      updateUrlHash(trip);
    }
  }

  useEffect(() => {
    void getAllTrips().then(async (trips) => {
      setAllTrips(trips);
      await getTripFromUrlHash(trips);
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    if (currentTrip !== undefined && currentGroup !== undefined) {
      window.location.hash = `${currentTrip.id}/${currentGroup.id}`;
    }
  }, [currentTripIndex, currentGroupIndex]);

  useEffect(() => {
    if (lightbox !== undefined) {
      lightbox.destroy();
    }

    if (currentGroup?.media === undefined || currentGroup?.media.length === 0) {
      return;
    }

    const dataSource = currentGroup?.media.map<SlideData>((mediaItem) => {
      const slideData: SlideData = {
        width: mediaItem.width,
        height: mediaItem.height,
        alt: mediaItem.caption,
      };

      if (mediaItem.type === MediaType.Photo) {
        slideData.type = 'image';
        slideData.src = mediaItem.src;
      } else if (mediaItem.type === MediaType.Video) {
        slideData.type = 'video';
        slideData.videoSrc = mediaItem.src;
      }

      return slideData;
    });

    const lb = createLightbox(dataSource);

    lb.on('beforeOpen', () => setIsLoading(false));

    lb.init();

    if (openLightbox) {
      lb.loadAndOpen(0);
      setOpenLightbox(false);
    }

    setLightbox(lb);
  }, [currentGroup]);

  function handleMarkerClick(mediaName: string): void {
    if (currentGroup === undefined) {
      return;
    }

    const index = currentGroup.media.findIndex((p) => p.name === mediaName);
    if (index < 0) {
      lightbox?.loadAndOpen(0);
    } else {
      lightbox?.loadAndOpen(index);
    }
  }

  function handleGroupChange(groupIndex: number, openGallery?: boolean): void {
    setCurrentGroupIndex(groupIndex);

    if (openGallery ?? false) {
      setOpenLightbox(true);
    }
  }

  function handleTripChange(tripIndex: number): void {
    if (allTrips[tripIndex] === undefined) {
      return;
    }

    setIsLoading(true);

    if (!allTrips[tripIndex].downloaded) {
      void getTrip(allTrips[tripIndex].url).then((trip) => {
        if (trip === undefined) {
          return;
        }

        updateAllTrips(allTrips, trip);

        setCurrentTripIndex(tripIndex);
        setCurrentGroupIndex(1);
        setIsLoading(false);
      });
    } else {
      setCurrentTripIndex(tripIndex);
      setCurrentGroupIndex(1);
      setIsLoading(false);
    }
  }

  if (error !== undefined) {
    return <>{error}</>;
  }

  if (currentTrip === undefined || currentTrip.groups === undefined) {
    return <LoadingScreen />;
  }

  return (
    <div className={styles.container}>
      <Sidebar
        trips={allTrips}
        currentTrip={currentTrip}
        groups={currentTrip.groups}
        currentGroup={currentGroup}
        asideOpen={asideOpen}
        handleClose={() => setAsideOpen(false)}
        handleGroupChange={handleGroupChange}
        handleTripChange={handleTripChange}
      />

      <button
        type="button"
        title="Toggle sidebar menu"
        className={styles.asideToggle}
        onClick={() => setAsideOpen(true)}
      >
        <svg
          width="32"
          height="32"
          version="1.1"
          viewBox="0 0 64 64"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g strokeMiterlimit="10" strokeWidth=".4165" fill="#666">
            <rect x="8" y="16" width="48" height="6" />
            <rect x="8" y="30" width="48" height="6" />
            <rect x="8" y="44" width="48" height="6" />
          </g>
        </svg>
      </button>

      <main className={styles.main}>
        <Map group={currentGroup} handleMarkerClick={handleMarkerClick} />
      </main>
      {isLoading && <LoadingScreen />}
    </div>
  );
}

export default App;
