// components/users/UserHeader.tsx
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Plus, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardPageHeader } from "../DashboardPageHeader";

interface UserHeaderProps {
  isAddUserOpen: boolean;
  setIsAddUserOpen: (open: boolean) => void;
  isInviteOpen: boolean;
  setIsInviteOpen: (open: boolean) => void;
  pendingInvites: number;
  approvedInvites: number;
}

export function UserHeader({
  isAddUserOpen,
  setIsAddUserOpen,
  isInviteOpen,
  setIsInviteOpen,
  pendingInvites,
  approvedInvites,
}: UserHeaderProps) {
  return (
    <div className="border-border/40 relative mb-4 border-b pb-4 md:mb-8 md:pb-8">
      <div className="">
        <div className="flex flex-col items-start justify-between gap-2 md:gap-6 lg:flex-row lg:items-center">
          {/* Header Text */}
          <div className="flex flex-col gap-1 md:gap-2">
            <DashboardPageHeader
              title="Gestion des utilisateurs"
              description="Gérez les comptes utilisateurs et leurs permissions"
            />
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
                  {pendingInvites} en attente
                </span>
                <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                  {approvedInvites} acceptées
                </span>
              </div>
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            {/* Invite Users Button */}
            <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  className="hover:bg-primary/10 h-8 w-full justify-start rounded-full border px-4 text-xs transition-colors sm:w-auto sm:justify-center md:h-11 md:border-none md:px-6 md:text-base"
                >
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="bg-primary/10 rounded-full p-1 md:p-2">
                      <UserPlus className="text-primary size-3 md:size-4" />
                    </div>
                    <span>Inviter des Utilisateurs</span>
                  </div>
                </Button>
              </DialogTrigger>
            </Dialog>

            <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
              <DialogTrigger asChild>
                <Button className="h-8 w-full justify-start rounded-full px-4 text-xs sm:w-auto sm:justify-center md:h-11 md:px-6 md:text-base">
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="rounded-full bg-white/20 p-1 md:p-2">
                      <Plus className="size-3 md:size-4" />
                    </div>
                    <span>Nouvel Utilisateur</span>
                  </div>
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Optional: Subtle gradient overlay */}
      <div className="via-border/50 absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent to-transparent" />
    </div>
  );
}
