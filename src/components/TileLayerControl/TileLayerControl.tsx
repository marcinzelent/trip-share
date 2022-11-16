import React from 'react';
import styles from './TileLayerControl.module.css';

export enum TileLayerType {
  map,
  satellite,
}

interface Props {
  tileType: TileLayerType;
  onClick: () => void;
}

export default function TileLayerControl({ tileType, onClick }: Props): JSX.Element {
  const bgClass = tileType === TileLayerType.map ? styles.satellite : styles.map;
  return (
    <div className={`${styles.tileLayerControl} leaflet-bar`}>
      <button type="button" className={bgClass} onClick={onClick}></button>
    </div>
  );
}
