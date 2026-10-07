// app/dashboard/admin/google-groups/page.tsx
"use client";

import { PageShell } from "@/components/layouts/PageShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DataState,
  EmptyState,
  ListSkeleton,
} from "@/components/ui/data-state";
import { Label } from "@/components/ui/label";
import { ProvenanceNote } from "@/components/ui/provenance-note";
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
import {
  addressCountLabel,
  DEFAULT_GROUP_EMAIL,
  groupLabel,
  groupsWithDefault,
  memberEmails,
} from "@/utils/google-groups/members";
import { Clock, Mail, RefreshCw, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

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
    toast.success("Actualisation en cours…");
  };

  // isFetching, not isLoading: a refresh over cached data still has to look busy.
  const isRefreshing = isFetchingMembers || isFetchingGroups;
  const members = memberEmails(membersData?.data);
  const stats = membersData?.stats;
  const groups = groupsWithDefault(groupsData?.data);

  return (
    <PageShell
      className="py-4 sm:py-6"
      title="Liste de diffusion"
      description="Les adresses inscrites aux groupes Google de l'association, en lecture seule : les inscriptions se gèrent dans Google Groups."
      headerAction={
        <Button
          variant="outline"
          className="w-full sm:w-auto"
          onClick={handleRefresh}
          disabled={isRefreshing}
          aria-busy={isRefreshing || undefined}
        >
          <RefreshCw
            className={isRefreshing ? "animate-spin" : undefined}
            aria-hidden
          />
          Actualiser
        </Button>
      }
    >
      <div className="flex flex-col gap-6">
        <div className="space-y-2">
          <Label htmlFor="google-group">Groupe</Label>
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
              <SelectTrigger id="google-group" className="w-full sm:max-w-md">
                <SelectValue placeholder="Choisir un groupe" />
              </SelectTrigger>
              <SelectContent>
                {groups.map((group) => {
                  const label = groupLabel(group);
                  return (
                    <SelectItem key={group.email} value={group.email}>
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate font-medium">
                          {label.name}
                        </span>
                        {label.email && (
                          <span className="text-note text-muted-foreground truncate">
                            {label.email}
                          </span>
                        )}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </DataState>
        </div>

        {stats && (
          <Card className="p-4 sm:p-5">
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="min-w-0">
                <dt className="text-detail text-muted-foreground">
                  Adresses inscrites
                </dt>
                <dd className="text-title text-foreground mt-1 font-semibold">
                  {stats.total}
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="text-detail text-muted-foreground">Groupe</dt>
                <dd className="mt-1 min-w-0">
                  <span className="text-body text-foreground block truncate font-semibold">
                    {stats.groupName}
                  </span>
                  <span className="text-note text-muted-foreground block truncate">
                    {stats.groupEmail}
                  </span>
                </dd>
              </div>
              {stats.description && (
                <div className="min-w-0">
                  <dt className="text-detail text-muted-foreground">
                    Description
                  </dt>
                  <dd className="text-detail text-foreground mt-1 break-words">
                    {stats.description}
                  </dd>
                </div>
              )}
            </dl>
            <ProvenanceNote icon={Clock} className="mt-4">
              Lu dans Google Groups le{" "}
              {new Date(stats.retrievedAt).toLocaleString("fr-FR")}
            </ProvenanceNote>
          </Card>
        )}

        <section aria-labelledby="members-heading" className="space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="members-heading" className="text-section">
              Membres du groupe
            </h2>
            {members.length > 0 && (
              <p className="text-note text-muted-foreground">
                {addressCountLabel(members.length)}
              </p>
            )}
          </div>
          <Card>
            <DataState
              isLoading={isLoadingMembers}
              isError={isMembersError}
              isEmpty={members.length === 0}
              onRetry={() => refetchMembers()}
              errorDescription="Les membres de ce groupe n'ont pas pu être chargés."
              skeleton={
                <ListSkeleton
                  rows={6}
                  className="p-4 sm:p-5"
                  label="Chargement des membres…"
                />
              }
              empty={
                <EmptyState
                  icon={Users}
                  title="Aucun membre dans ce groupe"
                  description="Personne n'est inscrit à ce groupe pour le moment. Les inscriptions se font dans Google Groups."
                />
              }
            >
              <ul className="divide-border divide-y">
                {members.map((email) => (
                  <li
                    key={email}
                    className="flex min-h-(--row-h) items-center gap-3 px-4 py-2 sm:px-5"
                  >
                    <span
                      className="bg-primary-soft text-primary-text grid size-9 shrink-0 place-items-center rounded-full"
                      aria-hidden
                    >
                      <Mail className="size-4" />
                    </span>
                    <span className="text-detail text-foreground min-w-0 flex-1 truncate font-medium">
                      {email}
                    </span>
                  </li>
                ))}
              </ul>
            </DataState>
          </Card>
        </section>
      </div>
    </PageShell>
  );
}
