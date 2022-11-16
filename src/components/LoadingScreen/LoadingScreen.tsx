import React from 'react';
import styles from './LoadingScreen.module.css';

export default function LoadingScreen(): JSX.Element {
  return (
    <div className={styles.container}>
      <div className={styles.spinner}></div>
    </div>
  );
}
