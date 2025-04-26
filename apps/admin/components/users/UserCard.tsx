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
    <Card className="backdrop-blur-xl bg-white/50 dark:bg-black/50 border-0 shadow-lg rounded-2xl overflow-hidden mb-4">
      <div className="p-6">
        <div className="flex items-center justify-between flex-wrap md:flex-nowrap gap-4">
          {/* User Info Section */}
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12 ring-2 ring-border/50">
              <AvatarImage src={user.avatar} />
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {user.display_name?.[0] || user?.email[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-medium">
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
                      <p>Status: {user.invite_status}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <p className="text-xs text-muted-foreground">
                Créé le {new Date(user.created_at).toLocaleDateString("fr-FR")}
              </p>
            </div>
          </div>

          {/* Actions Section */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
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
                <SelectTrigger className="w-[140px] rounded-full bg-primary/5 border-0">
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
                    className="rounded-full hover:bg-primary/10"
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
