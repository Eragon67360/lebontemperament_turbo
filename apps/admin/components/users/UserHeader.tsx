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

  return (
    <div className="mb-3 md:mb-4">
      {/* Stats - Always visible on desktop, collapsible on mobile */}
      <div>
        {/* Desktop Stats - Always visible */}
        <div className="hidden gap-2 md:flex">
          <span className="rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-medium text-yellow-800">
            {pendingInvites} en attente
          </span>
          <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800">
            {approvedInvites} acceptées
          </span>
        </div>

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
              className="h-7 px-2 text-xs text-gray-600 hover:text-gray-900"
            >
              <span className="mr-1">
                {pendingInvites + approvedInvites} invitation
                {pendingInvites + approvedInvites !== 1 ? "s" : ""}
              </span>
              <ChevronDown
                className={`h-3 w-3 transition-transform ${isStatsOpen ? "rotate-180" : ""}`}
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 flex gap-2">
            <span className="rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-medium text-yellow-800">
              {pendingInvites} en attente
            </span>
            <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800">
              {approvedInvites} acceptées
            </span>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}
