import React, { useEffect, useRef, useState } from 'react';

import { Group, Trip } from '../../models';

import styles from './Sidebar.module.css';

interface Props {
  trips: Trip[];
  currentTrip: Trip;
  groups: Group[];
  currentGroup: Group | undefined;
  headline?: string;
  asideOpen: boolean;
  handleClose: () => void;
  handleGroupChange: (groupIndex: number, openGallery?: boolean) => void;
  handleTripChange: (tripIndex: number) => void;
}

export default function Sidebar({
  trips,
  currentTrip,
  groups,
  currentGroup,
  asideOpen,
  handleClose,
  handleGroupChange,
  handleTripChange,
}: Props): JSX.Element {
  const [tripListOpen, setTripListOpen] = useState(false);
  const wrapperRef = useRef<null | HTMLElement>(null);

  useEffect(() => {
    function handleClickOutside(e: Event): void {
      if (
        wrapperRef.current !== null &&
        e.target !== null &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        handleClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [wrapperRef]);

  function groupChangeHandler(groupIndex: number, openGallery?: boolean): void {
    handleGroupChange(groupIndex, openGallery);
    handleClose();
  }

  function tripChangeHandler(tripIndex: number): void {
    handleTripChange(tripIndex);
    setTripListOpen(false);
  }

  function buildGroupDescription(
    template: string | undefined,
    tokens: { [key: string]: string | number } | undefined,
  ): string {
    if (template === undefined) {
      return '';
    }

    let description = template;

    if (tokens === undefined) {
      return description;
    }

    Object.keys(tokens).forEach((key) => {
      description = description.replaceAll(`{${key}}`, `${tokens[key]}`);
    });

    return description;
  }

  const asideStyle = asideOpen ? `${styles.aside} ${styles.asideOpen}` : styles.aside;

  return (
    <aside ref={wrapperRef} className={asideStyle}>
      {currentTrip.name !== undefined && (
        <div className={styles.headline}>
          <h2>{currentTrip.name}</h2>
          {trips.length > 1 && (
            <button
              type="button"
              title="Show list of trips"
              onClick={() => setTripListOpen(!tripListOpen)}
            >
              <div></div>
            </button>
          )}
          {tripListOpen && (
            <div className={styles.tripList}>
              <ul>
                {trips.map((t, i) => (
                  <li key={i}>
                    <a onClick={() => tripChangeHandler(i)}>{t.name}</a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      <ul className={styles.list}>
        {groups.map((group, index) => {
          const listItemStyle =
            group.id === currentGroup?.id
              ? `${styles.listItem} ${styles.listItemActive}`
              : styles.listItem;

          return (
            <li key={index}>
              <a
                onClick={() => groupChangeHandler(index)}
                onKeyPress={() => groupChangeHandler(index)}
                tabIndex={0}
                role="menuitem"
                className={listItemStyle}
              >
                <div className={styles.listItemContent}>
                  <b>{group.name}</b>
                  <br />
                  <div className={styles.preformatted}>
                    {buildGroupDescription(group.description, group.metadata)}
                  </div>
                </div>
                <button
                  type="button"
                  title="Show gallery"
                  className={styles.listItemButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    groupChangeHandler(index, true);
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">
                    <path d="M512 32H160c-35.35 0-64 28.65-64 64v224c0 35.35 28.65 64 64 64H512c35.35 0 64-28.65 64-64V96C576 60.65 547.3 32 512 32zM528 320c0 8.822-7.178 16-16 16h-16l-109.3-160.9C383.7 170.7 378.7 168 373.3 168c-5.352 0-10.35 2.672-13.31 7.125l-62.74 94.11L274.9 238.6C271.9 234.4 267.1 232 262 232c-5.109 0-9.914 2.441-12.93 6.574L176 336H160c-8.822 0-16-7.178-16-16V96c0-8.822 7.178-16 16-16H512c8.822 0 16 7.178 16 16V320zM224 112c-17.67 0-32 14.33-32 32s14.33 32 32 32c17.68 0 32-14.33 32-32S241.7 112 224 112zM456 480H120C53.83 480 0 426.2 0 360v-240C0 106.8 10.75 96 24 96S48 106.8 48 120v240c0 39.7 32.3 72 72 72h336c13.25 0 24 10.75 24 24S469.3 480 456 480z" />
                  </svg>
                </button>
              </a>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
