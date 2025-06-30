import { useRef, RefObject } from "react";

export function useScrollToBottom<T extends HTMLElement>(
  shouldPreventScroll?: boolean
): [
  RefObject<T>,
  RefObject<T>,
] {
  const containerRef = useRef<T>(null);
  const endRef = useRef<T>(null);

  // Return refs without any automatic scrolling behavior
  // Users can manually scroll to bottom if needed
  return [containerRef, endRef];
}
