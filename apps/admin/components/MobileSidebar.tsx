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
          className={cn("md:hidden fixed top-4 left-4 z-40", className)}
        >
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-72">
        <SheetHeader>
          <VisuallyHidden>
            <SheetTitle>Nav Content</SheetTitle>
            <SheetDescription className="flex items-center flex-col justify-between h-[300px]">
              {/* Descrciption Logic */}
            </SheetDescription>
          </VisuallyHidden>
        </SheetHeader>
        <Sidebar mobile onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
