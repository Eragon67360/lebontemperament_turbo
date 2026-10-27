// The browser's answers instead of the server's: the real hooks return their
// server value (`false`) in a server render, so the controls that appear only
// after hydration (theme buttons, announcements, the AG button) would never
// be in the markup.
export function useClientValue<T>(getClientValue: () => T): T {
  return getClientValue();
}

export function useHydrated(): boolean {
  return true;
}
