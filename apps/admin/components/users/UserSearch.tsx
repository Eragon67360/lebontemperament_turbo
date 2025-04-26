import { Input } from "@/components/ui/input";
import { ArrowUpDown, Calendar, Mail, Search, User, Clock } from "lucide-react";

import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { SortConfig, SortBy } from "@/types/user";

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
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher un utilisateur..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-[200px]">
            <ArrowUpDown className="mr-2 h-4 w-4" />
            Trier par {getSortLabel(sortConfig.sortBy)}
            {sortConfig.sortOrder === "asc" ? " ↑" : " ↓"}
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
