import { useEffect, useState } from "react";

/** Prevent interactive form fallbacks before React has attached handlers. */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
