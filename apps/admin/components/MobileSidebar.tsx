"use client";

import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useResetOnChange } from "@/hooks/useResetOnChange";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Menu } from "lucide-react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";

/**
 * Mobile chrome: a top bar that owns the nav trigger, so the menu button no
 * longer floats on top of page content.
 */
export function MobileSidebar({
  setMessagesDialogOpen,
  setBugReportDialogOpen,
}: {
  setMessagesDialogOpen?: (open: boolean) => void;
  setBugReportDialogOpen?: (open: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // A route change means the destination was reached: get the sheet out of the way.
  useResetOnChange([pathname], () => setOpen(false));

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 px-1 md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="shrink-0">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Ouvrir le menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="w-[19rem] border-r border-gray-200 p-0"
        >
          <SheetHeader>
            <VisuallyHidden>
              <SheetTitle>Menu de navigation</SheetTitle>
              <SheetDescription>
                Navigation principale de l&apos;application
              </SheetDescription>
            </VisuallyHidden>
          </SheetHeader>
          <Sidebar
            mobile
            onNavigate={() => setOpen(false)}
            setMessagesDialogOpen={setMessagesDialogOpen}
            setBugReportDialogOpen={setBugReportDialogOpen}
          />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 items-center gap-2">
        <Image src="/picto.svg" alt="" width={20} height={20} />
        <span className="truncate text-sm font-semibold text-gray-900">
          Le Bon Temperament
        </span>
      </div>
    </header>
  );
}
