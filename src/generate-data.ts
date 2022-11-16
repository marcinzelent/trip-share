import { constants as fsConstants, Dirent } from 'fs';
import { access, mkdir, readdir, readFile, writeFile } from 'fs/promises';
import { promisify } from 'util';
import path from 'path';
import exifReader from 'exif-reader';
import sizeOf from 'image-size';
import sharp from 'sharp';
import ffmpegPath from 'ffmpeg-static';
import ffprobePath from 'ffprobe-static';
import FfmpegCommand, { FfprobeData } from 'fluent-ffmpeg';
import { DOMParser } from 'xmldom';
import { FeatureCollection, LineString } from 'geojson';
import { gpx } from '@tmcw/togeojson';
import gb from 'geojson-bounds';
import { MediaItem, Group, MediaType } from './models';
import { distanceBetween, secondsToTimeString } from './lib/util';

const promisifiedSizeOf = promisify(sizeOf);

interface GroupedFiles {
  photos: Dirent[];
  videos: Dirent[];
  geoData: Dirent[];
}

interface DimensionsTuple {
  width: number;
  height: number;
}

interface FileError {
  file: string;
  error: any;
}

const failedFiles: FileError[] = [];

function setupFfmpeg(): void {
  if (ffmpegPath === null) {
    console.warn(
      'Could not use built-in FFmpeg. Make sure you have FFmpeg installed, if you want to process videos.',
    );
    return;
  }

  FfmpegCommand.setFfmpegPath(ffmpegPath);
  FfmpegCommand.setFfprobePath(ffprobePath.path);
}

function hasExtension(filename: string, acceptedExtensions: string[]): boolean {
  const index = filename.lastIndexOf('.');
  if (index < 0) {
    return false;
  }

  const extension = filename.substring(index + 1);

  return acceptedExtensions.includes(extension);
}

function hasImageExtension(filename: string): boolean {
  const acceptedExtensions = [
    'apng',
    'avif',
    'bmp',
    'dib',
    'gif',
    'jfi',
    'jfif',
    'jif',
    'jpe',
    'jpeg',
    'jpg',
    'png',
    'tif',
    'tiff',
    'webp',
  ];

  return hasExtension(filename, acceptedExtensions);
}

function hasVideoExtension(filename: string): boolean {
  const acceptedExtensions = ['avi', 'mkv', 'mov', 'mp4', 'webm'];

  return hasExtension(filename, acceptedExtensions);
}

function convertCoordinate(coordinate: number[], coordinateRef: string): number | undefined {
  if (coordinate !== undefined && coordinateRef !== undefined) {
    const ref = coordinateRef === 'N' || coordinateRef === 'E' ? 1 : -1;
    return ref * (coordinate[0] + coordinate[1] / 60 + coordinate[2] / 3600);
  }
}

async function checkIfFileExists(filepath: string): Promise<boolean> {
  try {
    await access(filepath, fsConstants.F_OK);
    return true;
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      return false;
    }

    throw err;
  }
}

function getNormalImageSize({
  width,
  height,
  orientation,
}: {
  width: number;
  height: number;
  orientation: number;
}): DimensionsTuple {
  return orientation >= 5 ? { width: height, height: width } : { width, height };
}

async function resizePhoto(
  photo: sharp.Sharp,
  filepath: string,
  orientation: number,
): Promise<DimensionsTuple> {
  const outputInfo = await photo
    .withMetadata({ orientation })
    .resize({
      width: orientation >= 5 ? 1080 : undefined,
      height: 1080,
      fit: sharp.fit.inside,
      withoutEnlargement: true,
    })
    .toFile(filepath);

  return getNormalImageSize({ ...outputInfo, orientation });
}

async function resizePhotoOrGetSize(
  photo: sharp.Sharp,
  filepath: string,
  orientation: number,
): Promise<DimensionsTuple> {
  const absolutePath = path.resolve(filepath);
  const fileExists = await checkIfFileExists(absolutePath);

  if (!fileExists) {
    console.log(`File "${absolutePath}" doesn't exist, resizing the image...`);
    return await resizePhoto(photo, absolutePath, orientation);
  }

  console.log(`File ${absolutePath} already exists, trying to get dimensions of the image...`);

  try {
    const dimensions = await promisifiedSizeOf(absolutePath);
    if (dimensions?.width !== undefined || dimensions?.height !== undefined) {
      return getNormalImageSize({
        width: dimensions.width as number,
        height: dimensions.height as number,
        orientation,
      });
    }
  } catch (err) {
    console.error(`Could not get the dimensions of the image ${absolutePath}.`);
    console.error(err);
  }

  console.log(`Trying to resize the image ${absolutePath}...`);
  return await resizePhoto(photo, absolutePath, orientation);
}

async function generateThumbnail(
  photo: sharp.Sharp,
  filepath: string,
  orientation?: number,
): Promise<void> {
  const fileExists = await checkIfFileExists(filepath);
  if (!fileExists) {
    await photo
      .withMetadata({ orientation })
      .resize({ width: 36, height: 36, withoutEnlargement: true })
      .toFile(filepath);
  }
}

async function getPhotos(
  inputDir: string,
  outputPath: string,
  serverPath: string,
  relativePath: string,
  files: Dirent[],
): Promise<MediaItem[]> {
  const photos: MediaItem[] = [];

  for (const file of files) {
    const inputFile = `${inputDir}/${file.name}`;
    const outputDir = `${outputPath}/${relativePath}`;

    try {
      // load photo using sharp
      const photo = sharp(inputFile, { failOnError: false });

      // read photo metadata
      const metadata = await photo.metadata();
      const exifData = exifReader(metadata.exif);

      // reformat EXIF coordinates to usable ones
      const latitude = convertCoordinate(exifData.gps?.GPSLatitude, exifData.gps?.GPSLatitudeRef);
      const longitude = convertCoordinate(
        exifData.gps?.GPSLongitude,
        exifData.gps?.GPSLongitudeRef,
      );

      await mkdir(outputDir, { recursive: true });

      // resize the photo or get size of existing
      const outputInfo = await resizePhotoOrGetSize(
        photo,
        `${outputDir}/${file.name}`,
        metadata.orientation ?? 1,
      );

      await generateThumbnail(photo, `${outputDir}/thumb-${file.name}`, metadata.orientation);

      photos.push({
        name: file.name,
        src: `${serverPath}/${relativePath}/${file.name}`,
        type: MediaType.Photo,
        width: outputInfo.width,
        height: outputInfo.height,
        latitude,
        longitude,
        time: exifData.exif?.DateTimeOriginal,
        thumbnail: `${serverPath}/${relativePath}/thumb-${file.name}`,
        caption: exifData.image?.ImageDescription,
      });
    } catch (err) {
      console.error(`Could not process the file ${inputFile}.`);
      console.error(err);
      failedFiles.push({ file: inputFile, error: err });
    }
  }

  return photos;
}

async function getVideoInfo(file: string): Promise<FfprobeData> {
  return await new Promise((resolve, reject) => {
    FfmpegCommand.ffprobe(file, (err, data) => {
      if (err !== undefined && err !== null) {
        return reject(err);
      }

      return resolve(data);
    });
  });
}

async function optimizeVideo(inputFile: string, outputFile: string): Promise<FfprobeData> {
  const command = FfmpegCommand(inputFile);

  return await new Promise((resolve, reject) => {
    command
      .complexFilter(["scale=-2:min'(1080,ih)'"])
      .on('progress', (progress) => {
        console.log(`Processing file ${inputFile}: ${progress.percent as number}% done`);
      })
      .on('error', (err) => reject(err))
      .on('end', () => resolve(getVideoInfo(outputFile)))
      .save(outputFile);
  });
}

async function generateVideoThumbnail(
  inputFile: string,
  outputDir: string,
  outputFileName: string,
): Promise<void> {
  const command = FfmpegCommand(inputFile);

  return await new Promise((resolve, reject) => {
    command
      .screenshots({ size: '36x36', count: 1, folder: outputDir, filename: outputFileName })
      .on('error', (err) => reject(err))
      .on('end', () => resolve());
  });
}

async function optimizeVideoOrGetInfo(inputFile: string, outputFile: string): Promise<FfprobeData> {
  const fileExists = await checkIfFileExists(outputFile);

  if (!fileExists) {
    console.log(`File "${outputFile}" doesn't exist, optimizing the video...`);
    return await optimizeVideo(inputFile, outputFile);
  }

  console.log(`File ${outputFile} already exists, trying to get info about the video...`);

  try {
    return await getVideoInfo(outputFile);
  } catch (err) {
    console.error(`Could not get the info about video ${outputFile}.`);
    console.error(err);
  }

  return await optimizeVideo(inputFile, outputFile);
}

async function processVideo(
  inputDir: string,
  outputPath: string,
  serverPath: string,
  relativePath: string,
  file: Dirent,
): Promise<MediaItem> {
  const inputFile = `${inputDir}/${file.name}`;
  const outputDir = `${outputPath}/${relativePath}`;
  const outputFileName = `${file.name.substring(0, file.name.lastIndexOf('.'))}.webm`;
  const outputFile = path.resolve(`${outputDir}/${outputFileName}`);

  try {
    await mkdir(outputDir, { recursive: true });

    // re-encode video or get info about the existing one
    const info = await optimizeVideoOrGetInfo(inputFile, outputFile);
    const videoStream = info.streams.find((s) => s.codec_type === 'video');

    // generate thumbnail
    const thumbnailFileName = `thumb-${file.name.substring(0, file.name.lastIndexOf('.'))}.jpg`;
    const thumbnailExists = await checkIfFileExists(`${outputDir}/${thumbnailFileName}`);
    if (!thumbnailExists) {
      await generateVideoThumbnail(inputFile, outputDir, thumbnailFileName);
    }

    return {
      name: outputFileName,
      src: `${serverPath}/${relativePath}/${outputFileName}`,
      type: MediaType.Video,
      width: videoStream?.width ?? 0,
      height: videoStream?.height ?? 0,
      thumbnail: `${serverPath}/${relativePath}/${thumbnailFileName}`,
    };
  } catch (err) {
    console.error(`Could not process the file ${inputFile}.`);
    console.error(err);
    failedFiles.push({ file: inputFile, error: err });
    throw err;
  }
}

async function getVideos(
  inputDir: string,
  outputPath: string,
  serverPath: string,
  relativePath: string,
  files: Dirent[],
): Promise<MediaItem[]> {
  const videos: MediaItem[] = [];

  for (const file of files) {
    const video = await processVideo(inputDir, outputPath, serverPath, relativePath, file);
    videos.push(video);
  }

  return videos;
}

async function getMedia(
  inputDir: string,
  outputPath: string,
  serverPath: string,
  relativePath: string,
  files: GroupedFiles,
): Promise<MediaItem[]> {
  const photos = await getPhotos(inputDir, outputPath, serverPath, relativePath, files.photos);
  const videos = await getVideos(inputDir, outputPath, serverPath, relativePath, files.videos);
  const media = photos.concat(videos);

  return media;
}

async function getFiles(inputDir: string): Promise<GroupedFiles> {
  console.log(`Processing files in ${inputDir} directory...`);

  const dirents = await readdir(inputDir, { withFileTypes: true });
  const files = dirents.reduce<GroupedFiles>(
    (prev, dirent) => {
      if (!dirent.isFile()) {
        return prev;
      }

      if (hasImageExtension(dirent.name)) {
        prev.photos.push(dirent);
      } else if (hasVideoExtension(dirent.name)) {
        prev.videos.push(dirent);
      } else if (hasExtension(dirent.name, ['gpx'])) {
        prev.geoData.push(dirent);
      }

      return prev;
    },
    { photos: [], videos: [], geoData: [] },
  );

  return files;
}

async function processGeoData(inputDir: string, files: Dirent[]): Promise<FeatureCollection[]> {
  const geoData: FeatureCollection[] = [];

  for (const file of files) {
    // read file contents
    const fileContents = await readFile(`${inputDir}/${file.name}`, 'utf8');
    const contentsWithoutNS = fileContents.replace(/\sxmlns[^"]+"[^"]+"/g, '');

    // create DOM from string
    const doc = new DOMParser().parseFromString(contentsWithoutNS, 'text/xml');

    // convert GPX to GeoJSON
    const track: FeatureCollection = gpx(doc);

    // add bounding box
    track.bbox = [gb.xMin(track), gb.yMin(track), gb.xMax(track), gb.yMax(track)];

    geoData.push(track);
  }

  return geoData;
}

function createMetadataFromGeoJSON(
  geoData: FeatureCollection,
): { [key: string]: string | number } | undefined {
  if (geoData === undefined) {
    return;
  }

  const coordTimes = geoData.features[0].properties?.coordinateProperties?.times;

  if (coordTimes === undefined || coordTimes?.length === 0) {
    return;
  }

  // time of the first point
  const start = coordTimes[0];

  // time of the last point
  const end = coordTimes[coordTimes.length - 1];

  // total duration in seconds
  const duration = (new Date(end).getTime() - new Date(start).getTime()) / 1000;
  const durationString = secondsToTimeString(duration);

  // distance and speed
  let totalDistance = 0;
  const speeds = [];
  const coords = (geoData.features[0].geometry as LineString).coordinates;

  for (let i = 0; i < coords.length - 1; i += 1) {
    const a = [coords[i][1], coords[i][0]];
    const b = [coords[i + 1][1], coords[i + 1][0]];
    const distance = distanceBetween(a, b);
    if (distance > 0) {
      totalDistance += distance;
      const timeBetween = new Date(coordTimes[i + 1]).getTime() - new Date(coordTimes[i]).getTime();
      speeds.push(distance / timeBetween);
    }
  }

  // total distance in km
  const distance = Math.floor(totalDistance / 10) / 100;

  // average speed in km/h
  const speedMps = speeds.reduce((acc, val) => acc + val) / speeds.length;
  const speed = Math.floor(speedMps * 3600 * 100) / 100;

  return { duration: durationString, distance, speed };
}

async function getGroups(
  inputPath: string,
  outputPath: string,
  serverPath: string,
  relativePath: string,
): Promise<Group[]> {
  const dirs = (await readdir(inputPath, { withFileTypes: true })).filter((dirent) =>
    dirent.isDirectory(),
  );

  const groups: Group[] = [];

  for (const dir of dirs) {
    const name = dir.name;
    const id = name.replaceAll(' ', '-').toLowerCase();

    const inputDir = `${inputPath}/${name}`;
    const relativeGroupPath = `${relativePath}/${id}`;

    const files = await getFiles(inputDir);

    const media = await getMedia(inputDir, outputPath, serverPath, relativeGroupPath, files);
    media.sort((a, b) => (a.name > b.name ? 1 : -1));

    const geoData = await processGeoData(inputDir, files.geoData);

    const metadata = createMetadataFromGeoJSON(geoData[0]);

    const group: Group = { id, name, media, geoData, metadata };

    if (metadata !== undefined) {
      group.description =
        'Total distance: {distance} km\nDuration: {duration}\nAverage speed: {speed} km/h';
    }

    groups.push(group);
  }

  return groups;
}

async function main(): Promise<void> {
  if (process.argv[2] === undefined || process.argv[3] === undefined) {
    console.log(
      'Usage: npx ts-node ./src/generate-data.ts [INPUT_PATH] [OUTPUT_PATH] [SERVER_PATH]',
    );
    return;
  }

  setupFfmpeg();

  const inputPath = process.argv[2];
  const outputPath = process.argv[3];
  const serverPath = process.argv[4] ?? '';

  const name = path.basename(inputPath);
  const id = name.replaceAll(' ', '-').toLowerCase();
  const groups = await getGroups(inputPath, outputPath, serverPath, id);

  const trip = { id, name, groups };
  const tripJson = JSON.stringify(trip);

  const outputDir = `${outputPath}/${id}`;
  const outputFile = `${outputDir}/index.json`;

  console.log(`Writing output to ${outputFile}...`);

  try {
    await mkdir(outputDir, { recursive: true });
    await writeFile(outputFile, tripJson);
  } catch (err) {
    console.error(err);
  }

  if (failedFiles.length > 0) {
    console.error(
      `Failed to process:\n${failedFiles
        .map((f) => `- ${f.file}\n  ${f.error as string}`)
        .join('\n')}`,
    );
  }
}

void main();
