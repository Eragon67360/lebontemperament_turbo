"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDeleteUser, useSyncUsers } from "@/hooks/useUsers";
import {
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Trash2,
  UserPlus,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface SyncUsersDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  onPrepareInvitations?: (
    invitations: Array<{ email: string; displayName: string }>,
  ) => void;
}

interface SyncData {
  missingInDatabase: Array<{
    name: string;
    email: string;
    address: string;
    homePhone: string;
    mobilePhone: string;
    voice: string;
  }>;
  missingInExcel: Array<{
    id: string;
    email: string;
    display_name: string | null;
    invite_status: string;
  }>;
  matched: number;
  duplicates: Array<{
    email: string;
    entries: Array<{
      name: string;
      email: string;
      address: string;
      homePhone: string;
      mobilePhone: string;
      voice: string;
    }>;
  }>;
  withoutEmail: Array<{
    name: string;
    address: string;
    homePhone: string;
    mobilePhone: string;
    voice: string;
  }>;
}

export function SyncUsersDialog({
  isOpen,
  onOpenChange,
  onSuccess,
  onPrepareInvitations,
}: SyncUsersDialogProps) {
  const { data: syncData, isLoading, refetch } = useSyncUsers();
  const typedSyncData = syncData as SyncData | undefined;
  const deleteUser = useDeleteUser();
  const [selectedMissingUsers, setSelectedMissingUsers] = useState<string[]>(
    [],
  );
  const [selectedUsersToDelete, setSelectedUsersToDelete] = useState<string[]>(
    [],
  );
  const [selectedAcceptedUsersToDelete, setSelectedAcceptedUsersToDelete] =
    useState<string[]>([]);
  const [isSyncingData, setIsSyncingData] = useState(false);
  const [activeTab, setActiveTab] = useState("invite");

  // Split missingInExcel into two categories based on invite_status
  const pendingUsersNotInExcel =
    typedSyncData?.missingInExcel.filter(
      (u) =>
        u.invite_status?.toLowerCase() === "pending" ||
        u.invite_status?.toLowerCase() === "en attente" ||
        u.invite_status?.toLowerCase() === "en_attente" ||
        !u.invite_status ||
        u.invite_status === "",
    ) || [];

  const acceptedUsersNotInExcel =
    typedSyncData?.missingInExcel.filter(
      (u) =>
        u.invite_status?.toLowerCase() === "accepted" ||
        u.invite_status?.toLowerCase() === "accepté" ||
        u.invite_status?.toLowerCase() === "accepte",
    ) || [];

  const handleSelectAllMissing = () => {
    if (
      selectedMissingUsers.length === typedSyncData?.missingInDatabase.length
    ) {
      setSelectedMissingUsers([]);
    } else {
      setSelectedMissingUsers(
        typedSyncData?.missingInDatabase.map((m) => m.email) || [],
      );
    }
  };

  const handleSelectAllToDelete = () => {
    if (selectedUsersToDelete.length === pendingUsersNotInExcel.length) {
      setSelectedUsersToDelete([]);
    } else {
      setSelectedUsersToDelete(pendingUsersNotInExcel.map((u) => u.id) || []);
    }
  };

  const handleSelectAllAcceptedToDelete = () => {
    if (
      selectedAcceptedUsersToDelete.length === acceptedUsersNotInExcel.length
    ) {
      setSelectedAcceptedUsersToDelete([]);
    } else {
      setSelectedAcceptedUsersToDelete(
        acceptedUsersNotInExcel.map((u) => u.id) || [],
      );
    }
  };

  const handleDeleteUsers = async () => {
    const allUsersToDelete = [
      ...selectedUsersToDelete,
      ...selectedAcceptedUsersToDelete,
    ];

    if (allUsersToDelete.length === 0) {
      toast.error("Aucun utilisateur sélectionné");
      return;
    }

    try {
      // Delete users one by one
      for (const userId of allUsersToDelete) {
        await deleteUser.mutateAsync(userId);
      }

      toast.success("Suppression réussie", {
        description: `${allUsersToDelete.length} utilisateur(s) supprimé(s)`,
      });
      setSelectedUsersToDelete([]);
      setSelectedAcceptedUsersToDelete([]);
      refetch();
      onSuccess?.();
    } catch (error) {
      toast.error("Erreur", {
        description:
          error instanceof Error
            ? error.message
            : "Erreur lors de la suppression",
      });
    }
  };

  const handleSyncAllData = async () => {
    setIsSyncingData(true);
    try {
      const response = await fetch("/api/users/sync-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: [] }), // Empty array = sync all users
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to sync data");
      }

      const result = await response.json();
      const parts: string[] = [];
      if (result.updated > 0) {
        parts.push(`${result.updated} mis à jour`);
      }
      if (result.unchanged > 0) {
        parts.push(
          `${result.unchanged} inchangé${result.unchanged > 1 ? "s" : ""}`,
        );
      }
      if (result.skipped > 0) {
        parts.push(`${result.skipped} ignoré${result.skipped > 1 ? "s" : ""}`);
      }

      toast.success("Synchronisation réussie", {
        description:
          parts.length > 0
            ? parts.join(", ")
            : "Aucune modification nécessaire",
      });
      refetch();
      onSuccess?.();
    } catch (error) {
      toast.error("Erreur", {
        description:
          error instanceof Error
            ? error.message
            : "Erreur lors de la synchronisation",
      });
    } finally {
      setIsSyncingData(false);
    }
  };

  // Determine which tab to show first
  const getDefaultTab = () => {
    if (!typedSyncData) return "invite";
    if (typedSyncData.missingInDatabase.length > 0) return "invite";
    if (pendingUsersNotInExcel.length > 0 || acceptedUsersNotInExcel.length > 0)
      return "delete";
    if ((typedSyncData.duplicates?.length ?? 0) > 0) return "duplicates";
    if ((typedSyncData.withoutEmail?.length ?? 0) > 0) return "no-email";
    return "sync";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-[95vw] max-w-[95vw] flex-col sm:w-full sm:max-w-[95vw] lg:max-w-[90vw] xl:max-w-[85vw] 2xl:max-w-[80vw]">
        <DialogHeader className="shrink-0 pb-2 sm:pb-4">
          <DialogTitle className="text-sm sm:text-lg">
            Synchronisation avec la liste Excel
          </DialogTitle>
          <DialogDescription className="hidden text-xs sm:block sm:text-sm">
            Gérez la synchronisation entre la base de données et la liste Excel.
            Utilisez les onglets pour naviguer entre les différentes actions.
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : typedSyncData ? (
            <Tabs
              defaultValue={getDefaultTab()}
              value={activeTab}
              onValueChange={setActiveTab}
              className="flex min-h-0 flex-1 flex-col"
            >
              <TabsList className="flex min-h-fit w-full flex-1 grow flex-wrap gap-1 sm:grid sm:grid-cols-5">
                <TabsTrigger
                  value="invite"
                  className="relative !min-w-20 flex-1 shrink-0 text-xs sm:flex-none sm:text-sm"
                >
                  <span className="truncate">Inviter</span>
                  {typedSyncData.missingInDatabase.length > 0 && (
                    <span className="ml-1.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-500 text-xs font-medium text-white sm:ml-2">
                      {typedSyncData.missingInDatabase.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="delete"
                  className="relative !min-w-20 flex-1 text-xs sm:flex-none sm:text-sm"
                >
                  <span className="truncate">Supprimer</span>
                  {pendingUsersNotInExcel.length +
                    acceptedUsersNotInExcel.length >
                    0 && (
                    <span className="ml-1.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white sm:ml-2">
                      {pendingUsersNotInExcel.length +
                        acceptedUsersNotInExcel.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="sync"
                  className="relative !min-w-20 flex-1 text-xs sm:flex-none sm:text-sm"
                >
                  <span className="truncate">Synchroniser</span>
                </TabsTrigger>
                <TabsTrigger
                  value="duplicates"
                  className="relative !min-w-20 flex-1 text-xs sm:flex-none sm:text-sm"
                >
                  <span className="truncate">Doublons</span>
                  {(typedSyncData.duplicates?.length ?? 0) > 0 && (
                    <span className="ml-1.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-yellow-500 text-xs font-medium text-white sm:ml-2">
                      {typedSyncData.duplicates?.length ?? 0}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="no-email"
                  className="relative !min-w-20 flex-1 text-xs sm:flex-none sm:text-sm"
                >
                  <span className="truncate">Sans email</span>
                  {(typedSyncData.withoutEmail?.length ?? 0) > 0 && (
                    <span className="ml-1.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-500 text-xs font-medium text-white sm:ml-2">
                      {typedSyncData.withoutEmail?.length ?? 0}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              {/* Tab 1: Invite Missing Users */}
              <TabsContent
                value="invite"
                className="flex min-h-0 flex-1 flex-col space-y-2 overflow-hidden sm:space-y-4"
              >
                {typedSyncData.missingInDatabase.length > 0 ? (
                  <>
                    <div className="rounded-lg border border-orange-200 bg-orange-50 p-2 sm:p-4">
                      <div className="flex items-center gap-1.5 sm:gap-3 md:items-start">
                        <UserPlus className="h-3.5 w-3.5 shrink-0 text-orange-600 sm:h-5 sm:w-5" />
                        <div className="min-w-0 flex-1">
                          <h3 className="text-xs font-semibold text-orange-900 sm:text-sm">
                            Membres à inviter
                          </h3>
                          <p className="mt-0.5 hidden text-xs text-orange-700 sm:mt-1 sm:block">
                            {typedSyncData.missingInDatabase.length} membre(s)
                            présent(s) dans Excel mais absent(s) de la base de
                            données. Sélectionnez ceux que vous souhaitez
                            inviter. Les informations seront pré-remplies depuis
                            Excel.
                          </p>
                          <p className="mt-0.5 text-[10px] text-orange-700 sm:hidden">
                            {typedSyncData.missingInDatabase.length} membre(s) à
                            inviter
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-gray-700 sm:text-sm">
                        {selectedMissingUsers.length} sélectionné(s)
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSelectAllMissing}
                        className="h-7 text-[10px] sm:h-8 sm:text-xs"
                      >
                        {selectedMissingUsers.length ===
                        typedSyncData.missingInDatabase.length
                          ? "Tout désélectionner"
                          : "Tout sélectionner"}
                      </Button>
                    </div>

                    <ScrollArea className="max-h-100 min-h-30 flex-1 overflow-y-auto rounded-lg border border-gray-200 sm:max-h-125 sm:min-h-50">
                      <div className="space-y-0.5 p-1 sm:space-y-1 sm:p-2">
                        {typedSyncData.missingInDatabase.map(
                          (
                            member: { name: string; email: string },
                            index: number,
                          ) => {
                            const isSelected = selectedMissingUsers.includes(
                              member.email,
                            );
                            return (
                              <div
                                key={index}
                                className={`flex cursor-pointer items-center justify-between rounded-md p-2 transition-colors sm:p-3 ${
                                  isSelected
                                    ? "border border-blue-200 bg-blue-50"
                                    : "hover:bg-gray-50"
                                }`}
                                onClick={() => {
                                  if (isSelected) {
                                    setSelectedMissingUsers(
                                      selectedMissingUsers.filter(
                                        (e) => e !== member.email,
                                      ),
                                    );
                                  } else {
                                    setSelectedMissingUsers([
                                      ...selectedMissingUsers,
                                      member.email,
                                    ]);
                                  }
                                }}
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="truncate text-xs font-medium text-gray-900 sm:text-sm">
                                    {member.name}
                                  </div>
                                  <div className="truncate text-[10px] text-gray-500 sm:text-xs">
                                    {member.email}
                                  </div>
                                </div>
                                {isSelected && (
                                  <CheckCircle2 className="ml-1 h-4 w-4 shrink-0 text-blue-600 sm:ml-2 sm:h-5 sm:w-5" />
                                )}
                              </div>
                            );
                          },
                        )}
                      </div>
                    </ScrollArea>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <CheckCircle2 className="h-12 w-12 text-green-500" />
                    <p className="mt-4 text-sm font-medium text-gray-900">
                      Aucun membre à inviter
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Tous les membres de la liste Excel sont déjà dans la base
                      de données.
                    </p>
                  </div>
                )}
              </TabsContent>

              {/* Tab 2: Delete Users Not in Excel */}
              <TabsContent
                value="delete"
                className="flex min-h-0 flex-1 flex-col space-y-2 overflow-hidden sm:space-y-4"
              >
                {pendingUsersNotInExcel.length > 0 ||
                acceptedUsersNotInExcel.length > 0 ? (
                  <div className="flex min-h-0 flex-1 flex-col space-y-6 overflow-y-auto">
                    {/* Section 1: Pending users not in Excel */}
                    {pendingUsersNotInExcel.length > 0 && (
                      <div className="flex min-h-0 flex-1 flex-col space-y-2 rounded-lg border border-red-200 bg-red-50/30 p-3 sm:space-y-4 sm:p-4">
                        <div className="rounded-lg border-2 border-red-300 bg-red-50 p-2 sm:p-4">
                          <div className="flex items-center gap-1.5 sm:gap-3 md:items-start">
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-red-600 sm:h-5 sm:w-5" />
                            <div className="min-w-0 flex-1">
                              <h3 className="text-xs font-semibold text-red-900 sm:text-sm">
                                Utilisateurs en attente à supprimer
                              </h3>
                              <p className="mt-0.5 hidden text-xs text-red-700 sm:mt-1 sm:block">
                                {pendingUsersNotInExcel.length} utilisateur(s)
                                présent(s) en base de données avec le statut
                                &quot;en attente&quot; mais absent(s) de la
                                liste Excel. Sélectionnez ceux que vous
                                souhaitez supprimer s&apos;ils ne sont plus
                                membres.
                              </p>
                              <p className="mt-0.5 text-[10px] text-red-700 sm:hidden">
                                {pendingUsersNotInExcel.length} utilisateur(s)
                                en attente à supprimer
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <p className="text-xs font-medium text-gray-700 sm:text-sm">
                            {selectedUsersToDelete.length} sélectionné(s)
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSelectAllToDelete}
                            className="h-7 text-[10px] sm:h-8 sm:text-xs"
                          >
                            {selectedUsersToDelete.length ===
                            pendingUsersNotInExcel.length
                              ? "Tout désélectionner"
                              : "Tout sélectionner"}
                          </Button>
                        </div>

                        <ScrollArea className="max-h-75 min-h-25 flex-1 overflow-y-auto rounded-lg border border-red-200 sm:max-h-100 sm:min-h-37.5">
                          <div className="space-y-0.5 p-1 sm:space-y-1 sm:p-2">
                            {pendingUsersNotInExcel.map(
                              (user: {
                                id: string;
                                email: string;
                                display_name: string | null;
                                invite_status: string;
                              }) => {
                                const isSelected =
                                  selectedUsersToDelete.includes(user.id);
                                return (
                                  <div
                                    key={user.id}
                                    className={`flex cursor-pointer items-center gap-1.5 rounded-md p-2 transition-colors sm:gap-3 sm:p-3 ${
                                      isSelected
                                        ? "border border-red-200 bg-red-50"
                                        : "hover:bg-gray-50"
                                    }`}
                                    onClick={() => {
                                      if (isSelected) {
                                        setSelectedUsersToDelete(
                                          selectedUsersToDelete.filter(
                                            (id) => id !== user.id,
                                          ),
                                        );
                                      } else {
                                        setSelectedUsersToDelete([
                                          ...selectedUsersToDelete,
                                          user.id,
                                        ]);
                                      }
                                    }}
                                  >
                                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-red-600 sm:h-4 sm:w-4" />
                                    <div className="min-w-0 flex-1">
                                      <div className="truncate text-xs font-medium text-gray-900 sm:text-sm">
                                        {user.display_name || user.email}
                                      </div>
                                      <div className="truncate text-[10px] text-gray-500 sm:text-xs">
                                        {user.email}
                                      </div>
                                    </div>
                                    {isSelected && (
                                      <CheckCircle2 className="ml-1 h-4 w-4 shrink-0 text-red-600 sm:ml-2 sm:h-5 sm:w-5" />
                                    )}
                                  </div>
                                );
                              },
                            )}
                          </div>
                        </ScrollArea>
                      </div>
                    )}

                    {/* Visual Divider between sections */}
                    {pendingUsersNotInExcel.length > 0 &&
                      acceptedUsersNotInExcel.length > 0 && (
                        <div className="relative my-2 sm:my-4">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t-2 border-gray-300"></div>
                          </div>
                          <div className="relative flex justify-center">
                            <span className="bg-gray-50 px-3 text-xs font-semibold text-gray-600 sm:px-4 sm:text-sm">
                              OU
                            </span>
                          </div>
                        </div>
                      )}

                    {/* Section 2: Accepted users not in Excel */}
                    {acceptedUsersNotInExcel.length > 0 && (
                      <div className="flex min-h-0 flex-1 flex-col space-y-2 rounded-lg border border-orange-200 bg-orange-50/30 p-3 sm:space-y-4 sm:p-4">
                        <div className="rounded-lg border-2 border-orange-300 bg-orange-50 p-2 sm:p-4">
                          <div className="flex items-center gap-1.5 sm:gap-3 md:items-start">
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-orange-600 sm:h-5 sm:w-5" />
                            <div className="min-w-0 flex-1">
                              <h3 className="text-xs font-semibold text-orange-900 sm:text-sm">
                                Utilisateurs acceptés à supprimer
                              </h3>
                              <p className="mt-0.5 hidden text-xs text-orange-700 sm:mt-1 sm:block">
                                {acceptedUsersNotInExcel.length} utilisateur(s)
                                ayant accepté l&apos;invitation mais absent(s)
                                de la liste Excel. Ces utilisateurs sont actifs
                                dans le système. Sélectionnez ceux que vous
                                souhaitez supprimer s&apos;ils ne sont plus
                                membres de votre association.
                              </p>
                              <p className="mt-0.5 text-[10px] text-orange-700 sm:hidden">
                                {acceptedUsersNotInExcel.length} utilisateur(s)
                                accepté(s) à supprimer
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <p className="text-xs font-medium text-gray-700 sm:text-sm">
                            {selectedAcceptedUsersToDelete.length}{" "}
                            sélectionné(s)
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSelectAllAcceptedToDelete}
                            className="h-7 text-[10px] sm:h-8 sm:text-xs"
                          >
                            {selectedAcceptedUsersToDelete.length ===
                            acceptedUsersNotInExcel.length
                              ? "Tout désélectionner"
                              : "Tout sélectionner"}
                          </Button>
                        </div>

                        <ScrollArea className="max-h-75 min-h-25 flex-1 overflow-y-auto rounded-lg border border-orange-200 sm:max-h-100 sm:min-h-37.5">
                          <div className="space-y-0.5 p-1 sm:space-y-1 sm:p-2">
                            {acceptedUsersNotInExcel.map(
                              (user: {
                                id: string;
                                email: string;
                                display_name: string | null;
                                invite_status: string;
                              }) => {
                                const isSelected =
                                  selectedAcceptedUsersToDelete.includes(
                                    user.id,
                                  );
                                return (
                                  <div
                                    key={user.id}
                                    className={`flex cursor-pointer items-center gap-1.5 rounded-md p-2 transition-colors sm:gap-3 sm:p-3 ${
                                      isSelected
                                        ? "border border-orange-200 bg-orange-50"
                                        : "hover:bg-gray-50"
                                    }`}
                                    onClick={() => {
                                      if (isSelected) {
                                        setSelectedAcceptedUsersToDelete(
                                          selectedAcceptedUsersToDelete.filter(
                                            (id) => id !== user.id,
                                          ),
                                        );
                                      } else {
                                        setSelectedAcceptedUsersToDelete([
                                          ...selectedAcceptedUsersToDelete,
                                          user.id,
                                        ]);
                                      }
                                    }}
                                  >
                                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-orange-600 sm:h-4 sm:w-4" />
                                    <div className="min-w-0 flex-1">
                                      <div className="truncate text-xs font-medium text-gray-900 sm:text-sm">
                                        {user.display_name || user.email}
                                      </div>
                                      <div className="truncate text-[10px] text-gray-500 sm:text-xs">
                                        {user.email}
                                      </div>
                                    </div>
                                    {isSelected && (
                                      <CheckCircle2 className="ml-1 h-4 w-4 shrink-0 text-orange-600 sm:ml-2 sm:h-5 sm:w-5" />
                                    )}
                                  </div>
                                );
                              },
                            )}
                          </div>
                        </ScrollArea>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <CheckCircle2 className="h-12 w-12 text-green-500" />
                    <p className="mt-4 text-sm font-medium text-gray-900">
                      Aucun utilisateur à supprimer
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Tous les utilisateurs sont présents dans la liste Excel.
                    </p>
                  </div>
                )}
              </TabsContent>

              {/* Tab 3: Sync Data from Excel */}
              <TabsContent
                value="sync"
                className="flex min-h-0 flex-1 flex-col space-y-2 overflow-hidden sm:space-y-4"
              >
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-2 sm:p-4">
                  <div className="flex items-center gap-1.5 sm:gap-3 md:items-start">
                    <RefreshCw className="h-3.5 w-3.5 shrink-0 text-blue-600 sm:h-5 sm:w-5" />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-xs font-semibold text-blue-900 sm:text-sm">
                        Synchroniser les données
                      </h3>
                      <p className="mt-0.5 hidden text-xs text-blue-700 sm:mt-1 sm:block">
                        Mettez à jour les informations des utilisateurs
                        (adresse, téléphone, nom) depuis la liste Excel. Cette
                        action mettra à jour tous les utilisateurs qui existent
                        à la fois dans la base de données et dans Excel.
                      </p>
                      <p className="mt-0.5 text-[10px] text-blue-700 sm:hidden">
                        Mettez à jour les informations depuis Excel
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-gray-50 p-2 sm:p-4">
                  <h4 className="text-xs font-medium text-gray-900 sm:text-sm">
                    Informations qui seront synchronisées :
                  </h4>
                  <ul className="mt-1.5 space-y-0.5 text-[10px] text-gray-600 sm:mt-2 sm:space-y-1 sm:text-xs">
                    <li className="flex items-center gap-1.5 sm:gap-2">
                      <CheckCircle2 className="h-2.5 w-2.5 shrink-0 text-green-500 sm:h-3 sm:w-3" />
                      Adresse postale
                    </li>
                    <li className="flex items-center gap-1.5 sm:gap-2">
                      <CheckCircle2 className="h-2.5 w-2.5 shrink-0 text-green-500 sm:h-3 sm:w-3" />
                      Téléphone domicile
                    </li>
                    <li className="flex items-center gap-1.5 sm:gap-2">
                      <CheckCircle2 className="h-2.5 w-2.5 shrink-0 text-green-500 sm:h-3 sm:w-3" />
                      Téléphone portable
                    </li>
                    <li className="flex items-center gap-1.5 sm:gap-2">
                      <CheckCircle2 className="h-2.5 w-2.5 shrink-0 text-green-500 sm:h-3 sm:w-3" />
                      Voix
                    </li>
                  </ul>
                </div>

                <div className="flex flex-1 items-center justify-center px-2 sm:px-0">
                  <Button
                    onClick={handleSyncAllData}
                    disabled={isSyncingData}
                    size="sm"
                    className="h-9 w-full gap-2 text-xs sm:h-11 sm:w-auto sm:px-6 sm:text-sm"
                  >
                    {isSyncingData ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin sm:h-4 sm:w-4" />
                        <span className="sm:hidden">Synchronisation...</span>
                        <span className="hidden sm:inline">
                          Synchronisation en cours...
                        </span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        <span className="sm:hidden">Synchroniser</span>
                        <span className="hidden sm:inline">
                          Synchroniser toutes les données depuis Excel
                        </span>
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>

              {/* Tab 4: Duplicate Emails */}
              <TabsContent
                value="duplicates"
                className="flex min-h-0 flex-1 flex-col space-y-2 overflow-hidden sm:space-y-4"
              >
                {(typedSyncData.duplicates?.length ?? 0) > 0 ? (
                  <>
                    <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-2 sm:p-4">
                      <div className="flex items-center gap-1.5 sm:gap-3 md:items-start">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-yellow-600 sm:h-5 sm:w-5" />
                        <div className="min-w-0 flex-1">
                          <h3 className="text-xs font-semibold text-yellow-900 sm:text-sm">
                            Emails en double dans Excel
                          </h3>
                          <p className="mt-0.5 hidden text-xs text-yellow-700 sm:mt-1 sm:block">
                            {typedSyncData.duplicates?.length ?? 0} email(s)
                            apparaît(ssent) plusieurs fois dans la liste Excel.
                            Chaque occurrence est affichée ci-dessous.
                          </p>
                          <p className="mt-0.5 text-[10px] text-yellow-700 sm:hidden">
                            {typedSyncData.duplicates?.length ?? 0} email(s) en
                            double
                          </p>
                        </div>
                      </div>
                    </div>

                    <ScrollArea className="max-h-100 min-h-30 flex-1 overflow-y-auto rounded-lg border border-gray-200 sm:max-h-125 sm:min-h-50">
                      <div className="space-y-4 p-2 sm:p-4">
                        {(typedSyncData.duplicates ?? []).map(
                          (duplicate, index) => (
                            <div
                              key={index}
                              className="rounded-lg border border-yellow-200 bg-yellow-50/50 p-3 sm:p-4"
                            >
                              <div className="mb-2 text-xs font-semibold text-yellow-900 sm:text-sm">
                                {duplicate.email} ({duplicate.entries.length}{" "}
                                occurrence
                                {duplicate.entries.length > 1 ? "s" : ""})
                              </div>
                              <div className="space-y-2">
                                {duplicate.entries.map((entry, entryIndex) => (
                                  <div
                                    key={entryIndex}
                                    className="rounded-md border border-yellow-100 bg-white p-2 sm:p-3"
                                  >
                                    <div className="text-xs font-medium text-gray-900 sm:text-sm">
                                      {entry.name}
                                    </div>
                                    <div className="mt-1 space-y-0.5 text-[10px] text-gray-600 sm:text-xs">
                                      {entry.address && (
                                        <div>Adresse: {entry.address}</div>
                                      )}
                                      {entry.homePhone && (
                                        <div>Domicile: {entry.homePhone}</div>
                                      )}
                                      {entry.mobilePhone && (
                                        <div>Portable: {entry.mobilePhone}</div>
                                      )}
                                      {entry.voice && (
                                        <div>Voix: {entry.voice}</div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    </ScrollArea>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <CheckCircle2 className="h-12 w-12 text-green-500" />
                    <p className="mt-4 text-sm font-medium text-gray-900">
                      Aucun email en double
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Tous les emails de la liste Excel sont uniques.
                    </p>
                  </div>
                )}
              </TabsContent>

              {/* Tab 5: Users Without Email */}
              <TabsContent
                value="no-email"
                className="flex min-h-0 flex-1 flex-col space-y-2 overflow-hidden sm:space-y-4"
              >
                {(typedSyncData.withoutEmail?.length ?? 0) > 0 ? (
                  <>
                    <div className="rounded-lg border border-purple-200 bg-purple-50 p-2 sm:p-4">
                      <div className="flex items-center gap-1.5 sm:gap-3 md:items-start">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-purple-600 sm:h-5 sm:w-5" />
                        <div className="min-w-0 flex-1">
                          <h3 className="text-xs font-semibold text-purple-900 sm:text-sm">
                            Membres sans adresse email
                          </h3>
                          <p className="mt-0.5 hidden text-xs text-purple-700 sm:mt-1 sm:block">
                            {typedSyncData.withoutEmail?.length ?? 0} membre(s)
                            présent(s) dans Excel sans adresse email. Contactez
                            ces membres pour obtenir leur adresse email.
                          </p>
                          <p className="mt-0.5 text-[10px] text-purple-700 sm:hidden">
                            {typedSyncData.withoutEmail?.length ?? 0} membre(s)
                            sans email
                          </p>
                        </div>
                      </div>
                    </div>

                    <ScrollArea className="max-h-100 min-h-30 flex-1 overflow-y-auto rounded-lg border border-gray-200 sm:max-h-125 sm:min-h-50">
                      <div className="space-y-0.5 p-1 sm:space-y-1 sm:p-2">
                        {(typedSyncData.withoutEmail ?? []).map(
                          (member, index) => (
                            <div
                              key={index}
                              className="rounded-md border border-purple-100 bg-white p-2 transition-colors sm:p-3"
                            >
                              <div className="text-xs font-medium text-gray-900 sm:text-sm">
                                {member.name}
                              </div>
                              <div className="mt-1 space-y-0.5 text-[10px] text-gray-600 sm:text-xs">
                                {member.address && (
                                  <div className="flex items-start gap-1.5 sm:gap-2">
                                    <span className="font-medium text-gray-500 sm:min-w-[70px]">
                                      Adresse:
                                    </span>
                                    <span className="flex-1 break-words">
                                      {member.address}
                                    </span>
                                  </div>
                                )}
                                {member.homePhone && (
                                  <div className="flex items-center gap-1.5 sm:gap-2">
                                    <span className="font-medium text-gray-500 sm:min-w-[70px]">
                                      Domicile:
                                    </span>
                                    <span className="flex-1 break-words">
                                      {member.homePhone}
                                    </span>
                                  </div>
                                )}
                                {member.mobilePhone && (
                                  <div className="flex items-center gap-1.5 sm:gap-2">
                                    <span className="font-medium text-gray-500 sm:min-w-[70px]">
                                      Portable:
                                    </span>
                                    <span className="flex-1 break-words">
                                      {member.mobilePhone}
                                    </span>
                                  </div>
                                )}
                                {member.voice && (
                                  <div className="flex items-center gap-1.5 sm:gap-2">
                                    <span className="font-medium text-gray-500 sm:min-w-[70px]">
                                      Voix:
                                    </span>
                                    <span className="flex-1 break-words">
                                      {member.voice}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    </ScrollArea>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <CheckCircle2 className="h-12 w-12 text-green-500" />
                    <p className="mt-4 text-sm font-medium text-gray-900">
                      Aucun membre sans email
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Tous les membres de la liste Excel ont une adresse email.
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          ) : (
            <div className="py-12 text-center text-red-500">
              <p>Erreur lors du chargement des données de synchronisation</p>
            </div>
          )}
        </div>

        <DialogFooter className="shrink-0 flex-col gap-2 border-t pt-4 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Fermer
          </Button>
          {typedSyncData && activeTab === "invite" && (
            <Button
              onClick={() => {
                if (selectedMissingUsers.length === 0) {
                  toast.error("Aucun membre sélectionné");
                  return;
                }

                // Get the full member data for selected emails
                const selectedMembers = typedSyncData.missingInDatabase.filter(
                  (m) => selectedMissingUsers.includes(m.email),
                );

                const invitations = selectedMembers.map((member) => ({
                  email: member.email,
                  displayName: member.name,
                }));

                if (onPrepareInvitations) {
                  onPrepareInvitations(invitations);
                  toast.success("Invitations préparées", {
                    description: `${invitations.length} membre(s) prêt(s) à être invité(s).`,
                  });
                } else {
                  onOpenChange(false);
                  toast.info("Invitation manuelle requise", {
                    description: `Veuillez utiliser le bouton "Inviter" pour inviter les ${selectedMissingUsers.length} membre(s) sélectionné(s). Les informations seront pré-remplies depuis Excel.`,
                  });
                }
              }}
              disabled={selectedMissingUsers.length === 0}
              className="w-full gap-2 sm:w-auto"
            >
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">
                Préparer l&apos;invitation ({selectedMissingUsers.length})
              </span>
              <span className="sm:hidden">
                Inviter ({selectedMissingUsers.length})
              </span>
            </Button>
          )}
          {typedSyncData && activeTab === "delete" && (
            <Button
              onClick={handleDeleteUsers}
              disabled={
                (selectedUsersToDelete.length === 0 &&
                  selectedAcceptedUsersToDelete.length === 0) ||
                deleteUser.isPending
              }
              variant="destructive"
              className="w-full gap-2 sm:w-auto"
            >
              {deleteUser.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Suppression...</span>
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    Supprimer ces utilisateurs (
                    {selectedUsersToDelete.length +
                      selectedAcceptedUsersToDelete.length}
                    )
                  </span>
                  <span className="sm:hidden">
                    Supprimer (
                    {selectedUsersToDelete.length +
                      selectedAcceptedUsersToDelete.length}
                    )
                  </span>
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
