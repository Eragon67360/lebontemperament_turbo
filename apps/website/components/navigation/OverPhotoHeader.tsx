"use client";

import { useHydrated } from "@/hooks/useClientValue";
import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * Which pages draw the header over a dark photo.
 *
 * A hero that really renders a dark photo under the header (the home, a
 * concert story with a banner) registers through `useOverPhotoHero`, and the
 * header switches to its transparent, white style until the visitor scrolls
 * past the hero. A page without such a photo (`/concerts/autres`, a story
 * without a banner) never gets the white header.
 *
 * Mounted heroes are only known in the browser, so the server HTML carries
 * the solid header, except where `assumeOverPhoto` says the photo is certain
 * (the home, whose photo is a static asset): that assumption stands until the
 * client has hydrated, and the registered hero takes over from there without
 * a solid frame in between. A story with a banner starts solid and switches
 * at hydration.
 */

type OverPhotoHeader = {
  overPhoto: boolean;
  /** Registers a mounted photo hero; the result unregisters it. */
  register: () => () => void;
};

// Without a provider (the pages that render no site header) the hooks are
// inert: nothing registers and the header is never over a photo.
const OverPhotoHeaderContext = createContext<OverPhotoHeader>({
  overPhoto: false,
  register: () => () => {},
});

export function OverPhotoHeaderProvider({
  children,
  assumeOverPhoto = false,
}: {
  children: ReactNode;
  /** The page is known to render a dark photo under the header. */
  assumeOverPhoto?: boolean;
}) {
  // A count, not a flag: during a navigation the next page's hero can mount
  // before the previous one unmounts.
  const [photoHeroes, setPhotoHeroes] = useState(0);
  const register = useCallback(() => {
    setPhotoHeroes((count) => count + 1);
    return () => setPhotoHeroes((count) => count - 1);
  }, []);
  // The assumption covers the server HTML and the hydrating render only.
  // Once hydrated, only mounted heroes count, so a page that renders no hero
  // at "/" (an error boundary, for instance) ends up solid.
  const hydrated = useHydrated();
  const overPhoto = hydrated ? photoHeroes > 0 : assumeOverPhoto;
  const value = useMemo(() => ({ overPhoto, register }), [overPhoto, register]);

  return (
    <OverPhotoHeaderContext.Provider value={value}>
      {children}
    </OverPhotoHeaderContext.Provider>
  );
}

/** True while the header is drawn over a dark photo. */
export function useOverPhotoHeader(): boolean {
  return useContext(OverPhotoHeaderContext).overPhoto;
}

/**
 * Called by a hero with `true` only when it really renders a dark photo under
 * the header. A layout effect, so the registration is committed before the
 * browser paints the hydrated page: the home's assumed state hands over to
 * the registered hero without a solid frame in between (a passive effect's
 * update could land in a later render than the hydrated flag).
 */
export function useOverPhotoHero(hasPhoto: boolean): void {
  const { register } = useContext(OverPhotoHeaderContext);

  useLayoutEffect(() => {
    if (!hasPhoto) return;
    return register();
  }, [hasPhoto, register]);
}
