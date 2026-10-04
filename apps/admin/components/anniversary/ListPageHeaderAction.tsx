"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

/** The one primary action of a campaign list: « Ajouter … ». */
export function AddButton({
  label,
  onClick,
  className,
}: {
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <Button onClick={onClick} className={className}>
      <Plus aria-hidden />
      {label}
    </Button>
  );
}
