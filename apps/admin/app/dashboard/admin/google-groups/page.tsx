// app/dashboard/admin/google-groups/page.tsx
"use client";

import { PageShell } from "@/components/layouts/PageShell";
import { Button } from "@/components/ui/button";
import {
  DataState,
  EmptyState,
  ListSkeleton,
} from "@/components/ui/data-state";
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
  type GoogleGroup,
  type GoogleGroupMember,
} from "@/hooks/useGoogleGroups";
import { RefreshCw, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const DEFAULT_GROUP_EMAIL = "btnewsletter@googlegroups.com";

export default function GoogleGroupsPage() {
  const [selectedGroupEmail, setSelectedGroupEmail] =
    useState(DEFAULT_GROUP_EMAIL);

  const {
    data: groupsData,
    isLoading: isLoadingGroups,
    isError: isGroupsError,
    isFetching: isFetchingGroups,
    refetch: refetchGroups,
  } = useGoogleGroupsList();

  const {
    data: membersData,
    isLoading: isLoadingMembers,
    isError: isMembersError,
    isFetching: isFetchingMembers,
    refetch: refetchMembers,
  } = useGoogleGroupMembers(selectedGroupEmail);

  const handleRefresh = () => {
    refetchMembers();
    refetchGroups();
    toast.success("Actualisation en cours...");
  };

  // isFetching, not isLoading: a refresh over cached data still has to look busy.
  const isRefreshing = isFetchingMembers || isFetchingGroups;
  const members: (GoogleGroupMember | string)[] = membersData?.data || [];
  const stats = membersData?.stats;
  // The groups endpoint can come back empty; the default group keeps the
  // selector usable instead of showing an empty menu.
  const groups: GoogleGroup[] = groupsData?.data?.length
    ? groupsData.data
    : [
        {
          email: DEFAULT_GROUP_EMAIL,
          name: DEFAULT_GROUP_EMAIL,
          description: null,
        },
      ];

  return (
    <PageShell
      theme="admin"
      className="py-4 sm:py-6"
      title="Groupes Google"
      description="Consultez les membres des groupes Google."
      headerAction={
        <Button
          variant="outline"
          className="min-h-11 w-full sm:w-auto"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw
            className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            aria-hidden
          />
          Actualiser
        </Button>
      }
    >
      <div className="flex flex-col gap-6">
        <div className="space-y-2">
          <label
            htmlFor="google-group"
            className="text-sm font-medium text-gray-700"
          >
            Sélectionner un groupe
          </label>
          <DataState
            isLoading={isLoadingGroups}
            isError={isGroupsError}
            onRetry={() => refetchGroups()}
            errorDescription="La liste des groupes n'a pas pu être chargée."
            skeleton={<Skeleton className="h-11 w-full sm:max-w-md" />}
            empty={null}
          >
            <Select
              value={selectedGroupEmail}
              onValueChange={setSelectedGroupEmail}
            >
              <SelectTrigger
                id="google-group"
                className="min-h-11 w-full sm:max-w-md"
              >
                <SelectValue placeholder="Choisir un groupe" />
              </SelectTrigger>
              <SelectContent>
                {groups.map((group) => (
                  <SelectItem key={group.email} value={group.email}>
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate font-medium">
                        {group.name !== group.email ? group.name : group.email}
                      </span>
                      {group.name !== group.email && (
                        <span className="truncate text-xs text-gray-500">
                          {group.email}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </DataState>
        </div>

        {stats && (
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-500">
                  Nombre de membres
                </p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {stats.total}
                </p>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-500">Groupe</p>
                <p className="mt-1 truncate text-sm font-semibold text-gray-900">
                  {stats.groupName}
                </p>
                <p className="truncate text-xs text-gray-500">
                  {stats.groupEmail}
                </p>
              </div>
              {stats.description && (
                <div className="min-w-0">
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

        <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-4 py-4 sm:px-6">
            <h2 className="text-base font-semibold text-gray-900 sm:text-lg">
              Membres du groupe
            </h2>
          </div>
          <DataState
            isLoading={isLoadingMembers}
            isError={isMembersError}
            isEmpty={members.length === 0}
            onRetry={() => refetchMembers()}
            errorDescription="Les membres de ce groupe n'ont pas pu être chargés."
            skeleton={
              <ListSkeleton
                rows={6}
                className="p-4 sm:p-6"
                label="Chargement des membres…"
              />
            }
            empty={
              <EmptyState
                icon={Users}
                title="Aucun membre trouvé"
                description="Ce groupe ne contient aucun membre."
              />
            }
          >
            <ul className="divide-y divide-gray-200">
              {members.map((member) => {
                const email =
                  typeof member === "string" ? member : member.email;
                return (
                  <li
                    key={email}
                    className="flex items-center gap-3 px-4 py-3 sm:px-6"
                  >
                    <div className="bg-primary/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                      <Users className="text-primary h-5 w-5" aria-hidden />
                    </div>
                    <p className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900">
                      {email}
                    </p>
                  </li>
                );
              })}
            </ul>
          </DataState>
        </section>
      </div>
    </PageShell>
  );
}
