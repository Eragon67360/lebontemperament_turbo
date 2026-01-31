import { Input } from "@/components/ui/input";
import { ArrowUpDown, Calendar, Clock, Mail, Search, User } from "lucide-react";

import { SortBy, SortConfig } from "@/types/user";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

// components/users/UserSearch.tsx
interface UserSearchProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  sortConfig: SortConfig;
  setSortConfig: React.Dispatch<React.SetStateAction<SortConfig>>; // Modified this line
}
export function UserSearch({
  searchTerm,
  setSearchTerm,
  sortConfig,
  setSortConfig,
}: UserSearchProps) {
  const toggleSort = (field: SortBy) => {
    setSortConfig((current: SortConfig) => ({
      sortBy: field,
      sortOrder:
        current.sortBy === field && current.sortOrder === "asc"
          ? ("desc" as const)
          : ("asc" as const),
    }));
  };

  return (
    <div className="mb-2 flex flex-col gap-2 sm:flex-row md:mb-4 md:gap-3">
      <div className="relative flex-1">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          placeholder="Rechercher un utilisateur..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-9 pl-9"
        />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-9 w-full justify-start sm:w-[180px]"
          >
            <ArrowUpDown className="mr-2 h-3.5 w-3.5" />
            <span className="truncate">
              {getSortLabel(sortConfig.sortBy)}
              {sortConfig.sortOrder === "asc" ? " ↑" : " ↓"}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[200px]">
          <DropdownMenuItem onClick={() => toggleSort("invite_status")}>
            <Clock className="mr-2 h-4 w-4" />
            Statut
            {sortConfig.sortBy === "invite_status" && (
              <span className="ml-auto">
                {sortConfig.sortOrder === "asc" ? "↑" : "↓"}
              </span>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => toggleSort("email")}>
            <Mail className="mr-2 h-4 w-4" />
            Email
            {sortConfig.sortBy === "email" && (
              <span className="ml-auto">
                {sortConfig.sortOrder === "asc" ? "↑" : "↓"}
              </span>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => toggleSort("display_name")}>
            <User className="mr-2 h-4 w-4" />
            Nom d&apos;affichage
            {sortConfig.sortBy === "display_name" && (
              <span className="ml-auto">
                {sortConfig.sortOrder === "asc" ? "↑" : "↓"}
              </span>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => toggleSort("created_at")}>
            <Calendar className="mr-2 h-4 w-4" />
            Date de création
            {sortConfig.sortBy === "created_at" && (
              <span className="ml-auto">
                {sortConfig.sortOrder === "asc" ? "↑" : "↓"}
              </span>
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// Helper function to get sort field labels
function getSortLabel(sortBy: SortBy): string {
  switch (sortBy) {
    case "email":
      return "email";
    case "display_name":
      return "nom";
    case "created_at":
      return "date";
    case "invite_status":
      return "statut";
    default:
      return sortBy;
  }
}
