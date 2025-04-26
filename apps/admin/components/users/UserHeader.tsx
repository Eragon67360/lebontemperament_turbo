// components/users/UserHeader.tsx
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Plus, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    <div className="relative pb-8 mb-8 border-b border-border/40">
      <div className="mx-auto">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          {/* Header Text */}
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              Gestion des Utilisateurs
            </h1>
            <p className="text-sm text-muted-foreground">
              Gérez les comptes utilisateurs et leurs permissions
            </p>
            <div className="flex gap-4 mt-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                  {pendingInvites} en attente
                </span>
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                  {approvedInvites} acceptées
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 flex-col sm:flex-row w-full sm:w-auto">
            {/* Invite Users Button */}
            <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  className="border md:border-none h-11 px-6 rounded-full hover:bg-primary/10 transition-colors justify-start sm:justify-center w-full sm:w-auto"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <UserPlus className="h-4 w-4 text-primary" />
                    </div>
                    <span>Inviter des Utilisateurs</span>
                  </div>
                </Button>
              </DialogTrigger>
            </Dialog>

            <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
              <DialogTrigger asChild>
                <Button className="h-11 px-6 rounded-full justify-start sm:justify-center w-full sm:w-auto">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-full">
                      <Plus className="h-4 w-4" />
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
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
    </div>
  );
}
