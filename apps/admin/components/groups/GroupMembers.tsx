"use client";

import { DeleteConfirmDialog } from "@/components/anniversary/DeleteConfirmDialog";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/data-state";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/ui/status-badge";
import { MemberAvatar } from "@/components/users/MemberAvatar";
import { useResetOnChange } from "@/hooks/useResetOnChange";
import { memberTitleSchema } from "@/utils/groups/form";
import type { GroupMember } from "@/utils/groups/types";
import { matchMembers, type MemberOption } from "@/utils/orders/members";
import RouteNames from "@/utils/routes";
import {
  GROUP_MEMBER_TITLE_MAX,
  GROUP_MEMBERS_ADD_MAX,
  groupMemberCountLabel,
} from "@repo/domain/utils/memberGroups";
import {
  Check,
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
  Star,
  StarOff,
  Tag,
  UserMinus,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";

export interface GroupMembersProps {
  groupName: string;
  members: readonly GroupMember[];
  /** Every account, for « Ajouter des membres ». */
  candidates: readonly MemberOption[];
  /** An archived group takes no new member. */
  archived: boolean;
  onAdd: (profileIds: string[]) => Promise<void>;
  onRole: (member: GroupMember, role: GroupMember["role"]) => Promise<void>;
  onTitle: (member: GroupMember, title: string | null) => Promise<void>;
  onRemove: (member: GroupMember) => Promise<void>;
  /** The member whose write is running. */
  busyId?: string | null;
}

/**
 * « Membres » of a group page: who is in it, « Responsable » first, each
 * with their function (« Trésorière ») and a menu to change their role or
 * function or take them out of the group; « Ajouter des membres » above.
 */
export function GroupMembers({
  groupName,
  members,
  candidates,
  archived,
  onAdd,
  onRole,
  onTitle,
  onRemove,
  busyId,
}: GroupMembersProps) {
  const [adding, setAdding] = useState(false);
  const [titleFor, setTitleFor] = useState<GroupMember | null>(null);
  const [removing, setRemoving] = useState<GroupMember | null>(null);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const inGroup = useMemo(
    () => new Set(members.map((member) => member.id)),
    [members],
  );

  const confirmRemove = async () => {
    if (!removing) return;
    setIsRemoving(true);
    try {
      await onRemove(removing);
      setRemoveOpen(false);
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <section aria-labelledby="members-heading">
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div className="min-w-0 space-y-1">
          <h2
            id="members-heading"
            className="text-[17px] leading-6 font-semibold"
          >
            Membres
            <span className="text-note text-muted-foreground ml-2 font-normal">
              {groupMemberCountLabel(members.length)}
            </span>
          </h2>
          <p className="text-detail text-muted-foreground max-w-[64ch]">
            Ils voient les événements réservés au groupe et reçoivent leur
            notification. Un « Responsable » n&apos;a pas d&apos;accès en plus à
            l&apos;administration.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="shrink-0"
          onClick={() => setAdding(true)}
          disabled={archived}
          title={
            archived
              ? "Rétablissez le groupe pour y ajouter des membres"
              : undefined
          }
        >
          <Plus aria-hidden />
          Ajouter des membres
        </Button>
      </div>

      <div className="border-border border-t">
        {members.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Personne dans ce groupe"
            description="Ajoutez ses membres : ils verront ses événements dans leur espace et dans l'application."
            className="py-8"
          />
        ) : (
          <ul className="divide-border divide-y">
            {members.map((member) => (
              <li
                key={member.id}
                className="flex min-h-(--row-h) items-center gap-3 px-4 py-2 sm:px-6"
              >
                <MemberAvatar
                  user={{
                    avatar: member.avatar ?? undefined,
                    display_name: member.name,
                    email: member.email ?? "",
                  }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <Link
                      href={RouteNames.DASHBOARD.ADMIN.USER(member.id)}
                      className="text-foreground truncate font-medium underline-offset-4 hover:underline"
                    >
                      {member.name}
                    </Link>
                    {member.role === "manager" && (
                      <StatusBadge tone="accent" dot={false}>
                        <Star aria-hidden />
                        Responsable
                      </StatusBadge>
                    )}
                  </div>
                  <p className="text-note text-muted-foreground truncate">
                    {[member.title, member.email].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <MemberMenu
                  member={member}
                  disabled={busyId === member.id}
                  onRole={onRole}
                  onTitle={() => setTitleFor(member)}
                  onRemove={() => {
                    setRemoving(member);
                    setRemoveOpen(true);
                  }}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      <AddMembersDialog
        open={adding}
        onOpenChange={setAdding}
        groupName={groupName}
        candidates={candidates.filter((c) => !inGroup.has(c.id))}
        onAdd={onAdd}
      />
      <TitleDialog
        member={titleFor}
        onClose={() => setTitleFor(null)}
        onSave={onTitle}
      />
      <DeleteConfirmDialog
        open={removeOpen}
        onOpenChange={(open) => {
          if (!open && !isRemoving) setRemoveOpen(false);
        }}
        onConfirm={confirmRemove}
        title={`Retirer ${removing?.name ?? ""} du groupe ?`}
        description={`${removing?.name ?? "Cette personne"} ne verra plus les événements réservés au groupe « ${groupName} » et ne recevra plus leurs notifications. Son compte n'est pas touché ; vous pourrez l'ajouter à nouveau.`}
        confirmLabel="Retirer du groupe"
        pendingLabel="Retrait…"
        isLoading={isRemoving}
      />
    </section>
  );
}

function MemberMenu({
  member,
  disabled,
  onRole,
  onTitle,
  onRemove,
}: {
  member: GroupMember;
  disabled: boolean;
  onRole: GroupMembersProps["onRole"];
  onTitle: () => void;
  onRemove: () => void;
}) {
  const manager = member.role === "manager";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={disabled}
          title="Plus d'actions"
          className="text-muted-foreground hover:text-foreground data-[state=open]:bg-primary-soft shrink-0"
        >
          {disabled ? (
            <Loader2
              className="animate-spin motion-reduce:animate-none"
              aria-hidden
            />
          ) : (
            <MoreHorizontal aria-hidden />
          )}
          <span className="sr-only">
            Plus d&apos;actions pour {member.name}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" collisionPadding={16}>
        <DropdownMenuItem
          onSelect={() => onRole(member, manager ? "member" : "manager")}
        >
          {manager ? <StarOff aria-hidden /> : <Star aria-hidden />}
          {manager ? "Ne plus être responsable" : "Nommer responsable"}
        </DropdownMenuItem>
        {/* Deferred so the menu has closed before the dialog takes the focus. */}
        <DropdownMenuItem onSelect={() => setTimeout(onTitle, 0)}>
          <Tag aria-hidden />
          {member.title ? "Modifier la fonction…" : "Indiquer une fonction…"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onSelect={() => setTimeout(onRemove, 0)}
        >
          <UserMinus aria-hidden />
          Retirer du groupe…
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** « Ajouter des membres »: search by name or e-mail, pick several, add them at once. */
function AddMembersDialog({
  open,
  onOpenChange,
  groupName,
  candidates,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupName: string;
  candidates: readonly MemberOption[];
  onAdd: (profileIds: string[]) => Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<MemberOption[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useResetOnChange([open], () => {
    if (open) {
      setQuery("");
      setPicked([]);
      setError(null);
    }
  });
  const pickedIds = useMemo(() => new Set(picked.map((p) => p.id)), [picked]);
  const matches = useMemo(
    () =>
      matchMembers(
        candidates.filter((c) => !pickedIds.has(c.id)),
        query,
        8,
      ),
    [candidates, pickedIds, query],
  );
  const full = picked.length >= GROUP_MEMBERS_ADD_MAX;

  const add = async () => {
    setPending(true);
    setError(null);
    try {
      await onAdd(picked.map((p) => p.id));
      onOpenChange(false);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Les membres n'ont pas été ajoutés",
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Ajouter des membres</DialogTitle>
          <DialogDescription>
            Choisissez les personnes du groupe « {groupName} » : elles verront
            ses événements dès leur ajout.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {picked.length > 0 && (
            <ul aria-label="Membres choisis" className="flex flex-wrap gap-1.5">
              {picked.map((member) => (
                <li key={member.id}>
                  <span className="bg-primary-soft text-primary-text text-note inline-flex min-h-8 items-center gap-1 rounded-full pr-1 pl-3 font-medium">
                    {member.name}
                    <button
                      type="button"
                      onClick={() =>
                        setPicked((list) =>
                          list.filter((p) => p.id !== member.id),
                        )
                      }
                      className="hover:bg-primary-soft-border focus-visible:outline-ring grid size-7 place-content-center rounded-full focus-visible:outline-2"
                    >
                      <X className="size-3.5" aria-hidden />
                      <span className="sr-only">
                        Retirer {member.name} du choix
                      </span>
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
          <div className="relative">
            <label htmlFor="group-member-search" className="sr-only">
              Nom ou e-mail du membre
            </label>
            <Search
              aria-hidden
              className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2"
            />
            <Input
              id="group-member-search"
              type="search"
              autoComplete="off"
              autoFocus
              placeholder="Nom ou e-mail du membre"
              className="pl-11"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              disabled={full}
            />
          </div>
          {full && (
            <p className="text-detail text-muted-foreground">
              {GROUP_MEMBERS_ADD_MAX} personnes au plus à la fois : ajoutez
              celles-ci, puis continuez.
            </p>
          )}
          {error && (
            <p role="alert" className="text-detail text-danger-foreground">
              {error}
            </p>
          )}
          {query.trim().length >= 2 && matches.length === 0 ? (
            <p className="text-detail text-muted-foreground">
              Aucun membre ne correspond, ou il fait déjà partie du groupe.
            </p>
          ) : (
            <ul className="divide-border border-border divide-y rounded-md border empty:hidden">
              {matches.map((member) => (
                <li key={member.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setPicked((list) => [...list, member]);
                      setQuery("");
                    }}
                    disabled={pending || full}
                    className="hover:bg-muted/60 focus-visible:outline-ring flex min-h-11 w-full items-center gap-3 px-3.5 py-2 text-left focus-visible:outline-2 focus-visible:-outline-offset-2 disabled:opacity-60"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">
                        {member.name}
                      </span>
                      {member.email && (
                        <span className="text-note text-muted-foreground block truncate">
                          {member.email}
                        </span>
                      )}
                    </span>
                    <Plus className="text-primary size-4" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            Annuler
          </Button>
          <Button
            type="button"
            onClick={add}
            disabled={pending || picked.length === 0}
            aria-busy={pending || undefined}
          >
            {pending ? (
              <Loader2
                className="animate-spin motion-reduce:animate-none"
                aria-hidden
              />
            ) : (
              <Check aria-hidden />
            )}
            {picked.length <= 1
              ? "Ajouter au groupe"
              : `Ajouter ${picked.length} membres`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** « Fonction dans le groupe »: « Trésorière », « Président »; empty removes it. */
function TitleDialog({
  member,
  onClose,
  onSave,
}: {
  member: GroupMember | null;
  onClose: () => void;
  onSave: (member: GroupMember, title: string | null) => Promise<void>;
}) {
  // The member stays shown while the dialog closes.
  const [shown, setShown] = useState<GroupMember | null>(member);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  useResetOnChange([member], () => {
    if (member) {
      setShown(member);
      setValue(member.title ?? "");
      setError(null);
    }
  });

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!shown) return;
    const parsed = memberTitleSchema.safeParse({ title: value });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Fonction invalide");
      return;
    }
    setPending(true);
    setError(null);
    try {
      await onSave(shown, parsed.data.title || null);
      onClose();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "La fonction n'a pas été enregistrée",
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog
      open={!!member}
      onOpenChange={(open) => !open && !pending && onClose()}
    >
      <DialogContent className="sm:max-w-md">
        <form onSubmit={save} noValidate className="contents">
          <DialogHeader>
            <DialogTitle>Fonction de {shown?.name ?? ""}</DialogTitle>
            <DialogDescription>
              Affichée à côté de son nom dans le groupe. Laissez vide pour
              l&apos;enlever.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="group-member-title">Fonction</Label>
            <Input
              id="group-member-title"
              value={value}
              maxLength={GROUP_MEMBER_TITLE_MAX + 10}
              placeholder="Trésorière"
              onChange={(event) => setValue(event.target.value)}
              aria-invalid={!!error || undefined}
              aria-describedby={error ? "group-member-title-error" : undefined}
              autoFocus
            />
            {error && (
              <p
                id="group-member-title-error"
                role="alert"
                className="text-detail text-danger-foreground"
              >
                {error}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={pending}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={pending}
              aria-busy={pending || undefined}
            >
              {pending && (
                <Loader2
                  className="animate-spin motion-reduce:animate-none"
                  aria-hidden
                />
              )}
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
