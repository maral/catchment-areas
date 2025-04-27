import { useEffect, useState, useRef } from "react";

export function useForwardedRef<T>(ref: React.ForwardedRef<T>) {
  const innerRef = useRef<T>(null);

  useEffect(() => {
    if (!ref) return;
    if (typeof ref === "function") {
      ref(innerRef.current);
    } else {
      ref.current = innerRef.current;
    }
  });

  return innerRef;
}

export default function useDebounceEffect(
  fn: () => any,
  delay: number,
  values: any[],
  runOnInitialize = false
) {
  const didMountRef = useRef<boolean | null>(null);

  useEffect(() => {
    if (!runOnInitialize && !didMountRef.current) {
      didMountRef.current = true;
      return;
    }

    const handler = setTimeout(() => {
      fn();
    }, delay);

    return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, values);
}
