"use client";

import { PageShell } from "@/components/layouts/PageShell";
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
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AddUserDialog } from "@/components/users/AddUserDialog";
import { EditUserDialog } from "@/components/users/EditUserDialog";
import { InviteUserDialog } from "@/components/users/InviteUsersDialog";
import { ProfilePictureDialog } from "@/components/users/ProfilePictureDialog";
import { SyncUsersDialog } from "@/components/users/SyncUsersDialog";
import { UserCard } from "@/components/users/UserCard";
import { UserEmptyState } from "@/components/users/UserEmptyState";
import { UserHeader } from "@/components/users/UserHeader";
import { UserSearch } from "@/components/users/UserSearch";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  useCreateUser,
  useDeleteUser,
  useSyncUsers,
  useUpdateUserDisplayName,
  useUpdateUserRole,
  useUsers,
} from "@/hooks/useUsers";
import { SortConfig, User } from "@/types/user";
import { createClient } from "@/utils/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, RefreshCw, UserPlus, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

// --- Internal Loading Component ---
const UserGridSkeleton = () => (
  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <div
        key={i}
        className="bg-muted/40 h-[220px] w-full animate-pulse rounded-2xl border"
      />
    ))}
  </div>
);

export default function UsersPage() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  // UI State
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isSyncOpen, setIsSyncOpen] = useState(false);
  const [pendingInvitations, setPendingInvitations] = useState<
    Array<{ email: string; displayName: string }>
  >([]);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<{
    id: string;
    display_name: string;
  } | null>(null);
  const [profilePictureUser, setProfilePictureUser] = useState<User | null>(
    null,
  );
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    sortBy: "created_at",
    sortOrder: "desc",
  });
  const [searchTerm, setSearchTerm] = useState("");

  // Form state for adding users
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<"user" | "admin">("user");
  const [newUserDisplayName, setNewUserDisplayName] = useState("");

  // Debounced search term for queries
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Fetch data using hooks
  const {
    data: users = [],
    isLoading,
    error,
  } = useUsers({
    search: debouncedSearch,
  });
  const { data: currentUserData } = useCurrentUser();
  const currentUser = currentUserData?.id || null;
  const { data: syncData } = useSyncUsers();

  // Mark users that are missing in Excel
  const usersWithSyncStatus = useMemo(() => {
    if (!syncData) return users;
    const typedSyncData = syncData as {
      missingInExcel: Array<{ id: string }>;
    };
    return users.map((user) => ({
      ...user,
      isMissingInExcel: typedSyncData.missingInExcel.some(
        (m) => m.id === user.id,
      ),
    }));
  }, [users, syncData]);

  // Mutations
  const createUser = useCreateUser();
  const deleteUser = useDeleteUser();
  const updateRole = useUpdateUserRole();
  const updateDisplayName = useUpdateUserDisplayName();

  // Real-time subscription for live updates
  useEffect(() => {
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
          queryClient.invalidateQueries({ queryKey: ["users"] });
        },
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, queryClient]);

  // Sorted users - computed from query data
  const sortedUsers = useMemo(() => {
    return [...usersWithSyncStatus].sort((a, b) => {
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
          return sortConfig.sortOrder === "asc" ? dateA - dateB : dateB - dateA;
        }

        default:
          return 0;
      }
    });
  }, [usersWithSyncStatus, sortConfig]);

  // Invite counts
  const inviteCounts = useMemo(() => {
    return users.reduce(
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
  }, [users]);

  // Handlers
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createUser.mutateAsync({
        email: newUserEmail,
        password: newUserPassword,
        role: newUserRole,
        display_name: newUserDisplayName || newUserEmail.split("@")[0] || "",
      });

      toast.success("Succès", {
        description: "L'utilisateur a été créé avec succès",
      });

      setIsAddUserOpen(false);
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserRole("user");
      setNewUserDisplayName("");
    } catch (error) {
      toast.error("Erreur", {
        description:
          error instanceof Error ? error.message : "Une erreur est survenue",
      });
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
      await deleteUser.mutateAsync(user.id);
      toast.success("Utilisateur supprimé");
    } catch (error) {
      toast.error("Erreur lors de la suppression");
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
        toast.error("Impossible de modifier un superadmin");
        return;
      }
      await updateRole.mutateAsync({ userId, role: newRole });
      toast.success("Rôle mis à jour");
    } catch (error) {
      toast.error("Erreur lors de la modification du rôle");
    }
  };

  const handleUpdateDisplayName = async (
    userId: string,
    newDisplayName: string,
  ) => {
    try {
      await updateDisplayName.mutateAsync({
        userId,
        display_name: newDisplayName,
      });
      toast.success("Nom d'affichage mis à jour");
      setEditingUser(null);
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  return (
    <PageShell
      fullHeight
      theme="admin"
      className="px-4 py-8 sm:px-6 lg:px-8"
      title="Gestion des utilisateurs"
      description="Gérez les comptes utilisateurs de l'ensemble de l'équipe."
      headerAction={
        <div className="flex flex-wrap gap-2">
          {/* Sync Button */}
          <Button
            variant="outline"
            className="h-9 gap-2 shadow-sm"
            onClick={() => setIsSyncOpen(true)}
          >
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Synchroniser</span>
            {syncData &&
              (syncData.missingInDatabase.length > 0 ||
                syncData.missingInExcel.length > 0) && (
                <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-white">
                  {syncData.missingInDatabase.length +
                    syncData.missingInExcel.length}
                </span>
              )}
          </Button>

          {/* Invite Button */}
          <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-9 gap-2 shadow-sm">
                <UserPlus className="h-4 w-4" />
                <span className="hidden sm:inline">Inviter</span>
              </Button>
            </DialogTrigger>
          </Dialog>

          {/* Add User Button */}
          <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
            <DialogTrigger asChild>
              <Button className="h-9 gap-2 shadow-md transition-all hover:shadow-lg">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Nouvel utilisateur</span>
                <span className="sm:hidden">Ajouter</span>
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      }
    >
      <div className="mb-6 space-y-6">
        <UserHeader
          pendingInvites={inviteCounts.pending}
          approvedInvites={inviteCounts.approved}
        />

        <UserSearch
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          sortConfig={sortConfig}
          setSortConfig={setSortConfig}
        />
      </div>

      <ScrollArea className="h-full w-full pr-4">
        {isLoading ? (
          <UserGridSkeleton />
        ) : error ? (
          <div className="text-destructive flex h-40 flex-col items-center justify-center space-y-2">
            <Users className="h-8 w-8" />
            <p>Erreur lors du chargement des utilisateurs</p>
          </div>
        ) : users.length === 0 ? (
          <UserEmptyState setIsAddUserOpen={setIsAddUserOpen} />
        ) : (
          <div className="grid grid-cols-1 gap-4 px-1 pt-2 pb-12 md:grid-cols-2 xl:grid-cols-3">
            {sortedUsers.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                currentUser={currentUser}
                onEdit={setEditingUser}
                onDelete={setUserToDelete}
                onRoleChange={handleRoleChange}
                onProfilePicture={setProfilePictureUser}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* --- Dialogs --- */}
      <AddUserDialog
        isOpen={isAddUserOpen}
        onOpenChange={setIsAddUserOpen}
        onSubmit={handleAddUser}
        isProcessing={createUser.isPending}
        newUserEmail={newUserEmail}
        setNewUserEmail={setNewUserEmail}
        newUserPassword={newUserPassword}
        setNewUserPassword={setNewUserPassword}
        newUserRole={newUserRole}
        setNewUserRole={setNewUserRole}
        newUserDisplayName={newUserDisplayName}
        setNewUserDisplayName={setNewUserDisplayName}
      />
      <SyncUsersDialog
        isOpen={isSyncOpen}
        onOpenChange={setIsSyncOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["users"] });
          queryClient.invalidateQueries({ queryKey: ["users-sync"] });
        }}
        onPrepareInvitations={(invitations) => {
          setPendingInvitations(invitations);
          setIsSyncOpen(false);
          setIsInviteOpen(true);
        }}
      />
      <InviteUserDialog
        isOpen={isInviteOpen}
        onOpenChange={(open) => {
          setIsInviteOpen(open);
          if (!open) setPendingInvitations([]);
        }}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["users"] });
          setPendingInvitations([]);
        }}
        initialInvitations={pendingInvitations}
      />
      <EditUserDialog
        editingUser={editingUser}
        onClose={() => setEditingUser(null)}
        onSubmit={handleUpdateDisplayName}
      />
      <ProfilePictureDialog
        userId={profilePictureUser?.id || ""}
        currentAvatar={profilePictureUser?.avatar}
        displayName={profilePictureUser?.display_name || ""}
        email={profilePictureUser?.email || ""}
        isOpen={!!profilePictureUser}
        onOpenChange={(open) => !open && setProfilePictureUser(null)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["users"] });
        }}
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
              est irréversible et retirera tous les accès de ce membre.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => userToDelete && handleDeleteUser(userToDelete)}
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              Supprimer le compte
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
}
