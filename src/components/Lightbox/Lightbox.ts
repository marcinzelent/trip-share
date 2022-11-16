import { DataSource } from 'photoswipe';
import PhotoSwipeLightbox from 'photoswipe/lightbox';
import { Slide } from 'photoswipe/dist/types/slide/content';
import PhotoSwipeDynamicCaption from 'photoswipe-dynamic-caption-plugin';
import PhotoSwipeVideoPlugin from 'photoswipe-video-plugin';

import './Lightbox.css';
import 'photoswipe-dynamic-caption-plugin/photoswipe-dynamic-caption-plugin.css';

export function createLightbox(dataSource: DataSource): PhotoSwipeLightbox {
  const lb = new PhotoSwipeLightbox({
    dataSource,
    pswpModule: async () => await import('photoswipe'),
  });

  const fullscreenSVG =
    '<svg class="pswp__icn" width="26" height="22" aria-hidden="true" version="1.1" viewBox="-16 -8 26 22" xmlns="http://www.w3.org/2000/svg"><use class="pswp__icn-shadow" xlink:href="#pswp__icn-fullscreen-request"></use><use class="pswp__icn-shadow" xlink:href="#pswp__icn-fullscreen-exit"></use><path id="pswp__icn-fullscreen-request" d="m-12 10v-5h2v3h3v2zm0-14h5v2h-3v3h-2zm18 0v5h-2v-3h-3v-2zm0 14h-5v-2h3v-3h2z" style="stroke-width:1.0001"/> <path id="pswp__icn-fullscreen-exit" d="m-7 5v5h-2v-3h-3v-2zm0-4h-5v-2h3v-3h2zm8 0v-5h2v3h3v2zm0 4h5v2h-3v3h-2z" style="display:none"/></svg>';

  lb.on('uiRegister', () => {
    lb.pswp?.ui.registerElement({
      name: 'fullscreen-button',
      title: 'Toggle fullscreen',
      order: 9,
      isButton: true,
      html: fullscreenSVG,
      onClick: () => {
        toggleFullscreen();
      },
    });
  });

  // eslint-disable-next-line no-new
  new PhotoSwipeDynamicCaption(lb, {
    type: 'below',
    captionContent: (slide: Slide) => slide.data.alt,
  });

  // eslint-disable-next-line no-new
  new PhotoSwipeVideoPlugin(lb, {
    autoplay: false,
  });

  return lb;
}

interface WebkitDocument extends Document {
  webkitExitFullscreen?: () => Promise<void>;
  webkitFullscreenElement?: Element;
  [key: string]: any;
}

interface WebkitHTMLElement extends HTMLElement {
  webkitRequestFullscreen: () => Promise<void>;
  [key: string]: any;
}

interface FullscreenAPI {
  request: (element: WebkitHTMLElement) => void;
  exit: () => void;
  isFullscreen: () => boolean;
  change: string;
  error: string;
}

function getFullscreenAPI(): FullscreenAPI | undefined {
  let api;
  let enterFS = '';
  let exitFS = '';
  let elementFS = '';
  let changeEvent = '';
  let errorEvent = '';

  if (document.documentElement.requestFullscreen !== undefined) {
    enterFS = 'requestFullscreen';
    exitFS = 'exitFullscreen';
    elementFS = 'fullscreenElement';
    changeEvent = 'fullscreenchange';
    errorEvent = 'fullscreenerror';
  } else if (
    (document.documentElement as WebkitHTMLElement).webkitRequestFullscreen !== undefined
  ) {
    enterFS = 'webkitRequestFullscreen';
    exitFS = 'webkitExitFullscreen';
    elementFS = 'webkitFullscreenElement';
    changeEvent = 'webkitfullscreenchange';
    errorEvent = 'webkitfullscreenerror';
  }

  if (enterFS !== '') {
    api = {
      request: (element: WebkitHTMLElement) => {
        if (enterFS === 'webkitRequestFullscreen') {
          void element.webkitRequestFullscreen();
        } else {
          void element.requestFullscreen();
        }
      },
      exit: (): void => {
        return (document as WebkitDocument)[exitFS]();
      },
      isFullscreen: (): boolean => {
        return (document as WebkitDocument)[elementFS];
      },
      change: changeEvent,
      error: errorEvent,
    };
  }

  return api;
}

// Toggle full-screen mode function
function toggleFullscreen(): void {
  const fullscreenAPI = getFullscreenAPI();

  if (fullscreenAPI !== undefined) {
    if (fullscreenAPI.isFullscreen()) {
      // Exit full-screen mode
      fullscreenAPI.exit();
      // Toggle "Exit" and "Enter" full-screen SVG icon display
      setTimeout(function () {
        const exitIcon = document.getElementById('pswp__icn-fullscreen-exit');
        if (exitIcon !== null) {
          exitIcon.style.display = 'none';
        }

        const requestIcon = document.getElementById('pswp__icn-fullscreen-request');
        if (requestIcon !== null) {
          requestIcon.style.display = 'inline';
        }
      }, 300);
    } else {
      // Enter full-screen mode
      const pswp = document.querySelector(`.pswp`);
      if (pswp != null) {
        fullscreenAPI.request(pswp as WebkitHTMLElement);
      }
      // Toggle "Exit" and "Enter" full-screen SVG icon display
      setTimeout(function () {
        const exitIcon = document.getElementById('pswp__icn-fullscreen-exit');
        if (exitIcon !== null) {
          exitIcon.style.display = 'inline';
        }

        const requestIcon = document.getElementById('pswp__icn-fullscreen-request');
        if (requestIcon !== null) {
          requestIcon.style.display = 'none';
        }
      }, 300);
    }
  }
}
