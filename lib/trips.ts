import path from 'path';
import fs from 'fs';
import { DOMParser } from 'xmldom';
import { FeatureCollection, LineString } from 'geojson';
import { gpx } from '@tmcw/togeojson';
import gb from 'geojson-bounds';
import * as ExifReader from 'exifreader';
import _ from 'lodash';

import { Trip, Photo } from 'models';
import { distanceBetween } from 'lib/util';

const tripsDirectory = path.join(process.cwd(), 'trips');

// extract photo metadata from EXIF
function getPhotoMetadata(filePath: string) {
  const buffer = fs.readFileSync(filePath);
  const tags = ExifReader.load(buffer, { expanded: true });

  return {
    latitude: tags.gps.Latitude,
    longitude: tags.gps.Longitude,
    time: tags.exif.DateTime.description.replace(':', '-').replace(':', '-'),
    thumbnail: tags.Thumbnail.base64,
  };
}

/**
 * Reads GPX files and photos from trips folder.
 */
export default function getTripsData(): Trip[] {
  // get folder names under /trips
  const dirs = fs
    .readdirSync(tripsDirectory, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);
  const allTripsData = dirs.map((dir: string) => {
    const dirPath = path.join(tripsDirectory, dir);
    const files = fs.readdirSync(dirPath);

    const gpxFiles = files.filter((f) => f.endsWith('.gpx'));

    // read GPX file as string
    const fullPath = path.join(dirPath, gpxFiles[0]);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const contentsWithoutNS = fileContents.replace(/\sxmlns[^"]+"[^"]+"/g, '');

    // create DOM from string
    const doc = new DOMParser().parseFromString(contentsWithoutNS);

    // convert GPX to GeoJSON
    const track: FeatureCollection = gpx(doc);

    // add bounding box
    track.bbox = [gb.xMin(track), gb.yMin(track), gb.xMax(track), gb.yMax(track)];

    const { coordTimes } = track.features[0].properties;

    // time of the first point
    const start = coordTimes[0];

    // time of the last point
    const end = coordTimes[coordTimes.length - 1];

    // total duration in seconds
    const duration = (new Date(end).getTime() - new Date(start).getTime()) / 1000;

    // distance and speed
    let totalDistance = 0;
    const speeds = [];
    const coords = (track.features[0].geometry as LineString).coordinates;

    for (let i = 0; i < coords.length - 1; i += 1) {
      const a = [coords[i][1], coords[i][0]];
      const b = [coords[i + 1][1], coords[i + 1][0]];
      const distance = distanceBetween(a, b);
      if (distance > 0) {
        totalDistance += distance;
        const timeBetween =
          new Date(coordTimes[i + 1]).getTime() - new Date(coordTimes[i]).getTime();
        speeds.push(distance / timeBetween);
      }
    }

    // total distance in km
    const distance = Math.floor(totalDistance / 10) / 100;

    // average speed in km/h
    const speedMps = speeds.reduce((acc, val) => acc + val) / speeds.length;
    const speed = Math.floor(speedMps * 3600 * 100) / 100;

    // photos
    const photoFiles = files.filter((f) => f.endsWith('.jpg'));
    const photos: Photo[] = photoFiles.map((p) => {
      // eslint-disable-next-line global-require, import/no-dynamic-require, @typescript-eslint/no-var-requires
      const { src } = require(`trips/${dir}/${p}`);
      return {
        name: _.kebabCase(p),
        src,
        ...getPhotoMetadata(path.join(dirPath, p)),
      };
    });

    const trip: Trip = { name: dir, track, distance, start, end, duration, speed, photos };

    return trip;
  });

  // sort trips by name
  return allTripsData.sort((a, b) => {
    if (a.name < b.name) {
      return 1;
    }
    return -1;
  });
}
