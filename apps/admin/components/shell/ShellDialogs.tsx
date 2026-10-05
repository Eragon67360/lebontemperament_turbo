"use client";

import { createContext, useContext, type ReactNode } from "react";

/** The two dialogs the shell mounts once, openable from any page. */
export type ShellDialogs = {
  openMessages: () => void;
  openBugReport: () => void;
};

const noop = () => {};

const ShellDialogsContext = createContext<ShellDialogs>({
  openMessages: noop,
  openBugReport: noop,
});

export function ShellDialogsProvider({
  value,
  children,
}: {
  value: ShellDialogs;
  children: ReactNode;
}) {
  return (
    <ShellDialogsContext.Provider value={value}>
      {children}
    </ShellDialogsContext.Provider>
  );
}

/**
 * Lets a page open the shell's Messages or « Signaler un problème » dialog
 * (the home's « Lire » task). Outside the shell the calls do nothing.
 */
export function useShellDialogs(): ShellDialogs {
  return useContext(ShellDialogsContext);
}
