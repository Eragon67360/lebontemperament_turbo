"use client";

import { PageShell } from "@/components/layouts/PageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Card } from "@/components/ui/card";
import {
  DataState,
  EmptyState,
  ListSkeleton,
} from "@/components/ui/data-state";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AddUserDialog,
  type AddUserFormValues,
} from "@/components/users/AddUserDialog";
import { InviteUserDialog } from "@/components/users/InviteUsersDialog";
import { MembersList } from "@/components/users/MembersList";
import { useMemberDialogs } from "@/components/users/useMemberDialogs";
import { useCurrentProfile } from "@/hooks/useCurrentProfile";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { ROSTER_REVIEW_KEY, useRosterReview } from "@/hooks/useRosterSync";
import { useCreateUser, useUsers } from "@/hooks/useUsers";
import {
  filterMembers,
  hasFilters,
  memberCountLabel,
  NO_FILTERS,
  pendingSyncCount,
  pendingSyncSummary,
  ROLE_FILTERS,
  rosterFlags,
  STATUS_FILTERS,
  VOICE_OPTIONS,
  type MemberFilters,
  type RoleFilter,
  type StatusFilter,
} from "@/utils/members/list";
import RouteNames from "@/utils/routes";
import { createClient } from "@/utils/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { RefreshCw, Search, UserPlus, Users2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

export default function UsersPage() {
  const queryClient = useQueryClient();
  const searchRef = useRef<HTMLInputElement>(null);

  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [filters, setFilters] = useState<MemberFilters>(NO_FILTERS);

  // Every account in one request (about 130): search and filters are local,
  // so they answer as you type.
  const usersQuery = useUsers();
  const users = useMemo(() => usersQuery.data ?? [], [usersQuery.data]);
  const { data: currentUser } = useCurrentUser();
  const { data: profile } = useCurrentProfile();
  const actor = { id: currentUser?.id, role: profile?.role };
  // The reviewed diff with the member roster (also feeds the sync page).
  const { data: rosterReview } = useRosterReview();
  const flags = useMemo(() => rosterFlags(rosterReview), [rosterReview]);
  const visible = useMemo(
    () => filterMembers(users, filters, flags),
    [users, filters, flags],
  );
  const pending = pendingSyncCount(rosterReview);

  const createUser = useCreateUser();
  const dialogs = useMemberDialogs({
    actorIsSuperAdmin: profile?.role === "superadmin",
  });

  // Live updates when another admin or the sync changes a profile.
  useEffect(() => {
    const supabase = createClient();
    const subscription = supabase
      .channel("profiles-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => queryClient.invalidateQueries({ queryKey: ["users"] }),
      )
      .subscribe();
    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);

  // « / » jumps to the search, unless you are already typing somewhere.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey)
        return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true']"))
        return;
      event.preventDefault();
      searchRef.current?.focus();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const handleAddUser = async (values: AddUserFormValues) => {
    try {
      await createUser.mutateAsync({
        email: values.email,
        password: values.password,
        role: values.role,
        display_name: values.display_name || values.email.split("@")[0] || "",
      });
      toast.success("Compte créé");
      setIsAddUserOpen(false);
    } catch (error) {
      toast.error("Le compte n’a pas été créé", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  };

  const filtered = hasFilters(filters);
  const update = (patch: Partial<MemberFilters>) =>
    setFilters((current) => ({ ...current, ...patch }));

  return (
    <PageShell
      className="py-4 sm:py-6"
      title="Membres"
      description={
        <>
          {users.length > 0 &&
            `${memberCountLabel(users.length)} ont un compte. `}
          La liste des membres de l’association fait référence.
        </>
      }
      headerAction={
        <>
          <Button variant="outline" onClick={() => setIsInviteOpen(true)}>
            <UserPlus aria-hidden />
            Inviter
          </Button>
          <Button variant="outline" onClick={() => setIsAddUserOpen(true)}>
            Créer un compte
          </Button>
          <Button asChild>
            <Link href={RouteNames.DASHBOARD.ADMIN.USERS_SYNC}>
              <RefreshCw aria-hidden />
              Synchroniser avec la liste
              {pending > 0 && (
                <Badge
                  variant="secondary"
                  className="bg-primary-foreground text-primary-text min-h-5 px-1.5"
                >
                  {pending}
                  <span className="sr-only">
                    {pending > 1
                      ? " changements à vérifier"
                      : " changement à vérifier"}
                  </span>
                </Badge>
              )}
            </Link>
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {pending > 0 && (
          <Callout
            tone="warning"
            title={
              pending > 1
                ? `${pending} changements attendent votre avis`
                : "1 changement attend votre avis"
            }
            actions={
              <Button asChild variant="outline" size="sm">
                <Link href={RouteNames.DASHBOARD.ADMIN.USERS_SYNC}>
                  Voir les changements
                </Link>
              </Button>
            }
          >
            La liste des membres et les comptes ne disent pas la même chose :{" "}
            {pendingSyncSummary(rosterReview)}.
          </Callout>
        )}

        <Card className="overflow-hidden p-0">
          <section aria-labelledby="members-heading">
            <div className="flex flex-col gap-4 p-4 lg:px-6 lg:pt-5">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h2
                  id="members-heading"
                  className="text-[17px] leading-6 font-semibold"
                >
                  Tous les membres
                </h2>
                {users.length > 0 && (
                  <p
                    className="text-note text-muted-foreground"
                    aria-live="polite"
                  >
                    {filtered
                      ? `${visible.length} sur ${memberCountLabel(users.length)}`
                      : memberCountLabel(users.length)}
                  </p>
                )}
              </div>
              <form
                role="search"
                aria-label="Filtrer les membres"
                className="grid gap-2 sm:grid-cols-3 lg:flex lg:items-center"
                onSubmit={(event) => event.preventDefault()}
              >
                <div className="relative sm:col-span-3 lg:min-w-56 lg:flex-1">
                  <label htmlFor="member-search" className="sr-only">
                    Rechercher un membre
                  </label>
                  <Search
                    aria-hidden
                    className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2"
                  />
                  <Input
                    id="member-search"
                    ref={searchRef}
                    type="search"
                    autoComplete="off"
                    placeholder="Nom ou e-mail"
                    className="pr-10 pl-11"
                    value={filters.query}
                    onChange={(event) => update({ query: event.target.value })}
                  />
                  <kbd
                    aria-hidden
                    className="border-border-strong text-muted-foreground absolute top-1/2 right-3 hidden -translate-y-1/2 rounded-sm border px-1.5 text-xs font-medium lg:block"
                  >
                    /
                  </kbd>
                </div>
                <Select
                  value={filters.voice}
                  onValueChange={(voice) => update({ voice })}
                >
                  <SelectTrigger className="lg:w-44" aria-label="Voix">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les voix</SelectItem>
                    {VOICE_OPTIONS.map((voice) => (
                      <SelectItem key={voice} value={voice}>
                        {voice}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={filters.status}
                  onValueChange={(status) =>
                    update({ status: status as StatusFilter })
                  }
                >
                  <SelectTrigger className="lg:w-52" aria-label="Statut">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_FILTERS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={filters.role}
                  onValueChange={(role) => update({ role: role as RoleFilter })}
                >
                  <SelectTrigger className="lg:w-44" aria-label="Rôle">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_FILTERS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </form>
            </div>

            <div className="border-border border-t">
              <DataState
                isLoading={usersQuery.isLoading}
                isError={usersQuery.isError}
                isEmpty={visible.length === 0}
                onRetry={() => usersQuery.refetch()}
                errorDescription="Les membres n’ont pas pu être chargés. Vérifiez votre connexion, puis réessayez."
                skeleton={
                  <div className="p-4">
                    <ListSkeleton rows={8} label="Chargement des membres…" />
                  </div>
                }
                empty={
                  filtered ? (
                    <EmptyState
                      icon={Search}
                      title="Aucun membre ne correspond"
                      description="Essayez un autre nom, ou retirez un filtre."
                      className="py-8"
                      action={
                        <Button
                          variant="outline"
                          onClick={() => setFilters(NO_FILTERS)}
                        >
                          Effacer les filtres
                        </Button>
                      }
                    />
                  ) : (
                    <EmptyState
                      icon={Users2}
                      title="Aucun compte pour l’instant"
                      description="Synchronisez avec la liste des membres : chaque personne reçoit une invitation par e-mail."
                      className="py-8"
                    />
                  )
                }
              >
                <MembersList
                  users={visible}
                  flags={flags}
                  actor={actor}
                  onRole={dialogs.openRole}
                  onRename={dialogs.openRename}
                  onVoice={dialogs.openVoice}
                  onPhoto={dialogs.openPhoto}
                  onDelete={dialogs.openDelete}
                />
              </DataState>
            </div>
          </section>
        </Card>
      </div>

      <AddUserDialog
        isOpen={isAddUserOpen}
        onOpenChange={setIsAddUserOpen}
        onSubmit={handleAddUser}
        isProcessing={createUser.isPending}
      />
      <InviteUserDialog
        isOpen={isInviteOpen}
        onOpenChange={setIsInviteOpen}
        onSuccess={() =>
          queryClient.invalidateQueries({ queryKey: ROSTER_REVIEW_KEY })
        }
      />
      {dialogs.dialogs}
    </PageShell>
  );
}
