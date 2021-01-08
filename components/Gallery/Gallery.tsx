import { useEffect, useRef } from 'react';

import { Photo } from 'models';
import useEvent from 'lib/useEvent';
import styles from './Gallery.module.css';

interface Props {
  currentPhoto: Photo;
  handleClose: () => void;
  handlePhotoChange: (direction: boolean) => void;
}

export default function Gallery({
  currentPhoto,
  handleClose,
  handlePhotoChange,
}: Props): JSX.Element {
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target) &&
        (e.target as Node).nodeName !== 'BUTTON'
      ) {
        handleClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [wrapperRef]);

  useEvent('keydown', (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      handlePhotoChange(false);
    } else if (e.key === 'ArrowRight') {
      handlePhotoChange(true);
    } else if (e.key === 'Escape') {
      handleClose();
    }
  });

  return (
    <div className={styles.galleryContainer} role="region">
      <button
        type="button"
        className={`${styles.arrowLeft} ${styles.btn}`}
        onClick={() => handlePhotoChange(false)}
      >
        〈
      </button>
      <div className={styles.photoContainer}>
        <img
          ref={wrapperRef}
          src={currentPhoto.src}
          alt={currentPhoto.name}
          className={styles.photo}
        />
      </div>
      <button
        type="button"
        className={`${styles.arrowRight} ${styles.btn}`}
        onClick={() => handlePhotoChange(true)}
      >
        〉
      </button>
      <button
        type="button"
        className={`${styles.closeBtn} ${styles.btn}`}
        onClick={() => handleClose()}
      >
        ×
      </button>
    </div>
  );
}
