import { useEffect, useState } from "react";

/** True after the first client effect — avoids credentialed fetches during SSR / pre-hydration. */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);
  return hydrated;
}
