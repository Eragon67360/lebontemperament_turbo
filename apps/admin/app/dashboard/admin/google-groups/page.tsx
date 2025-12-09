// app/dashboard/admin/google-groups/page.tsx
"use client";

import { PageShell } from "@/components/layouts/PageShell";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useGoogleGroupMembers,
  useGoogleGroupsList,
} from "@/hooks/useGoogleGroups";
import { RefreshCw, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function GoogleGroupsPage() {
  const [selectedGroupEmail, setSelectedGroupEmail] = useState<string>("");
  const [defaultGroupEmail] = useState("btnewsletter@googlegroups.com");

  // Fetch groups list
  const {
    data: groupsData,
    isLoading: isLoadingGroups,
    refetch: refetchGroups,
  } = useGoogleGroupsList();

  // Fetch members for selected group
  const {
    data: membersData,
    isLoading: isLoadingMembers,
    error: membersError,
    refetch: refetchMembers,
  } = useGoogleGroupMembers(selectedGroupEmail || defaultGroupEmail);

  // Set default group on mount
  useEffect(() => {
    if (!selectedGroupEmail && defaultGroupEmail) {
      setSelectedGroupEmail(defaultGroupEmail);
    }
  }, [defaultGroupEmail, selectedGroupEmail]);

  const handleRefresh = () => {
    refetchMembers();
    refetchGroups();
    toast.success("Actualisation en cours...");
  };

  const members = membersData?.data || [];
  const stats = membersData?.stats;
  const groups = groupsData?.data || [];

  return (
    <PageShell
      fullHeight
      theme="admin"
      className="px-4 py-8 sm:px-6 lg:px-8"
      title="Groupes Google"
      description="Consultez les membres des groupes Google."
      headerAction={
        <Button
          variant="outline"
          size="sm"
          className="h-9 px-3"
          onClick={handleRefresh}
          disabled={isLoadingMembers || isLoadingGroups}
        >
          <RefreshCw
            className={`h-4 w-4 ${isLoadingMembers || isLoadingGroups ? "animate-spin" : ""}`}
          />
          <span className="hidden md:inline">Actualiser</span>
        </Button>
      }
    >
      <div className="flex h-full min-h-0 flex-col gap-6">
        {/* Group Selector */}
        <div className="flex flex-shrink-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1 space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Sélectionner un groupe
            </label>
            {isLoadingGroups ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select
                value={selectedGroupEmail}
                onValueChange={setSelectedGroupEmail}
              >
                <SelectTrigger className="w-full sm:max-w-md">
                  <SelectValue placeholder="Choisir un groupe" />
                </SelectTrigger>
                <SelectContent>
                  {groups.length > 0 ? (
                    groups.map((group) => (
                      <SelectItem key={group.email} value={group.email}>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {group.name !== group.email
                              ? group.name
                              : group.email}
                          </span>
                          {group.name !== group.email && (
                            <span className="text-xs text-gray-500">
                              {group.email}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value={defaultGroupEmail}>
                      {defaultGroupEmail}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* Stats Card */}
        {stats && (
          <div className="flex-shrink-0 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Nombre de membres
                </p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {stats.total}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Groupe</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {stats.groupName}
                </p>
                <p className="text-xs text-gray-500">{stats.groupEmail}</p>
              </div>
              {stats.description && (
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Description
                  </p>
                  <p className="mt-1 text-sm text-gray-700">
                    {stats.description}
                  </p>
                </div>
              )}
            </div>
            <p className="mt-4 text-xs text-gray-400">
              Dernière mise à jour:{" "}
              {new Date(stats.retrievedAt).toLocaleString("fr-FR")}
            </p>
          </div>
        )}

        {/* Members List */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="flex-shrink-0 border-b border-gray-200 px-6 py-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Membres du groupe
            </h3>
          </div>
          <ScrollArea className="flex-1">
            {isLoadingMembers ? (
              <div className="space-y-3 p-6">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : membersError ? (
              <div className="p-6 text-center">
                <p className="text-red-500">
                  Erreur lors du chargement des membres
                </p>
                <p className="mt-2 text-sm text-gray-500">
                  {membersError instanceof Error
                    ? membersError.message
                    : "Une erreur est survenue"}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={handleRefresh}
                >
                  Réessayer
                </Button>
              </div>
            ) : members.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-4 text-sm font-medium text-gray-900">
                  Aucun membre trouvé
                </p>
                <p className="mt-2 text-sm text-gray-500">
                  Ce groupe ne contient aucun membre ou une erreur est survenue.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {members.map((member, index) => (
                  <div
                    key={index}
                    className="flex items-center px-6 py-4 hover:bg-gray-50"
                  >
                    <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
                      <Users className="text-primary h-5 w-5" />
                    </div>
                    <div className="ml-4 flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {typeof member === "string" ? member : member.email}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </PageShell>
  );
}
