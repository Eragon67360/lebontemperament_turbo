import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { User } from "@/types/user";
import { getRoleLabel } from "@/utils/roleUtils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Image as ImageIcon,
  MoreVertical,
  Pencil,
  Shield,
  Trash2,
} from "lucide-react";

interface UserCardProps {
  user: User;
  currentUser: string | null;
  onEdit: (user: { id: string; display_name: string }) => void;
  onDelete: (user: User) => void;
  onRoleChange: (userId: string, newRole: "user" | "admin") => void;
  onProfilePicture?: (user: User) => void;
}

export function UserCard({
  user,
  currentUser,
  onEdit,
  onDelete,
  onRoleChange,
  onProfilePicture,
}: UserCardProps) {
  const isPending = user.invite_status === "en attente";
  const isCurrentUser = user.id === currentUser;
  const isSuperAdmin = user.role === "superadmin";

  return (
    <Card
      className={cn(
        "group bg-card hover:border-primary/50 relative flex flex-col overflow-hidden rounded-xl border transition-all duration-300 hover:scale-[1.01] hover:shadow-md",
        user.isMissingInExcel && "border-orange-200 bg-orange-50/30",
      )}
    >
      {/* Alert Strip if Missing in Excel */}
      {user.isMissingInExcel && (
        <div className="flex w-full items-center justify-center gap-2 bg-orange-100 py-1.5 text-xs font-medium text-orange-700">
          <AlertTriangle className="h-3 w-3" />
          <span>Non trouvé dans Excel</span>
        </div>
      )}

      <div className="flex h-full flex-col p-3 sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-start gap-3 sm:gap-4">
            {/* Avatar with Status Badge */}
            <div className="relative">
              <Avatar className="border-background h-14 w-14 border-2 shadow-sm transition-transform group-hover:scale-105">
                <AvatarImage src={user.avatar} className="object-cover" />
                <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                  {user.display_name?.[0]?.toUpperCase() ||
                    user.email[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "border-background absolute -right-0.5 -bottom-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2",
                        isPending ? "bg-amber-400" : "bg-emerald-500",
                      )}
                    >
                      {isPending ? (
                        <Clock className="h-3 w-3 text-white" />
                      ) : (
                        <CheckCircle2 className="h-3 w-3 text-white" />
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="capitalize">
                      Statut: {user.invite_status || "Inconnu"}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* User Info */}
            <div className="min-w-0 flex-1 space-y-1 overflow-hidden">
              <div className="flex min-w-0 items-center gap-2">
                <h3
                  className="min-w-0 truncate font-semibold text-gray-900"
                  title={user.display_name || user.email.split("@")[0]}
                >
                  {user.display_name || user.email.split("@")[0]}
                </h3>
                {isCurrentUser && (
                  <Badge
                    variant="secondary"
                    className="h-5 shrink-0 px-1.5 text-[10px]"
                  >
                    Moi
                  </Badge>
                )}
              </div>
              <p
                className="text-muted-foreground truncate text-sm"
                title={user.email}
              >
                {user.email}
              </p>
              <div className="text-muted-foreground/80 flex items-center gap-1.5 pt-1 text-xs">
                <Calendar className="h-3 w-3" />
                <span>
                  Inscrit le{" "}
                  {format(new Date(user.created_at), "dd MMM yyyy", {
                    locale: fr,
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Action Menu - shrink-0 keeps button top-right regardless of name length */}
          {!isCurrentUser && !isSuperAdmin && (
            <div className="shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:bg-muted h-8 w-8"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" collisionPadding={16}>
                  <DropdownMenuItem
                    onClick={() =>
                      onEdit({
                        id: user.id,
                        display_name:
                          user.display_name || user.email.split("@")[0] || "",
                      })
                    }
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Modifier le nom
                  </DropdownMenuItem>
                  {onProfilePicture && (
                    <DropdownMenuItem onClick={() => onProfilePicture(user)}>
                      <ImageIcon className="mr-2 h-4 w-4" />
                      Photo de profil
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => onDelete(user)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        {/* Footer: Role Management */}
        <div className="mt-4 flex items-center justify-between border-t pt-3">
          <div className="flex items-center gap-2">
            <Shield className="text-muted-foreground h-3.5 w-3.5" />
            <span className="text-muted-foreground text-xs font-medium">
              Rôle
            </span>
          </div>

          {isCurrentUser || isSuperAdmin ? (
            <Badge
              variant="outline"
              className={cn(
                "px-2.5 py-0.5 text-xs font-medium",
                user.role === "superadmin"
                  ? "border-purple-200 bg-purple-50 text-purple-700"
                  : user.role === "admin"
                    ? "border-blue-200 bg-blue-50 text-blue-700"
                    : "border-gray-200 bg-gray-50 text-gray-700",
              )}
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
              <SelectTrigger className="bg-secondary/50 hover:bg-secondary h-7 w-[100px] border-none px-2 text-xs font-medium">
                <SelectValue>{getRoleLabel(user.role)}</SelectValue>
              </SelectTrigger>
              <SelectContent collisionPadding={16}>
                <SelectItem value="user">{getRoleLabel("user")}</SelectItem>
                <SelectItem value="admin">{getRoleLabel("admin")}</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>
    </Card>
  );
}
