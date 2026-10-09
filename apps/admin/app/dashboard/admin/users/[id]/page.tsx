"use client";

import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Card } from "@/components/ui/card";
import {
  EmptyState,
  ErrorState,
  PageSkeleton,
} from "@/components/ui/data-state";
import { ProvenanceNote } from "@/components/ui/provenance-note";
import { StatusBadge } from "@/components/ui/status-badge";
import { MemberAvatar } from "@/components/users/MemberAvatar";
import { MemberStatus, VoiceChips } from "@/components/users/MemberStatus";
import { useMemberDialogs } from "@/components/users/useMemberDialogs";
import { useMemberActivity } from "@/hooks/useActivities";
import { useCurrentProfile } from "@/hooks/useCurrentProfile";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  RosterChangedError,
  useApplyRosterSync,
  useRosterReview,
} from "@/hooks/useRosterSync";
import { useUsers } from "@/hooks/useUsers";
import type { User } from "@/types/user";
import {
  deletionBlocker,
  emailChangeBlocker,
  FIELD_NAMES,
  firstNameOf,
  formatDayFr,
  lastSeenLabel,
  memberName,
  memberStatus,
  memberVoices,
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  roleChangeBlocker,
  rosterFlags,
  shownValue,
  STATUS_DESCRIPTIONS,
  STATUS_LABELS,
  STATUS_TONES,
} from "@/utils/members/list";
import RouteNames from "@/utils/routes";
import type { FieldChange } from "@repo/domain/roster/types";
import {
  ArrowLeft,
  ArrowLeftRight,
  CircleHelp,
  Loader2,
  Shield,
  Trash2,
  UserRound,
  UserX,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, type ReactNode } from "react";
import { toast } from "sonner";

const LIST = RouteNames.DASHBOARD.ADMIN.USERS;

/**
 * One member: what the roster says differently, contact details with who
 * owns each one, access (status and role, changed through a dialog), the
 * account's history, and the sensitive actions.
 */
export default function MemberPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const usersQuery = useUsers();
  const user = useMemo(
    () => usersQuery.data?.find((candidate) => candidate.id === id),
    [usersQuery.data, id],
  );
  const { data: currentUser } = useCurrentUser();
  const { data: profile } = useCurrentProfile();
  const actor = { id: currentUser?.id, role: profile?.role };
  const dialogs = useMemberDialogs({
    actorIsSuperAdmin: profile?.role === "superadmin",
    onDeleted: () => router.push(LIST),
  });

  if (usersQuery.isLoading) return <PageSkeleton cards={4} />;
  if (usersQuery.isError) {
    return (
      <div className="py-6">
        <ErrorState
          title="La fiche n’a pas pu être chargée"
          description="Vérifiez votre connexion, puis réessayez."
          onRetry={() => usersQuery.refetch()}
        />
      </div>
    );
  }
  if (!user) {
    return (
      <div className="py-6">
        <EmptyState
          icon={UserRound}
          title="Membre introuvable"
          description="Ce compte n’existe pas ou a été supprimé."
          action={
            <Button asChild variant="outline">
              <Link href={LIST}>Retour aux membres</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const roleBlocker = roleChangeBlocker(actor, user);
  const deleteBlocker = deletionBlocker(actor, user);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 py-4 sm:py-6">
      <MemberHeader user={user} />
      <RosterDifferences user={user} />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="flex min-w-0 flex-col gap-6">
          <ContactCard
            user={user}
            emailBlocker={emailChangeBlocker(actor)}
            onEmail={() => dialogs.openEmail(user)}
            onRename={() => dialogs.openRename(user)}
            onPhoto={() => dialogs.openPhoto(user)}
          />
          <HistoryCard user={user} />
        </div>
        <div className="flex min-w-0 flex-col gap-6">
          <SectionCard
            id="access"
            title="Accès"
            intro={`Ce que ${firstNameOf(user)} peut faire sur le site, l’application et ici.`}
          >
            <dl className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <dt className="text-detail text-muted-foreground">Statut</dt>
                <dd className="flex flex-col items-start gap-1">
                  <StatusBadge tone={STATUS_TONES[memberStatus(user)]}>
                    {STATUS_LABELS[memberStatus(user)]}
                  </StatusBadge>
                  <span className="text-detail text-muted-foreground">
                    {STATUS_DESCRIPTIONS[memberStatus(user)]}
                  </span>
                </dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="text-detail text-muted-foreground">Rôle</dt>
                <dd className="flex flex-col gap-1">
                  <span className="font-medium">{ROLE_LABELS[user.role]}</span>
                  <span className="text-detail text-muted-foreground">
                    {ROLE_DESCRIPTIONS[user.role]}
                  </span>
                </dd>
              </div>
            </dl>
            <div className="mt-4 flex flex-col items-start gap-1.5">
              <Button
                variant="outline"
                onClick={() => dialogs.openRole(user)}
                disabled={!!roleBlocker}
                aria-describedby={roleBlocker ? "role-why" : undefined}
              >
                <Shield aria-hidden />
                Changer le rôle…
              </Button>
              {roleBlocker && (
                <p id="role-why" className="text-note text-muted-foreground">
                  {roleBlocker}
                </p>
              )}
            </div>
          </SectionCard>

          <SectionCard
            id="danger"
            title="Actions sensibles"
            intro={`Chacune demande une confirmation qui nomme ${firstNameOf(user)}.`}
            className="border-danger/40"
          >
            <div className="border-border flex flex-col gap-2 border-t pt-4">
              <p className="font-medium">Supprimer définitivement</p>
              <p className="text-detail text-muted-foreground">
                Irréversible, pour une demande d’effacement : le compte et son
                accès disparaissent.
              </p>
              <div className="flex flex-col items-start gap-1.5">
                <Button
                  variant="destructive-outline"
                  onClick={() => dialogs.openDelete(user)}
                  disabled={!!deleteBlocker}
                  aria-describedby={deleteBlocker ? "delete-why" : undefined}
                >
                  <Trash2 aria-hidden />
                  Supprimer…
                </Button>
                {deleteBlocker && (
                  <p
                    id="delete-why"
                    className="text-note text-muted-foreground"
                  >
                    {deleteBlocker}
                  </p>
                )}
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
      {dialogs.dialogs}
    </div>
  );
}

function MemberHeader({ user }: { user: User }) {
  const voices = memberVoices(user);
  const facts = [
    ROLE_LABELS[user.role],
    user.last_sign_in_at
      ? `dernière connexion ${lastSeenLabel(user.last_sign_in_at)}`
      : "jamais connecté·e",
    user.created_at && `compte créé le ${formatDayFr(user.created_at)}`,
  ].filter(Boolean);

  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
      <MemberAvatar user={user} className="size-16 text-xl" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <h1 className="lg:text-title text-2xl leading-8 font-semibold tracking-[-0.01em] break-words">
          {memberName(user)}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          {voices.length > 0 && <VoiceChips voices={voices} />}
          <MemberStatus user={user} />
        </div>
        <p className="text-detail text-muted-foreground">{facts.join(" · ")}</p>
      </div>
      <Button asChild variant="outline" className="self-start sm:self-center">
        <Link href={LIST}>
          <ArrowLeft aria-hidden />
          Retour aux membres
        </Link>
      </Button>
    </header>
  );
}

/** What the roster says differently, with the one fix this page can apply. */
function RosterDifferences({ user }: { user: User }) {
  const reviewQuery = useRosterReview();
  const apply = useApplyRosterSync();
  const flag = rosterFlags(reviewQuery.data).get(user.id);
  const name = firstNameOf(user);
  if (!flag) return null;

  if (flag.absent) {
    return (
      <Callout
        tone="warning"
        icon={UserX}
        title="Absent de la liste des membres"
      >
        La liste de l’association ne contient plus {memberName(user)}. Si {name}{" "}
        est parti·e, son compte reste actif pour l’instant ; si c’est une
        erreur, corrigez la liste puis synchronisez.
      </Callout>
    );
  }
  if (flag.changes.length === 0) return null;

  const changes = flag.changes;
  const applyAll = async () => {
    const review = reviewQuery.data;
    if (!review) return;
    try {
      const { summary } = await apply.mutateAsync({
        fingerprint: review.fingerprint,
        invite: [],
        update: [{ profileId: user.id, fields: changes.map((c) => c.field) }],
      });
      if (summary.failed > 0) {
        toast.error("La fiche n’a pas été mise à jour", {
          description: "Réessayez depuis la page de synchronisation.",
        });
      } else {
        toast.success(`Fiche de ${name} mise à jour depuis la liste`);
      }
    } catch (error) {
      toast.error(
        error instanceof RosterChangedError
          ? "La liste a changé entre-temps"
          : "La fiche n’a pas été mise à jour",
        { description: error instanceof Error ? error.message : undefined },
      );
    }
  };

  const one = changes.length === 1 ? changes[0]! : null;
  return (
    <Card
      className="flex flex-col gap-4 p-4 sm:p-6"
      aria-labelledby="diff-heading"
      role="region"
    >
      <div className="flex flex-wrap items-center gap-2.5">
        <StatusBadge tone="warning">À régler</StatusBadge>
        <h2 id="diff-heading" className="text-[17px] leading-6 font-semibold">
          {changes.length > 1
            ? `${changes.length} différences avec la liste des membres`
            : "1 différence avec la liste des membres"}
        </h2>
      </div>
      <p className="text-muted-foreground text-[15px] leading-6">
        La liste de l’association fait référence pour le nom, l’adresse, le
        téléphone fixe et la voix. Rien ne change avant que vous appliquiez ses
        valeurs.
      </p>
      <ul className="flex flex-col gap-3">
        {changes.map((change) => (
          <DifferenceRow key={change.field} change={change} />
        ))}
      </ul>
      <div className="flex flex-col items-start gap-2">
        <Button
          onClick={applyAll}
          disabled={apply.isPending || !reviewQuery.data}
          aria-busy={apply.isPending || undefined}
        >
          {apply.isPending && <Loader2 className="animate-spin" aria-hidden />}
          {one
            ? `Appliquer la valeur de la liste : ${shownValue(one.to)}`
            : `Appliquer les ${changes.length} valeurs de la liste`}
        </Button>
        <p className="text-note text-muted-foreground">
          Pour garder la valeur actuelle, corrigez la liste des membres : sinon
          la différence reviendra à la prochaine synchronisation.
        </p>
      </div>
    </Card>
  );
}

function DifferenceRow({ change }: { change: FieldChange }) {
  return (
    <li className="flex flex-col gap-2">
      <p className="text-detail font-medium">{FIELD_NAMES[change.field]}</p>
      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-stretch">
        <div className="border-primary-soft-border bg-primary-soft flex flex-col gap-1 rounded-md border p-3">
          <span className="text-note text-primary-text font-medium">
            Liste des membres
          </span>
          <span className="text-lg leading-7 font-semibold break-words">
            {shownValue(change.to)}
          </span>
        </div>
        <ArrowLeftRight
          aria-hidden
          className="text-foreground-faint hidden size-5 self-center sm:block"
        />
        <div className="border-border flex flex-col gap-1 rounded-md border p-3">
          <span className="text-note text-muted-foreground font-medium">
            Compte actuel
          </span>
          <span className="text-lg leading-7 font-semibold break-words">
            {shownValue(change.from)}
          </span>
        </div>
      </div>
    </li>
  );
}

function ContactCard({
  user,
  emailBlocker,
  onEmail,
  onRename,
  onPhoto,
}: {
  user: User;
  /** Why this admin cannot change the email, or null when they can. */
  emailBlocker: string | null;
  onEmail: () => void;
  onRename: () => void;
  onPhoto: () => void;
}) {
  const name = firstNameOf(user);
  const fromRoster = "Depuis la liste des membres · lecture seule ici";
  return (
    <SectionCard
      id="contact"
      title="Coordonnées"
      intro={`La liste des membres gère le nom, l’adresse, le fixe et la voix ; ${name} gère son portable et sa photo.`}
    >
      <dl className="divide-border grid grid-cols-1 divide-y sm:grid-cols-[9rem_minmax(0,1fr)] sm:divide-y-0">
        <Fact label="E-mail">
          <a
            href={`mailto:${user.email}`}
            className="text-primary-text break-all underline-offset-4 hover:underline"
          >
            {user.email}
          </a>
          <span className="text-note text-muted-foreground">
            Sert à se connecter
          </span>
          {emailBlocker ? (
            <ProvenanceNote icon={Shield}>{emailBlocker}</ProvenanceNote>
          ) : (
            <Button
              variant="link"
              className="h-auto self-start p-0"
              onClick={onEmail}
            >
              Changer l’e-mail…
            </Button>
          )}
        </Fact>
        <Fact label="Nom affiché">
          <span>{memberName(user)}</span>
          <ProvenanceNote>{fromRoster}</ProvenanceNote>
          <Button
            variant="link"
            className="h-auto self-start p-0"
            onClick={onRename}
          >
            Corriger le nom affiché…
          </Button>
        </Fact>
        <Fact label="Portable">
          <span>{user.mobile_phone || "Non renseigné"}</span>
          <ProvenanceNote icon={UserRound}>
            Modifiable par {name} depuis son profil
          </ProvenanceNote>
        </Fact>
        <Fact label="Adresse">
          <span className="whitespace-pre-line">
            {user.address || "Non renseignée"}
          </span>
          <ProvenanceNote>{fromRoster}</ProvenanceNote>
        </Fact>
        <Fact label="Fixe">
          <span>{user.home_phone || "Non renseigné"}</span>
          <ProvenanceNote>{fromRoster}</ProvenanceNote>
        </Fact>
        <Fact label="Voix">
          <VoiceChips voices={memberVoices(user)} />
          <ProvenanceNote>{fromRoster}</ProvenanceNote>
        </Fact>
        <Fact label="Photo">
          <span>{user.avatar ? "Une photo est en place" : "Pas de photo"}</span>
          <ProvenanceNote icon={UserRound}>
            Modifiable par {name} depuis son profil
          </ProvenanceNote>
          <Button
            variant="link"
            className="h-auto self-start p-0"
            onClick={onPhoto}
          >
            Changer la photo…
          </Button>
        </Fact>
      </dl>
      <details className="group mt-4">
        <summary className="text-primary-text flex min-h-11 cursor-pointer list-none items-center gap-2 text-[15px] font-medium [&::-webkit-details-marker]:hidden">
          <CircleHelp aria-hidden className="size-5" />
          Pourquoi ne puis-je pas modifier l’adresse ici ?
        </summary>
        <p className="text-muted-foreground text-detail mt-1 max-w-[64ch]">
          La liste des membres de l’association fait référence pour le nom,
          l’adresse, le téléphone fixe et la voix. Corrigez-la dans le fichier,
          puis lancez « Synchroniser avec la liste » : la fiche suivra. Cela
          évite deux versions de la même information.
        </p>
      </details>
    </SectionCard>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="text-detail text-muted-foreground sm:border-border pt-3 sm:border-t sm:py-3.5">
        {label}
      </dt>
      <dd className="sm:border-border flex min-w-0 flex-col items-start gap-1 pb-3 sm:border-t sm:py-3.5">
        {children}
      </dd>
    </>
  );
}

function HistoryCard({ user }: { user: User }) {
  const activity = useMemberActivity(user.id);
  const entries = [
    ...(activity.data ?? []).map((entry) => ({
      key: entry.id,
      text: entry.description || entry.title,
      by: entry.profiles?.display_name || entry.profiles?.email,
      at: entry.created_at,
    })),
    { key: "created", text: "Compte créé", by: undefined, at: user.created_at },
  ];

  return (
    <SectionCard
      id="history"
      title="Historique"
      intro="Ce qui s’est passé sur ce compte."
    >
      {activity.isError && (
        <p className="text-detail text-muted-foreground mb-3">
          Les changements récents n’ont pas pu être chargés ; seule la date de
          création est affichée.
        </p>
      )}
      <ol className="flex flex-col gap-3.5">
        {entries.map((entry, index) => (
          <li key={entry.key} className="flex gap-3">
            <span
              aria-hidden
              className={
                index === 0
                  ? "bg-primary mt-2 size-2 shrink-0 rounded-full"
                  : "bg-border-strong mt-2 size-2 shrink-0 rounded-full"
              }
            />
            <span className="flex flex-col">
              <span className="text-[15px] leading-6">{entry.text}</span>
              <span className="text-note text-muted-foreground">
                {[formatDayFr(entry.at), entry.by && `par ${entry.by}`]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </span>
          </li>
        ))}
      </ol>
    </SectionCard>
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
        {children}
      </section>
    </Card>
  );
}
