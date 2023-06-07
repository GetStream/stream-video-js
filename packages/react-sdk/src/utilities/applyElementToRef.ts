import type { ForwardedRef } from 'react';

export const applyElementToRef = <T extends HTMLElement | null>(
  ref: ForwardedRef<T>,
  element: T,
) => {
  if (!ref) return;

  if (typeof ref === 'function') return ref(element);

  ref.current = element;
};
