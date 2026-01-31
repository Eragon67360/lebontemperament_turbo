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
import { User } from "@/types/user";
import { getRoleLabel } from "@/utils/roleUtils";
import {
  AlertTriangle,
  Image,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";

const getStatusColor = (status: string) => {
  switch (status) {
    case "en attente":
      return "bg-yellow-500";
    case "approuvé":
      return "bg-green-500";
    default:
      return "bg-gray-300";
  }
};

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
  return (
    <Card className="transition-all">
      <div className="border-destructive flex flex-col gap-4 border p-2 sm:flex-row sm:items-center sm:justify-between md:p-4">
        {/* User Info Section */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="h-10 w-10 border border-gray-200">
              <AvatarImage src={user.avatar} />
              <AvatarFallback className="bg-gray-50 text-sm font-medium text-gray-600">
                {user.display_name?.[0] || user?.email[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={`absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-2 border-white ${getStatusColor(user.invite_status)}`}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Statut: {user.invite_status}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-sm font-medium text-gray-900">
                {user.display_name || user.email.split("@")[0]}
              </h3>
              {user.isMissingInExcel && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Cet utilisateur n&apos;est pas dans la liste Excel</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <p className="truncate text-xs text-gray-500">{user.email}</p>
            <p className="mt-0.5 text-xs text-gray-400">
              Ajouté le {new Date(user.created_at).toLocaleDateString("fr-FR")}
            </p>
          </div>
        </div>

        {/* Actions Section */}
        <div className="flex items-center justify-between gap-3 sm:justify-end">
          {user.id === currentUser || user.role === "superadmin" ? (
            <Badge
              variant="outline"
              className="border-gray-200 bg-gray-50 font-normal text-gray-600"
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
              <SelectTrigger className="h-8 w-27.5 border-gray-200 bg-white text-xs">
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
                  className="h-8 w-8 text-gray-400 hover:text-gray-600"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={() =>
                    onEdit({
                      id: user.id,
                      display_name:
                        user.display_name ||
                        (user.email.split("@")[0] as string),
                    })
                  }
                  className="gap-2 text-xs"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Modifier
                </DropdownMenuItem>
                {onProfilePicture && (
                  <DropdownMenuItem
                    onClick={() => onProfilePicture(user)}
                    className="gap-2 text-xs"
                  >
                    <Image className="h-3.5 w-3.5" />
                    Photo de profil
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => onDelete(user)}
                  className="gap-2 text-xs text-red-600 focus:text-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </Card>
  );
}
