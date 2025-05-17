import { MembersFooter } from "@/components/MembersFooter";
import React from "react";

export default function layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative h-screen w-screen bg-background dark:bg-neutral-900 flex flex-col items-center justify-center p-2">
      <div className="grow flex-1">{children}</div>
      <MembersFooter />
    </div>
  );
}
