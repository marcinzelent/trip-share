import { Trip, Group, MediaItem } from './index';

export function isGroup(obj: unknown): obj is Group {
  const typedObj = obj as Group;
  const isValid =
    ((typedObj !== null && typeof typedObj === 'object') || typeof typedObj === 'function') &&
    typeof typedObj.id === 'string' &&
    (typeof typedObj.name === 'undefined' || typeof typedObj.name === 'string') &&
    (typeof typedObj.description === 'undefined' || typeof typedObj.description === 'string') &&
    Array.isArray(typedObj.media) &&
    typedObj.media.every((e: any) => isMediaItem(e));

  if (!isValid) {
    throw new Error(`Invalid object: ${JSON.stringify(obj)}`);
  }

  return isValid;
}

export function isMediaItem(obj: unknown): obj is MediaItem {
  const typedObj = obj as MediaItem;
  const isValid =
    ((typedObj !== null && typeof typedObj === 'object') || typeof typedObj === 'function') &&
    typeof typedObj.name === 'string' &&
    typeof typedObj.src === 'string' &&
    typeof typedObj.type === 'string' &&
    (typedObj.type === 'photo' || typedObj.type === 'video') &&
    typeof typedObj.width === 'number' &&
    typeof typedObj.height === 'number' &&
    (typeof typedObj.latitude === 'number' || typeof typedObj.latitude === 'undefined') &&
    (typeof typedObj.longitude === 'number' || typeof typedObj.longitude === 'undefined') &&
    (typeof typedObj.time === 'undefined' || typeof typedObj.time === 'string') &&
    (typeof typedObj.thumbnail === 'string' || typeof typedObj.thumbnail === 'undefined') &&
    (typeof typedObj.caption === 'undefined' || typeof typedObj.caption === 'string');

  if (!isValid) {
    throw new Error(`Invalid object: ${JSON.stringify(obj)}`);
  }

  return isValid;
}

export function isTrip(obj: unknown): obj is Trip {
  const typedObj = obj as Trip;
  const isValid =
    ((typedObj !== null && typeof typedObj === 'object') || typeof typedObj === 'function') &&
    typeof typedObj.id === 'string' &&
    typeof typedObj.name === 'string' &&
    (typeof typedObj.groups === 'undefined' ||
      (Array.isArray(typedObj.groups) && typedObj.groups.every((e: any) => isGroup(e)))
    );

  if (!isValid) {
    throw new Error(`Invalid object: ${JSON.stringify(obj)}`);
  }

  return isValid;
}
