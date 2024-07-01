import { useEffect, useState, useRef } from "react";

export const useLocalStorage = (key: string, initialValue: any) => {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    const value = window.localStorage.getItem(key);
    if (value !== null) {
      setValue(JSON.parse(value));
    }
  }, [key]);

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [value, key]);

  return [value, setValue];
};

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
