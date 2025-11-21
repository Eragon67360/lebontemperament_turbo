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
import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";
import { useState } from "react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

export function MobileSidebar({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          className={cn("fixed top-2 left-2 z-40 md:hidden", className)}
          size="icon"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Ouvrir le menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 border-r border-gray-200 p-0">
        <SheetHeader>
          <VisuallyHidden>
            <SheetTitle>Menu de navigation</SheetTitle>
            <SheetDescription>
              Navigation principale de l'application
            </SheetDescription>
          </VisuallyHidden>
        </SheetHeader>
        <Sidebar mobile onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
