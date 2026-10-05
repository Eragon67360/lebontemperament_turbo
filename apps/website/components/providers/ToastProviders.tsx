"use client";

import { Toast } from "@heroui/react";
import { Toaster } from "sonner";

/**
 * The two toast outlets of the site, mounted right after hydration by
 * `Providers` (next/dynamic) rather than shipped with every page's initial
 * JavaScript. HeroUI's `toast()` writes to a module-level queue, so a toast
 * fired before this mounts still shows; sonner's is only fired by user
 * actions, which never happen that early.
 */
const ToastProviders = () => (
  <>
    <Toast.Provider />
    <Toaster position="top-right" richColors />
  </>
);

export default ToastProviders;
