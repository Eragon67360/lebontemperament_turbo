"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * Which pages draw the header over a dark photo.
 *
 * The header starts solid on every page, in the server HTML and in the
 * first client render alike. A hero that really renders a dark photo under
 * it (the home, a concert story with a banner) registers after mount through
 * `useOverPhotoHero`, and the header switches to its transparent, white
 * style until the visitor scrolls past the hero. A page without such a photo
 * (`/concerts/autres`, a story without a banner) never gets the white header.
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

export function OverPhotoHeaderProvider({ children }: { children: ReactNode }) {
  // A count, not a flag: during a navigation the next page's hero can mount
  // before the previous one unmounts.
  const [photoHeroes, setPhotoHeroes] = useState(0);
  const register = useCallback(() => {
    setPhotoHeroes((count) => count + 1);
    return () => setPhotoHeroes((count) => count - 1);
  }, []);
  const value = useMemo(
    () => ({ overPhoto: photoHeroes > 0, register }),
    [photoHeroes, register],
  );

  return (
    <OverPhotoHeaderContext.Provider value={value}>
      {children}
    </OverPhotoHeaderContext.Provider>
  );
}

/** True while a hero with a dark photo is mounted under the header. */
export function useOverPhotoHeader(): boolean {
  return useContext(OverPhotoHeaderContext).overPhoto;
}

/**
 * Called by a hero with `true` only when it really renders a dark photo under
 * the header. Registers after mount, so the server HTML and the hydrating
 * render never carry the over-photo state.
 */
export function useOverPhotoHero(hasPhoto: boolean): void {
  const { register } = useContext(OverPhotoHeaderContext);

  useEffect(() => {
    if (!hasPhoto) return;
    return register();
  }, [hasPhoto, register]);
}
