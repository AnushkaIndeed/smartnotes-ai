import { useEffect, useState } from 'react';

export function useDebounce(value, delay = 800) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    // If value changes before delay finishes, cancel the old timer
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}