// pages/users/index.tsx
"use client";

import { AddUserDialog } from "@/components/users/AddUserDialog";
import { UserCard } from "@/components/users/UserCard";
import { UserEmptyState } from "@/components/users/UserEmptyState";
import { UserHeader } from "@/components/users/UserHeader";
import { UserLoadingState } from "@/components/users/UserLoadingState";
import { UserSearch } from "@/components/users/UserSearch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { createClient } from "@/utils/supabase/client";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { EditUserDialog } from "@/components/users/EditUserDialog";
import { SortConfig, User } from "@/types/user";
import { InviteUserDialog } from "@/components/users/InviteUsersDialog";

export default function UsersPage() {
  // State declarations
  const [users, setUsers] = useState<User[]>([]);
  const [sortedUsers, setSortedUsers] = useState<User[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<"user" | "admin">("user");
  const [editingUser, setEditingUser] = useState<{
    id: string;
    display_name: string;
  } | null>(null);
  const [newUserDisplayName, setNewUserDisplayName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    sortBy: "created_at", // Default sort field
    sortOrder: "desc", // Default sort direction
  });
  const [searchTerm, setSearchTerm] = useState("");
  const inviteCounts = users.reduce(
    (acc, user) => {
      if (user.invite_status === "en attente") {
        acc.pending++;
      } else if (user.invite_status === "approuvé") {
        acc.approved++;
      }
      return acc;
    },
    { pending: 0, approved: 0 },
  );
  const supabase = createClient();

  const sortUsers = useCallback(
    (usersToSort: User[]) => {
      return [...usersToSort].sort((a, b) => {
        switch (sortConfig.sortBy) {
          case "invite_status":
            if (sortConfig.sortOrder === "asc") {
              return a.invite_status.localeCompare(b.invite_status);
            }
            return b.invite_status.localeCompare(a.invite_status);

          case "email":
            return sortConfig.sortOrder === "asc"
              ? a.email.localeCompare(b.email)
              : b.email.localeCompare(a.email);

          case "display_name": {
            const displayNameA = a.display_name || "";
            const displayNameB = b.display_name || "";
            return sortConfig.sortOrder === "asc"
              ? displayNameA.localeCompare(displayNameB)
              : displayNameB.localeCompare(displayNameA);
          }

          case "created_at": {
            const dateA = new Date(a.created_at).getTime();
            const dateB = new Date(b.created_at).getTime();
            return sortConfig.sortOrder === "asc"
              ? dateA - dateB
              : dateB - dateA;
          }

          default:
            return 0;
        }
      });
    },
    [sortConfig],
  );
  useEffect(() => {
    setSortedUsers(sortUsers(users));
  }, [users, sortConfig, sortUsers]);

  const getCurrentUser = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    setCurrentUser(data?.user?.id || null);
  }, [supabase]);

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const queryParams = new URLSearchParams(
        searchTerm ? { search: searchTerm } : {},
      );

      const response = await fetch(`/api/users?${queryParams}`);
      if (!response.ok) throw new Error("Failed to fetch users");

      const data = await response.json();
      setUsers(data);
    } catch (error) {
      toast.error("Erreur", {
        description: "Impossible de charger les utilisateurs.",
      });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([fetchUsers(), getCurrentUser()]);
      } catch (error) {
        setError(error instanceof Error ? error.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    const subscription = supabase
      .channel("profiles-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
        },
        () => {
          fetchData();
        },
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUsers, getCurrentUser, supabase]);

  // Search debounce effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchUsers();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, fetchUsers]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newUserEmail,
          password: newUserPassword,
          role: newUserRole,
          display_name: newUserDisplayName || newUserEmail.split("@")[0],
        }),
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Une erreur est survenue");

      toast.success("Succès", {
        description: "L'utilisateur a été créé avec succès",
      });

      // Reset form
      setIsAddUserOpen(false);
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserRole("user");
      setNewUserDisplayName("");

      await fetchUsers();
    } catch (error) {
      toast.error("Erreur", {
        description:
          error instanceof Error ? error.message : "Une erreur est survenue",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (user.role === "superadmin") {
      toast.error("Action non autorisée", {
        description: "Impossible de supprimer un super administrateur.",
      });
      return;
    }

    try {
      const response = await fetch(`/api/users?id=${user.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Une erreur est survenue");
      }

      toast.success("Succès", {
        description: "L'utilisateur a été supprimé avec succès.",
      });

      await fetchUsers();
    } catch (error) {
      toast.error("Erreur", {
        description:
          error instanceof Error ? error.message : "Une erreur est survenue",
      });
    } finally {
      setUserToDelete(null);
    }
  };

  const handleRoleChange = async (
    userId: string,
    newRole: "user" | "admin",
  ) => {
    try {
      const userToUpdate = users.find((u) => u.id === userId);
      if (userToUpdate?.role === "superadmin") {
        toast.error("Action non autorisée", {
          description:
            "Impossible de modifier le rôle d'un super administrateur.",
        });
        return;
      }

      const response = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Une erreur est survenue");
      }

      toast.success("Succès", {
        description: "Le rôle a été mis à jour avec succès.",
      });

      await fetchUsers();
    } catch (error) {
      toast.error("Erreur", {
        description:
          error instanceof Error ? error.message : "Une erreur est survenue",
      });
    }
  };

  const handleUpdateDisplayName = async (
    userId: string,
    newDisplayName: string,
  ) => {
    try {
      const response = await fetch("/api/users/display-name", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, display_name: newDisplayName }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Une erreur est survenue");
      }

      toast.success("Succès", {
        description: "Nom d'affichage mis à jour avec succès.",
      });

      setEditingUser(null);
      await fetchUsers();
    } catch (error) {
      toast.error("Erreur", {
        description:
          error instanceof Error ? error.message : "Une erreur est survenue",
      });
    }
  };

  return (
    <div className="container px-4 sm:px-6 lg:px-8 py-8">
      <UserHeader
        isAddUserOpen={isAddUserOpen}
        setIsAddUserOpen={setIsAddUserOpen}
        isInviteOpen={isInviteOpen}
        setIsInviteOpen={setIsInviteOpen}
        pendingInvites={inviteCounts.pending}
        approvedInvites={inviteCounts.approved}
      />

      <UserSearch
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        sortConfig={sortConfig}
        setSortConfig={setSortConfig}
      />

      {isLoading ? (
        <UserLoadingState />
      ) : error ? (
        <div className="text-center text-red-500 py-8">
          <p>{error}</p>
        </div>
      ) : users.length === 0 ? (
        <UserEmptyState setIsAddUserOpen={setIsAddUserOpen} />
      ) : (
        <div className="space-y-4">
          {sortedUsers.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              currentUser={currentUser}
              onEdit={setEditingUser}
              onDelete={setUserToDelete}
              onRoleChange={handleRoleChange}
            />
          ))}
        </div>
      )}

      <AddUserDialog
        isOpen={isAddUserOpen}
        onOpenChange={setIsAddUserOpen}
        onSubmit={handleAddUser}
        isProcessing={isProcessing}
        newUserEmail={newUserEmail}
        setNewUserEmail={setNewUserEmail}
        newUserPassword={newUserPassword}
        setNewUserPassword={setNewUserPassword}
        newUserRole={newUserRole}
        setNewUserRole={setNewUserRole}
        newUserDisplayName={newUserDisplayName}
        setNewUserDisplayName={setNewUserDisplayName}
      />
      <InviteUserDialog
        isOpen={isInviteOpen}
        onOpenChange={setIsInviteOpen}
        onSuccess={fetchUsers}
      />
      <EditUserDialog
        editingUser={editingUser}
        onClose={() => setEditingUser(null)}
        onSubmit={handleUpdateDisplayName}
      />
      <AlertDialog
        open={!!userToDelete}
        onOpenChange={() => setUserToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action
              est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => userToDelete && handleDeleteUser(userToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
