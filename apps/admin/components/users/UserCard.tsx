import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getRoleBadgeVariant, getRoleLabel } from "@/utils/roleUtils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User } from "@/types/user";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const getStatusColor = (status: string) => {
  switch (status) {
    case "en attente":
      return "bg-yellow-500";
    case "approuvé":
      return "bg-green-500";
    default:
      return "bg-gray-500";
  }
};

interface UserCardProps {
  user: User;
  currentUser: string | null;
  onEdit: (user: { id: string; display_name: string }) => void;
  onDelete: (user: User) => void;
  onRoleChange: (userId: string, newRole: "user" | "admin") => void;
}

export function UserCard({
  user,
  currentUser,
  onEdit,
  onDelete,
  onRoleChange,
}: UserCardProps) {
  return (
    <Card className="overflow-hidden rounded-2xl border-0 bg-white/50 transition-shadow hover:shadow-md dark:bg-black/50">
      <div className="p-2 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 md:flex-nowrap">
          {/* User Info Section */}
          <div className="flex items-center gap-4">
            <Avatar className="ring-border/50 size-6 ring-2 md:size-12">
              <AvatarImage src={user.avatar} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium md:text-base">
                {user.display_name?.[0] || user?.email[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-0 md:space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium md:text-base">
                  {user.display_name || user.email.split("@")[0]}
                </h3>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <div
                        className={`h-2.5 w-2.5 rounded-full ${getStatusColor(user.invite_status)}`}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Statut: {user.invite_status}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="text-muted-foreground text-xs md:text-sm">
                {user.email}
              </p>
              <p className="text-muted-foreground text-xs">
                Créé le {new Date(user.created_at).toLocaleDateString("fr-FR")}
              </p>
            </div>
          </div>

          {/* Actions Section */}
          <div className="flex w-full items-center justify-between gap-3 md:w-auto md:justify-end">
            {user.id === currentUser || user.role === "superadmin" ? (
              <Badge
                variant={getRoleBadgeVariant(user.role)}
                className="rounded-full px-4 py-1"
              >
                {getRoleLabel(user.role)}
              </Badge>
            ) : (
              <Select
                value={user.role}
                onValueChange={(value: "user" | "admin") =>
                  onRoleChange(user.id, value)
                }
              >
                <SelectTrigger className="bg-primary/5 w-fit gap-2 rounded-full border-0 text-xs md:text-sm">
                  <SelectValue>{getRoleLabel(user.role)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">{getRoleLabel("user")}</SelectItem>
                  <SelectItem value="admin">{getRoleLabel("admin")}</SelectItem>
                </SelectContent>
              </Select>
            )}

            {user.id !== currentUser && user.role !== "superadmin" && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover:bg-primary/10 rounded-full"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-[200px] rounded-xl"
                >
                  <DropdownMenuItem
                    onClick={() =>
                      onEdit({
                        id: user.id,
                        display_name:
                          user.display_name ||
                          (user.email.split("@")[0] as string),
                      })
                    }
                    className="gap-2 py-2.5"
                  >
                    <Pencil className="h-4 w-4" />
                    Modifier
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDelete(user)}
                    className="text-destructive gap-2 py-2.5"
                  >
                    <Trash2 className="h-4 w-4" />
                    Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
