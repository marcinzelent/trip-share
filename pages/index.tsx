import { GetStaticProps } from 'next';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { useState } from 'react';

import { Trip } from 'models';
import getTripsData from 'lib/trips';
import Sidebar from 'components/Sidebar/Sidebar';
import Gallery from 'components/Gallery/Gallery';
import styles from 'styles/Home.module.css';

interface Props {
  allTripsData: Trip[];
}

const Map = dynamic(() => import('components/Map/Map'), { ssr: false });

export default function Home({ allTripsData }: Props): JSX.Element {
  const [currentTrip, setCurrentTrip] = useState(allTripsData[0]);
  const [currentPhoto, setCurrentPhoto] = useState(null);
  const [asideOpen, setAsideOpen] = useState(false);

  function handleMarkerClick(photo: string) {
    const index = currentTrip.photos.findIndex((p) => p.name === photo);
    setCurrentPhoto(index);
  }

  function handlePhotoChange(direction: boolean): void {
    if (direction) {
      if (currentTrip.photos.length > currentPhoto + 1) {
        setCurrentPhoto(currentPhoto + 1);
      }
    } else if (currentPhoto - 1 >= 0) {
      setCurrentPhoto(currentPhoto - 1);
    }
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Trip Share</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {currentPhoto !== null && (
        <Gallery
          currentPhoto={currentTrip.photos[currentPhoto]}
          handleClose={() => setCurrentPhoto(null)}
          handlePhotoChange={handlePhotoChange}
        />
      )}

      <Sidebar
        trips={allTripsData}
        currentTrip={currentTrip}
        asideOpen={asideOpen}
        handleClose={() => setAsideOpen(false)}
        setCurrentTrip={setCurrentTrip}
      />

      <button type="button" className={styles.asideToggle} onClick={() => setAsideOpen(true)}>
        |||
      </button>

      <main className={styles.main}>
        <Map trip={currentTrip} handleMarkerClick={handleMarkerClick} />
      </main>
    </div>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const allTripsData = getTripsData();

  return {
    props: {
      allTripsData,
    },
  };
};
