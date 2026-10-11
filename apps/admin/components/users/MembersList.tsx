"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MemberActionsMenu } from "@/components/users/MemberActionsMenu";
import { MemberAvatar } from "@/components/users/MemberAvatar";
import { MemberStatus } from "@/components/users/MemberStatus";
import type { User } from "@/types/user";
import {
  lastSeenLabel,
  memberName,
  memberStatus,
  memberVoices,
  ROLE_LABELS,
  STATUS_LABELS,
  type Role,
  type RosterFlag,
} from "@/utils/members/list";
import RouteNames from "@/utils/routes";
import Link from "next/link";

export interface MembersListProps {
  users: User[];
  flags: Map<string, RosterFlag>;
  actor: { id: string | null | undefined; role: Role | null | undefined };
  onRole: (user: User) => void;
  onRename: (user: User) => void;
  onVoice: (user: User) => void;
  onPhoto: (user: User) => void;
  onDelete: (user: User) => void;
  /** Injected so renders are stable in tests. */
  now?: Date;
}

/**
 * « Tous les membres »: a table from `md` (name and e-mail, voices, status,
 * role, last sign-in, « ⋯ »), stacked rows on phones. The name links to the
 * member page; the role is text, changed only through a dialog.
 */
export function MembersList({
  users,
  flags,
  actor,
  now,
  ...actions
}: MembersListProps) {
  const today = now ?? new Date();

  return (
    <>
      <Table className="hidden md:table">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead scope="col" className="pl-4 lg:pl-6">
              Nom
            </TableHead>
            <TableHead scope="col">Voix</TableHead>
            <TableHead scope="col">Statut</TableHead>
            <TableHead scope="col">Rôle</TableHead>
            <TableHead scope="col" className="hidden lg:table-cell">
              Dernière connexion
            </TableHead>
            <TableHead scope="col" className="w-14 pr-4 lg:pr-6">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => {
            const isMe = !!actor.id && actor.id === user.id;
            return (
              <TableRow key={user.id}>
                <TableCell className="max-w-72 py-2 pl-4 lg:pl-6">
                  <Link
                    href={RouteNames.DASHBOARD.ADMIN.USER(user.id)}
                    className="group flex min-w-0 items-center gap-3 rounded-sm"
                  >
                    <MemberAvatar user={user} />
                    <span className="min-w-0">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="truncate font-medium underline-offset-4 group-hover:underline">
                          {memberName(user)}
                        </span>
                        {isMe && <YouChip />}
                      </span>
                      <span className="text-note text-muted-foreground block truncate">
                        {user.email}
                      </span>
                    </span>
                  </Link>
                </TableCell>
                <TableCell className="py-2">
                  {memberVoices(user).join(", ") || (
                    <span className="text-muted-foreground">
                      <span aria-hidden>—</span>
                      <span className="sr-only">Aucune voix</span>
                    </span>
                  )}
                </TableCell>
                <TableCell className="py-2">
                  <MemberStatus user={user} flag={flags.get(user.id)} />
                </TableCell>
                <TableCell
                  className={
                    user.role === "user"
                      ? "text-muted-foreground py-2 whitespace-nowrap"
                      : "py-2 font-medium whitespace-nowrap"
                  }
                >
                  {ROLE_LABELS[user.role]}
                </TableCell>
                <TableCell className="text-detail text-muted-foreground hidden py-2 lg:table-cell">
                  {lastSeenLabel(user.last_sign_in_at, today)}
                </TableCell>
                <TableCell className="py-2 pr-4 text-right lg:pr-6">
                  <MemberActionsMenu user={user} actor={actor} {...actions} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <ul className="divide-border divide-y md:hidden">
        {users.map((user) => {
          const isMe = !!actor.id && actor.id === user.id;
          const voices = memberVoices(user);
          const flag = flags.get(user.id);
          const differs = !!flag && (flag.absent || flag.changes.length > 0);
          return (
            <li
              key={user.id}
              className="flex items-center gap-2 py-1 pr-2 pl-4"
            >
              <Link
                href={RouteNames.DASHBOARD.ADMIN.USER(user.id)}
                className="flex min-h-14 min-w-0 flex-1 items-center gap-3 rounded-sm py-2"
              >
                <MemberAvatar user={user} />
                <span className="min-w-0">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="truncate font-medium">
                      {memberName(user)}
                    </span>
                    {isMe && <YouChip />}
                  </span>
                  <span className="text-note text-muted-foreground block truncate">
                    {[
                      voices.join(", "),
                      STATUS_LABELS[memberStatus(user)],
                      user.role !== "user" && ROLE_LABELS[user.role],
                      differs && "à vérifier",
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </span>
              </Link>
              <MemberActionsMenu user={user} actor={actor} {...actions} />
            </li>
          );
        })}
      </ul>
    </>
  );
}

function YouChip() {
  return (
    <span className="border-input text-muted-foreground text-note inline-flex h-5 shrink-0 items-center rounded-full border px-2">
      vous
    </span>
  );
}
