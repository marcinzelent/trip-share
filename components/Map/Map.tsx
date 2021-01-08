import { LatLngBounds, DivIcon, Icon } from 'leaflet';
import { useEffect, useState } from 'react';
import ReactDom from 'react-dom/server';
import { MapContainer, Marker, TileLayer, GeoJSON, ZoomControl } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';

import { Trip, Photo } from 'models';
import { distanceBetween } from 'lib/util';

import 'leaflet/dist/leaflet.css';
import styles from './Map.module.css';

interface Props {
  trip: Trip;
  handleMarkerClick: (photo: string) => void;
}

export default function Map({ trip, handleMarkerClick }: Props): JSX.Element {
  const [map, setMap] = useState(null);

  const bounds = trip
    ? new LatLngBounds(
        [trip.track.bbox[1], trip.track.bbox[0]],
        [trip.track.bbox[3], trip.track.bbox[2]],
      )
    : new LatLngBounds([75, -145], [-52, 145]);

  function createMarkers(photos: Photo[]): JSX.Element[] {
    // cluster photos that are close to each other
    const clusters: Photo[][] = [];
    for (let i = 0; i < photos.length; i += 1) {
      if (clusters.filter((c) => c.includes(photos[i])).length === 0) {
        const cluster = [photos[i]];
        for (let j = 0; j < photos.length; j += 1) {
          if (photos[i] !== photos[j]) {
            const a = [photos[i].latitude, photos[i].longitude];
            const b = [photos[j].latitude, photos[j].longitude];
            const distance = distanceBetween(a, b);
            if (distance < 10) cluster.push(photos[j]);
          }
        }
        clusters.push(cluster);
      }
    }

    // create React elements based on the clusters
    const markers = clusters.map((cluster) => {
      let Wrapper = ({ children }) => <>{children}</>;
      if (cluster.length > 1) {
        Wrapper = ({ children }) => (
          <MarkerClusterGroup
            iconCreateFunction={(markerCluster) =>
              new DivIcon({
                html: ReactDom.renderToString(
                  <>
                    <img
                      style={{ width: 36, height: 36 }}
                      src={`data:image/jpg;base64,${cluster[0].thumbnail}`}
                      alt=""
                    />
                    <span className={styles.markerItemCount}>{markerCluster.getChildCount()}</span>
                  </>,
                ),
                iconSize: [36, 36],
                className: styles.markerIcon,
              })
            }
          >
            {children}
          </MarkerClusterGroup>
        );
      }

      const children = cluster.map((photo) => (
        <Marker
          key={photo.name}
          position={[photo.latitude, photo.longitude]}
          icon={
            new Icon({
              iconUrl: `data:image/jpg;base64,${photo.thumbnail}`,
              iconSize: [36, 36],
              className: styles.markerIcon,
            })
          }
          eventHandlers={{ click: () => handleMarkerClick(photo.name) }}
        />
      ));

      return <Wrapper key={cluster[0].name}>{children}</Wrapper>;
    });

    return markers;
  }

  useEffect(() => {
    if (map) {
      map.setView(bounds.getCenter());
      map.fitBounds(bounds);
    }
  }, [trip]);

  return (
    <MapContainer
      center={bounds.getCenter()}
      bounds={bounds}
      scrollWheelZoom
      whenCreated={setMap}
      style={{ height: '100%', width: '100%' }}
      keyboard
      zoomControl={false}
    >
      <ZoomControl position="bottomright" />
      <TileLayer
        attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {trip && <GeoJSON key={trip.name} data={trip.track} />}
      {trip && createMarkers(trip.photos)}
    </MapContainer>
  );
}
