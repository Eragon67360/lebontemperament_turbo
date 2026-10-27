"use client";

import { Toast } from "@heroui/react";

/**
 * The site's one toast outlet (HeroUI's queue), mounted right after hydration
 * by `Providers` (next/dynamic) rather than shipped with every page's initial
 * JavaScript. `toast()` writes to a module-level queue, so a toast fired
 * before this mounts still shows.
 */
const ToastProviders = () => <Toast.Provider />;

export default ToastProviders;
