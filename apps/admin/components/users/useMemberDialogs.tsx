"use client";

import { DeleteConfirmDialog } from "@/components/anniversary/DeleteConfirmDialog";
import { ChangeEmailDialog } from "@/components/users/ChangeEmailDialog";
import { EditUserDialog } from "@/components/users/EditUserDialog";
import { ProfilePictureDialog } from "@/components/users/ProfilePictureDialog";
import { RoleDialog } from "@/components/users/RoleDialog";
import {
  useDeleteUser,
  useUpdateUserDisplayName,
  useUpdateUserEmail,
  useUpdateUserRole,
} from "@/hooks/useUsers";
import type { User } from "@/types/user";
import { memberName, ROLE_LABELS, type Role } from "@/utils/members/list";
import { useState } from "react";
import { toast } from "sonner";

/**
 * The dialogs a member can be the subject of (role, name, sign-in email,
 * photo, permanent deletion), shared by the list's « ⋯ » menu and the member page. Each one
 * names the person; the API checks every rule again.
 */
export function useMemberDialogs({
  actorIsSuperAdmin,
  onDeleted,
}: {
  actorIsSuperAdmin: boolean;
  onDeleted?: (user: User) => void;
}) {
  const [roleUser, setRoleUser] = useState<User | null>(null);
  const [renameUser, setRenameUser] = useState<User | null>(null);
  const [emailUser, setEmailUser] = useState<User | null>(null);
  const [photoUser, setPhotoUser] = useState<User | null>(null);
  // Kept while the dialog closes, so its text never empties.
  const [deleting, setDeleting] = useState<User | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const updateRole = useUpdateUserRole();
  const updateName = useUpdateUserDisplayName();
  const updateEmail = useUpdateUserEmail();
  const deleteUser = useDeleteUser();

  const saveRole = async (user: User, role: Role) => {
    try {
      await updateRole.mutateAsync({ userId: user.id, role });
      toast.success(
        `${memberName(user)} est maintenant ${ROLE_LABELS[role].toLowerCase()}`,
      );
      setRoleUser(null);
    } catch (error) {
      // Shows the API's reason, e.g. a refused superadmin or self change.
      toast.error("Le rôle n’a pas été changé", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  };

  const saveName = async (userId: string, displayName: string) => {
    try {
      await updateName.mutateAsync({ userId, display_name: displayName });
      toast.success("Nom affiché enregistré");
      setRenameUser(null);
    } catch (error) {
      toast.error("Le nom n’a pas été enregistré", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  };

  // Errors stay in the dialog (it shows the API's reason, e.g. a taken address).
  const saveEmail = async (user: User, email: string) => {
    const { email: saved } = await updateEmail.mutateAsync({
      userId: user.id,
      email,
    });
    toast.success(`${memberName(user)} se connecte désormais avec ${saved}`);
    setEmailUser(null);
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await deleteUser.mutateAsync(deleting.id);
      toast.success(`Le compte de ${memberName(deleting)} est supprimé`);
      setConfirmOpen(false);
      onDeleted?.(deleting);
    } catch (error) {
      toast.error("La suppression a échoué", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  };

  const dialogs = (
    <>
      <RoleDialog
        user={roleUser}
        onOpenChange={(open) => !open && setRoleUser(null)}
        onConfirm={saveRole}
        actorIsSuperAdmin={actorIsSuperAdmin}
        isSaving={updateRole.isPending}
      />
      <EditUserDialog
        editingUser={
          renameUser
            ? { id: renameUser.id, display_name: memberName(renameUser) }
            : null
        }
        onClose={() => setRenameUser(null)}
        onSubmit={saveName}
      />
      <ChangeEmailDialog
        user={emailUser}
        onOpenChange={(open) => !open && setEmailUser(null)}
        onSubmit={saveEmail}
        isPending={updateEmail.isPending}
      />
      <ProfilePictureDialog
        userId={photoUser?.id || ""}
        currentAvatar={photoUser?.avatar}
        displayName={photoUser?.display_name || ""}
        email={photoUser?.email || ""}
        isOpen={!!photoUser}
        onOpenChange={(open) => !open && setPhotoUser(null)}
      />
      <DeleteConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={confirmDelete}
        isLoading={deleteUser.isPending}
        title={
          deleting
            ? `Supprimer définitivement le compte de ${memberName(deleting)} ?`
            : "Supprimer définitivement ce compte ?"
        }
        description="Le compte et son accès à l’espace membres et à l’application disparaissent. C’est irréversible : réservez-le aux demandes d’effacement. Si la personne figure encore dans la liste des membres, la prochaine synchronisation proposera de l’inviter à nouveau."
        confirmLabel="Supprimer définitivement"
      />
    </>
  );

  return {
    openRole: setRoleUser,
    openRename: setRenameUser,
    openEmail: setEmailUser,
    openPhoto: setPhotoUser,
    openDelete: (user: User) => {
      setDeleting(user);
      setConfirmOpen(true);
    },
    dialogs,
  };
}
