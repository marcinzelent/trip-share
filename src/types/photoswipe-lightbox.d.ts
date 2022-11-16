declare module 'photoswipe/lightbox' {
  import PhotoSwipeBase from 'photoswipe/dist/types/core/base';

  export default PhotoSwipeLightbox;
  /**
   * <T>
   */
  export type Type<T> = import('photoswipe/dist/types/types').Type<T>;
  export type PhotoSwipe = import('photoswipe/dist/types/photoswipe').default;
  export type PhotoSwipeOptions = import('photoswipe/dist/types/photoswipe').PhotoSwipeOptions;
  export type DataSource = import('photoswipe/dist/types/photoswipe').DataSource;
  export type Content = import('photoswipe/dist/types/slide/content').default;
  export type PhotoSwipeEventsMap = import('photoswipe/dist/types/core/eventable').PhotoSwipeEventsMap;
  export type PhotoSwipeFiltersMap = import('photoswipe/dist/types/core/eventable').PhotoSwipeFiltersMap;
  /**
   * <T>
   */
  export type EventCallback<T> = import('photoswipe/dist/types/core/eventable').EventCallback<T>;
  /**
   * @template T
   * @typedef {import('../types.js').Type<T>} Type<T>
   */
  /** @typedef {import('photoswipe/dist/types/photoswipe').default} PhotoSwipe */
  /** @typedef {import('photoswipe/dist/types/photoswipe').PhotoSwipeOptions} PhotoSwipeOptions */
  /** @typedef {import('photoswipe/dist/types/photoswipe').DataSource} DataSource */
  /** @typedef {import('photoswipe/dist/types/slide/content').default} Content */
  /** @typedef {import('photoswipe/dist/types/core/eventable').PhotoSwipeEventsMap} PhotoSwipeEventsMap */
  /** @typedef {import('photoswipe/dist/types/core/eventable').PhotoSwipeFiltersMap} PhotoSwipeFiltersMap */
  /**
   * @template T
   * @typedef {import('photoswipe/dist/types/core/eventable').EventCallback<T>} EventCallback<T>
   */
  /**
   * PhotoSwipe Lightbox
   *
   * - If user has unsupported browser it falls back to default browser action (just opens URL)
   * - Binds click event to links that should open PhotoSwipe
   * - parses DOM strcture for PhotoSwipe (retrieves large image URLs and sizes)
   * - Initializes PhotoSwipe
   *
   *
   * Loader options use the same object as PhotoSwipe, and supports such options:
   *
   * gallery - Element | Element[] | NodeList | string selector for the gallery element
   * children - Element | Element[] | NodeList | string selector for the gallery children
   *
   */
  declare class PhotoSwipeLightbox extends PhotoSwipeBase {
    /**
     * @param {PhotoSwipeOptions} options
     */
    constructor(options: PhotoSwipeOptions);
    _uid: number;
    /**
     * Initialize lightbox, should be called only once.
     * It's not included in the main constructor, so you may bind events before it.
     */
    init(): void;
    /**
     * @param {MouseEvent} e
     */
    onThumbnailsClick(e: MouseEvent): void;
    /**
     * Get index of gallery item that was clicked.
     *
     * @param {MouseEvent} e click event
     */
    getClickedIndex(e: MouseEvent): number;
    /**
     * Load and open PhotoSwipe
     *
     * @param {number} index
     * @param {DataSource=} dataSource
     * @param {{ x?: number; y?: number }} [initialPoint]
     */
    loadAndOpen(
      index: number,
      dataSource?: DataSource | undefined,
      initialPoint?: {
        x?: number;
        y?: number;
      },
    ): boolean;
    shouldOpen: boolean;
    /**
     * Load the main module and the slide content by index
     *
     * @param {number} index
     * @param {DataSource=} dataSource
     */
    preload(index: number, dataSource?: DataSource | undefined): void;
    _preloadedContent: import('photoswipe/dist/types/slide/content').default;
    /**
     * @private
     * @param {Type<PhotoSwipe> | { default: Type<PhotoSwipe> }} module
     * @param {number} uid
     */
    private readonly _openPhotoswipe;
    /**
     * Unbinds all events, closes PhotoSwipe if it's open.
     */
    destroy(): void;
  }
}
