"use client";

import { GroupDialog } from "@/components/groups/GroupDialog";
import { GroupTile } from "@/components/groups/GroupIcon";
import { GroupMembers } from "@/components/groups/GroupMembers";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Card } from "@/components/ui/card";
import {
  EmptyState,
  ErrorState,
  PageSkeleton,
} from "@/components/ui/data-state";
import { DateBlock } from "@/components/ui/date-block";
import { StatusBadge } from "@/components/ui/status-badge";
import { useCurrentProfile } from "@/hooks/useCurrentProfile";
import { NotInstalledError } from "@/hooks/useDocuments";
import {
  useAddGroupMembers,
  useGroup,
  useRemoveGroupMember,
  useUpdateGroup,
  useUpdateGroupMember,
} from "@/hooks/useGroups";
import { useUsers } from "@/hooks/useUsers";
import { groupFormToPatch, type GroupFormValues } from "@/utils/groups/form";
import type { GroupDetail, GroupMember } from "@/utils/groups/types";
import {
  archiveBlocker,
  canManageGroups,
  managersLine,
  newEventForGroupHref,
} from "@/utils/groups/view";
import { memberName } from "@/utils/members/list";
import { memberOptions } from "@/utils/orders/members";
import RouteNames from "@/utils/routes";
import {
  eventPeriodLabel,
  formatTimeFr,
  parseIsoDate,
} from "@/utils/season/schedule";
import {
  GROUP_KIND_LABELS,
  GROUP_VISIBILITY_DESCRIPTIONS,
  GROUP_VISIBILITY_LABELS,
  groupMemberCountLabel,
} from "@repo/domain/utils/memberGroups";
import {
  Archive,
  ArchiveRestore,
  ArrowLeft,
  CalendarDays,
  CalendarPlus,
  Lock,
  MapPin,
  Pencil,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";

const LIST = RouteNames.DASHBOARD.ADMIN.GROUPS;

/**
 * One group: who is in it (add, « Responsable », function, remove), its
 * next events and « Nouvel événement », and for superadmins « Modifier » and
 * the archive.
 */
export default function GroupPage() {
  const { id } = useParams<{ id: string }>();
  const query = useGroup(id);
  const { data: profile } = useCurrentProfile();
  const manages = canManageGroups(profile?.role);
  const users = useUsers();
  const candidates = useMemo(
    () => memberOptions(users.data ?? [], memberName),
    [users.data],
  );

  const updateGroup = useUpdateGroup(id);
  const addMembers = useAddGroupMembers(id);
  const updateMember = useUpdateGroupMember(id);
  const removeMember = useRemoveGroupMember(id);
  const [editing, setEditing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  if (query.isLoading) return <PageSkeleton cards={3} />;
  if (query.error instanceof NotInstalledError) {
    return (
      <div className="py-6">
        <Callout tone="warning" title="Pas encore installé">
          {query.error.message}
        </Callout>
      </div>
    );
  }
  if (query.isError || !query.data) {
    const missing = query.error?.message === "Groupe introuvable";
    return (
      <div className="py-6">
        {missing ? (
          <EmptyState
            icon={UsersRound}
            title="Groupe introuvable"
            description="Ce groupe n'existe pas, ou son adresse a changé."
            action={
              <Button asChild variant="outline">
                <Link href={LIST}>Retour aux groupes</Link>
              </Button>
            }
          />
        ) : (
          <ErrorState
            title="Le groupe n'a pas pu être chargé"
            onRetry={() => query.refetch()}
          />
        )}
      </div>
    );
  }

  const { group, members, upcoming } = query.data;
  const archived = group.archived_at !== null;

  const run = async (
    member: GroupMember,
    write: () => Promise<unknown>,
    done: string,
  ) => {
    setBusyId(member.id);
    try {
      await write();
      toast.success(done);
    } catch (error) {
      toast.error("La modification a échoué", {
        description: error instanceof Error ? error.message : undefined,
      });
      throw error;
    } finally {
      setBusyId(null);
    }
  };

  const save = async (values: GroupFormValues) => {
    const patch = groupFormToPatch(group, values);
    if (Object.keys(patch).length === 0) return;
    const saved = await updateGroup.mutateAsync(patch);
    toast.success(`« ${saved.name} » enregistré`);
  };

  const setArchived = async (value: boolean) => {
    try {
      await updateGroup.mutateAsync({ archived: value });
      toast.success(
        value ? `« ${group.name} » archivé` : `« ${group.name} » rétabli`,
      );
    } catch (error) {
      toast.error(
        value ? "L'archivage a échoué" : "Le rétablissement a échoué",
        {
          description: error instanceof Error ? error.message : undefined,
        },
      );
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 py-4 sm:py-6">
      <GroupHeader
        detail={query.data}
        actions={
          <>
            {manages && (
              <Button variant="outline" onClick={() => setEditing(true)}>
                <Pencil aria-hidden />
                Modifier
              </Button>
            )}
            {!archived && (
              <Button asChild>
                <Link href={newEventForGroupHref(group.id)}>
                  <CalendarPlus aria-hidden />
                  Nouvel événement
                </Link>
              </Button>
            )}
          </>
        }
      />

      {archived && (
        <Callout tone="warning" title="Groupe archivé">
          Il ne se choisit plus pour un nouvel événement et ne prend plus de
          nouveau membre. Ses anciens événements restent réservés à ses membres.
        </Callout>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Card className="min-w-0 overflow-hidden">
          <GroupMembers
            groupName={group.name}
            members={members}
            candidates={candidates}
            archived={archived}
            busyId={busyId}
            onAdd={async (profileIds) => {
              const { added } = await addMembers.mutateAsync({
                profile_ids: profileIds,
              });
              toast.success(
                added === 1
                  ? "1 membre ajouté au groupe"
                  : `${added} membres ajoutés au groupe`,
              );
            }}
            onRole={(member, role) =>
              run(
                member,
                () => updateMember.mutateAsync({ profile_id: member.id, role }),
                role === "manager"
                  ? `${member.name} est responsable du groupe`
                  : `${member.name} n'est plus responsable du groupe`,
              ).catch(() => {})
            }
            onTitle={(member, title) =>
              run(
                member,
                () =>
                  updateMember.mutateAsync({ profile_id: member.id, title }),
                title
                  ? `Fonction de ${member.name} : ${title}`
                  : `Fonction de ${member.name} retirée`,
              )
            }
            onRemove={(member) =>
              run(
                member,
                () => removeMember.mutateAsync(member.id),
                `${member.name} a quitté le groupe`,
              )
            }
          />
        </Card>

        <div className="flex min-w-0 flex-col gap-6">
          <SectionCard
            id="events"
            title="Prochains événements"
            intro="Réservés au groupe : seuls ses membres et les administrateurs les voient."
          >
            {upcoming.length === 0 ? (
              <p className="text-detail text-muted-foreground">
                Aucun événement prévu pour le groupe.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {upcoming.map((event) => {
                  const date = parseIsoDate(event.date_from);
                  const time = formatTimeFr(event.time);
                  return (
                    <li key={event.id} className="flex items-start gap-3">
                      <DateBlock date={date} icon={CalendarDays} size="sm" />
                      <div className="min-w-0 space-y-0.5">
                        <p className="font-medium break-words">{event.title}</p>
                        <p className="text-note text-muted-foreground">
                          {eventPeriodLabel(event)}
                          {time ? ` · ${time}` : ""}
                        </p>
                        {event.location && (
                          <p className="text-note text-muted-foreground inline-flex min-w-0 items-center gap-1">
                            <MapPin className="size-3.5 shrink-0" aria-hidden />
                            <span className="truncate">{event.location}</span>
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            <Button asChild variant="link" className="mt-3 h-auto px-0">
              <Link href={RouteNames.DASHBOARD.MEMBERS.EVENEMENTS}>
                Tous les événements
              </Link>
            </Button>
          </SectionCard>

          <SectionCard id="visibility" title="Qui voit le groupe">
            <p className="font-medium">
              {GROUP_VISIBILITY_LABELS[group.visibility]}
            </p>
            <p className="text-detail text-muted-foreground mt-1">
              {GROUP_VISIBILITY_DESCRIPTIONS[group.visibility]}
            </p>
          </SectionCard>

          {manages && (
            <SectionCard
              id="danger"
              title="Actions sensibles"
              intro="Réservées aux super-administrateurs."
              className="border-danger/40"
            >
              <ArchiveBlock
                archived={archived}
                blocker={archiveBlocker(group)}
                pending={updateGroup.isPending}
                onArchive={() => setArchived(true)}
                onRestore={() => setArchived(false)}
              />
            </SectionCard>
          )}
        </div>
      </div>

      {manages && (
        <GroupDialog
          open={editing}
          onOpenChange={setEditing}
          group={group}
          onSubmit={save}
          isPending={updateGroup.isPending}
        />
      )}
    </div>
  );
}

function GroupHeader({
  detail,
  actions,
}: {
  detail: GroupDetail;
  actions: ReactNode;
}) {
  const { group, members } = detail;
  const managers = managersLine(
    members.filter((m) => m.role === "manager").map((m) => m.name),
  );
  return (
    <header className="flex flex-col gap-4">
      <Button asChild variant="ghost" size="sm" className="-ml-3 self-start">
        <Link href={LIST}>
          <ArrowLeft aria-hidden />
          Groupes
        </Link>
      </Button>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
        <GroupTile
          icon={group.icon}
          color={group.color}
          className="size-16 rounded-xl [&>svg]:size-7"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <h1 className="lg:text-title text-2xl leading-8 font-semibold tracking-[-0.01em] break-words">
            {group.name}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone="accent" dot={false}>
              {GROUP_KIND_LABELS[group.kind]}
            </StatusBadge>
            {group.visibility === "private" ? (
              <StatusBadge tone="neutral" dot={false}>
                <Lock aria-hidden />
                {GROUP_VISIBILITY_LABELS.private}
              </StatusBadge>
            ) : (
              <StatusBadge tone="info" dot={false}>
                {GROUP_VISIBILITY_LABELS.members}
              </StatusBadge>
            )}
            {group.archived_at && (
              <StatusBadge tone="warning">Archivé</StatusBadge>
            )}
          </div>
          {group.description && (
            <p className="text-body max-w-[70ch] break-words">
              {group.description}
            </p>
          )}
          <p className="text-detail text-muted-foreground">
            {[groupMemberCountLabel(members.length), managers]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 sm:justify-end">{actions}</div>
      </div>
    </header>
  );
}

function ArchiveBlock({
  archived,
  blocker,
  pending,
  onArchive,
  onRestore,
}: {
  archived: boolean;
  blocker: string | null;
  pending: boolean;
  onArchive: () => void;
  onRestore: () => void;
}) {
  if (archived) {
    return (
      <div className="border-border flex flex-col gap-2 border-t pt-4">
        <p className="font-medium">Rétablir le groupe</p>
        <p className="text-detail text-muted-foreground">
          Il redevient choisissable pour les événements et peut de nouveau
          accueillir des membres.
        </p>
        <Button
          variant="outline"
          className="self-start"
          onClick={onRestore}
          disabled={pending}
        >
          <ArchiveRestore aria-hidden />
          Rétablir
        </Button>
      </div>
    );
  }
  return (
    <div className="border-border flex flex-col gap-2 border-t pt-4">
      <p className="font-medium">Archiver le groupe</p>
      <p className="text-detail text-muted-foreground">
        Le groupe ne se choisit plus pour un nouvel événement. Ses membres et
        ses anciens événements sont gardés ; vous pourrez le rétablir.
      </p>
      <div className="flex flex-col items-start gap-1.5">
        <Button
          variant="destructive-outline"
          onClick={onArchive}
          disabled={pending || !!blocker}
          aria-describedby={blocker ? "archive-why" : undefined}
        >
          <Archive aria-hidden />
          Archiver
        </Button>
        {blocker && (
          <p id="archive-why" className="text-note text-muted-foreground">
            {blocker}
          </p>
        )}
      </div>
    </div>
  );
}

function SectionCard({
  id,
  title,
  intro,
  className,
  children,
}: {
  id: string;
  title: string;
  intro?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Card className={`p-4 sm:p-6 ${className ?? ""}`}>
      <section aria-labelledby={`${id}-heading`}>
        <h2
          id={`${id}-heading`}
          className="text-[17px] leading-6 font-semibold"
        >
          {title}
        </h2>
        {intro && (
          <p className="text-detail text-muted-foreground mt-1 mb-4">{intro}</p>
        )}
        {!intro && <div className="mb-3" />}
        {children}
      </section>
    </Card>
  );
}
