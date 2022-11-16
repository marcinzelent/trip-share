declare global {
  interface Document {
    webkitExitFullscreen?: () => Promise<void>;
    webkitFullscreenElement?: Element;
  }

  interface HTMLElement {
    webkitRequestFullscreen?: () => Promise<void>;
  }
}

declare module 'exif-reader';
declare module 'photoswipe-dynamic-caption-plugin';
declare module 'photoswipe-video-plugin';
