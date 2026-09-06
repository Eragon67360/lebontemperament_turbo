// components/MembersFooter.tsx
"use client";
import { useMemo } from "react";
import { ThemeSwitcher } from "./ThemeSwitcher";

export const MembersFooter = () => {
  const year = useMemo(() => new Date().getFullYear(), []);

  return (
    <footer className="border-separator mx-auto flex w-full max-w-7xl items-center justify-between border-t px-4 py-3 text-xs sm:px-6 sm:text-sm lg:px-8">
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="text-foreground/70">
          ©&nbsp;{year}&nbsp;Le Bon Tempérament
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <ThemeSwitcher />
      </div>
    </footer>
  );
};
