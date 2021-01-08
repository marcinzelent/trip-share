import { useEffect } from 'react';

/**
 * A hook for creating event handlers.
 */
export default function useEvent(
  event: string,
  handler: (e: KeyboardEvent | MouseEvent) => void,
  passive = false,
): void {
  useEffect(() => {
    // initiate the event handler
    window.addEventListener(event, handler, passive);

    // this will clean up the event every time the component is re-rendered
    return function cleanup() {
      window.removeEventListener(event, handler);
    };
  });
}
