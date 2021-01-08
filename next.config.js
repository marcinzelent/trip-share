/* eslint-disable @typescript-eslint/no-var-requires */
const withPlugins = require('next-compose-plugins');
const optimizedImages = require('next-optimized-images');
// eslint-disable-next-line import/no-extraneous-dependencies
const sharp = require('responsive-loader/sharp');

module.exports = withPlugins(
  [
    [
      optimizedImages,
      {
        defaultImageLoader: 'responsive-loader',
        handleImages: ['jpeg', 'png', 'svg', 'webp', 'gif'],
        optimizeImages: true,
        optimizeImagesInDev: true,
        responsive: {
          adapter: sharp,
          quality: 75,
          size: 1920,
        },
      },
    ],
  ],
  {
    webpack: (config) => {
      config.module.rules.push({
        test: /\.gpx/,
        use: 'raw-loader',
      });

      return config;
    },
  },
);
