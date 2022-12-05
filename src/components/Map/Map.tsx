import { LatLngBounds, Icon, MarkerCluster, DivIcon } from 'leaflet';
import React, { useMemo, useState } from 'react';
import ReactDom from 'react-dom/server';
import { GeoJSON, MapContainer, Marker, TileLayer, ZoomControl, useMap } from 'react-leaflet';

import { Group, MediaItem } from '../../models';
import MarkerClusterGroup from '../../lib/MarkerClusterGroup';

import 'leaflet/dist/leaflet.css';
import styles from './Map.module.css';
import TileLayerControl, { TileLayerType } from '../TileLayerControl/TileLayerControl';
import ReactLeafletControl from '../ReactLeafletControl/ReactLeafletControl';
import { LineString } from 'geojson';

interface Props {
  group: Group | undefined;
  handleMarkerClick: (photo: string) => void;
}

export default function Map({ group, handleMarkerClick }: Props): JSX.Element {
  const [tileLayer, setTileLayer] = useState<TileLayerType>(TileLayerType.map);

  const displayedMedia = useMemo(() => {
    if (group?.media !== undefined) {
      return group.media.filter(
        (p) =>
          p.latitude !== undefined &&
          p.latitude !== null &&
          !isNaN(p.latitude) &&
          p.latitude !== 0 &&
          p.longitude !== undefined &&
          p.longitude !== null &&
          !isNaN(p.longitude) &&
          p.longitude !== 0 &&
          p.longitude !== 0,
      );
    }

    return [];
  }, [group]);

  const bounds = useMemo(() => {
    if (group === undefined || (group.geoData === undefined && displayedMedia.length === 0)) {
      return new LatLngBounds([75, -145], [-52, 145]);
    }

    const latitudes = displayedMedia.map((p) => p.latitude) as number[];
    const longitudes = displayedMedia.map((p) => p.longitude) as number[];

    group.geoData?.forEach((data) => {
      if (data.bbox !== undefined) {
        latitudes.push(data.bbox[1]);
        latitudes.push(data.bbox[3]);
        longitudes.push(data.bbox[0]);
        longitudes.push(data.bbox[2]);
      }
    });

    const minLatitude = Math.min(...latitudes);
    const minLongitude = Math.min(...longitudes);
    const maxLatitude = Math.max(...latitudes);
    const maxLongitude = Math.max(...longitudes);

    return new LatLngBounds([minLatitude, minLongitude], [maxLatitude, maxLongitude]);
  }, [group]);

  function getClusterGroupIcon(markerCluster: MarkerCluster): DivIcon {
    const iconUrl = markerCluster
      .getAllChildMarkers()
      .filter(
        (m) =>
          m.getIcon().options.iconUrl !== `${process.env.PUBLIC_URL}/icons/thumb-placeholder.png`,
      )[0]
      .getIcon().options.iconUrl;

    return new DivIcon({
      html: ReactDom.renderToString(
        <>
          <img style={{ width: 36, height: 36 }} src={iconUrl} alt="" />
          <span className={styles.markerItemCount}>{markerCluster.getChildCount()}</span>
        </>,
      ),
      iconSize: [36, 36],
      className: styles.markerIcon,
    });
  }

  function createMarkers(media: MediaItem[]): JSX.Element {
    if (media.length === 0) {
      return <></>;
    }

    return (
      <MarkerClusterGroup iconCreateFunction={getClusterGroupIcon}>
        {media.map((mediaItem, index) => (
          <Marker
            key={index}
            position={[mediaItem.latitude as number, mediaItem.longitude as number]}
            icon={
              new Icon({
                iconUrl:
                  mediaItem.thumbnail ?? `${process.env.PUBLIC_URL}/icons/thumb-placeholder.png`,
                iconSize: [36, 36],
                className: styles.markerIcon,
              })
            }
            eventHandlers={{ click: () => handleMarkerClick(mediaItem.name) }}
          />
        ))}
      </MarkerClusterGroup>
    );
  }

  const mapBounds = useMemo(() => {
    function MapBounds({ bounds }: { bounds: LatLngBounds }): JSX.Element {
      const map = useMap();

      if (map !== undefined) {
        map.setView(bounds.getCenter());
        map.fitBounds(bounds, { padding: [40, 40] });
      }

      return <></>;
    }

    return <MapBounds bounds={bounds} />;
  }, [group]);

  return (
    <MapContainer
      bounds={bounds}
      scrollWheelZoom
      style={{ height: '100%', width: '100%' }}
      keyboard
      zoomControl={false}
    >
      <>
        <ReactLeafletControl position="bottomleft">
          <TileLayerControl
            key="tile-layer-control"
            tileType={tileLayer}
            onClick={() =>
              setTileLayer(
                tileLayer === TileLayerType.map ? TileLayerType.satellite : TileLayerType.map,
              )
            }
          />
        </ReactLeafletControl>
        {tileLayer === TileLayerType.map ? (
          <TileLayer
            key="tile-layer"
            attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxNativeZoom={19}
            maxZoom={19}
          />
        ) : (
          <TileLayer
            key="tile-layer-satellite"
            attribution='&copy; <a href="https://google.com/">Google</a>'
            url="https://{s}.google.com/kh/v=930?x={x}&amp;y={y}&amp;z={z}"
            subdomains={['khms0', 'khms1', 'khms2', 'khms3']}
            maxNativeZoom={21}
            maxZoom={21}
          />
        )}
        <ZoomControl key="zoom-control" position="bottomright" />
        {mapBounds}
        {createMarkers(displayedMedia)}
        {group?.geoData?.map((data, i) => {
          const coordinates = (data.features?.[0]?.geometry as LineString).coordinates;
          const startCoords = coordinates[0].slice(0, 2).reverse();
          const finishCoords = coordinates[coordinates.length - 1].slice(0, 2).reverse();

          return (
            <React.Fragment key={i}>
              <GeoJSON key={`geodata-${group.id}-${i}`} data={data} />
              <Marker
                key={`start-marker-${group.id}-${i}`}
                position={startCoords as [number, number]}
                icon={
                  new Icon({
                    iconUrl: `${process.env.PUBLIC_URL}/icons/start.png`,
                    className: styles.iconShadow,
                  })
                }
              />
              <Marker
                key={`finish-marker-${group.id}-${i}`}
                position={finishCoords as [number, number]}
                icon={
                  new Icon({
                    iconUrl: `${process.env.PUBLIC_URL}/icons/finish.png`,
                    className: styles.iconShadow,
                  })
                }
              />
            </React.Fragment>
          );
        })}
      </>
    </MapContainer>
  );
}
