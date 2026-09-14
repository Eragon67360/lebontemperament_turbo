// components/users/UserHeader.tsx
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

interface UserHeaderProps {
  pendingInvites: number;
  approvedInvites: number;
}

export function UserHeader({
  pendingInvites,
  approvedInvites,
}: UserHeaderProps) {
  const [isStatsOpen, setIsStatsOpen] = useState(false);

  const totalInvites = pendingInvites + approvedInvites;

  const badges = (
    <>
      <span className="rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-medium text-yellow-800">
        {pendingInvites} en attente
      </span>
      <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800">
        {approvedInvites} acceptées
      </span>
    </>
  );

  return (
    <div>
      {/* Desktop Stats - Always visible */}
      <div className="hidden flex-wrap gap-2 md:flex">{badges}</div>

      {/* Mobile Stats - Collapsible */}
      <Collapsible
        open={isStatsOpen}
        onOpenChange={setIsStatsOpen}
        className="md:hidden"
      >
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 min-h-11 px-2 text-xs text-gray-600 hover:text-gray-900"
          >
            <span>
              {totalInvites} invitation
              {totalInvites !== 1 ? "s" : ""}
            </span>
            <ChevronDown
              aria-hidden
              className={`transition-transform duration-150 ease-out ${isStatsOpen ? "rotate-180" : ""}`}
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2 flex flex-wrap gap-2">
          {badges}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
