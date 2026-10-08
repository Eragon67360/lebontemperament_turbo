"use client";

import { DeleteConfirmDialog } from "@/components/anniversary/DeleteConfirmDialog";
import { RowDialog } from "@/components/joining/RowDialog";
import { PageShell } from "@/components/layouts/PageShell";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Card } from "@/components/ui/card";
import { DataState, ListSkeleton } from "@/components/ui/data-state";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { RowActionsMenu } from "@/components/ui/row-actions-menu";
import { StatusBadge } from "@/components/ui/status-badge";
import { NotInstalledError } from "@/hooks/useDocuments";
import {
  type FaqItem,
  type JoiningSlot,
  useCreateJoiningRow,
  useDeleteJoiningRow,
  useJoiningContent,
  useUpdateJoiningRows,
} from "@/hooks/useJoiningContent";
import { WEBSITE_URL } from "@/lib/website";
import {
  FAQ_FIELDS,
  faqInput,
  faqValues,
  SLOT_FIELDS,
  slotSentence,
  slotValues,
  validateFaq,
} from "@/utils/joining/form";
import { moveSortOrders } from "@repo/domain/utils/joiningContent";
import {
  ArrowDown,
  ArrowUp,
  ExternalLink,
  Eye,
  EyeOff,
  Pencil,
  Plus,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const errorText = (error: unknown) =>
  error instanceof Error ? error.message : "Réessayez dans un instant.";

const PAGE_TITLE = "Rejoindre et FAQ";
const PAGE_DESCRIPTION =
  "Les horaires de répétition de la page Rejoindre et les questions de la FAQ, dans l'ordre du site. Masquer retire du site sans perdre.";

type Kind = "slots" | "faq";
type Editing =
  | { kind: "slots"; row: JoiningSlot | null }
  | { kind: "faq"; row: FaqItem | null };

function MoveButtons({
  label,
  onUp,
  onDown,
  disabled,
}: {
  label: string;
  onUp?: () => void;
  onDown?: () => void;
  disabled: boolean;
}) {
  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={onUp}
        disabled={disabled || !onUp}
      >
        <ArrowUp aria-hidden />
        <span className="sr-only">Monter « {label} »</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onDown}
        disabled={disabled || !onDown}
      >
        <ArrowDown aria-hidden />
        <span className="sr-only">Descendre « {label} »</span>
      </Button>
    </>
  );
}

export default function JoiningContentPage() {
  const { data, isLoading, isError, error, refetch } = useJoiningContent();
  const createRow = useCreateJoiningRow();
  const updateRows = useUpdateJoiningRows();
  const deleteRow = useDeleteJoiningRow();

  const [editing, setEditing] = useState<Editing | null>(null);
  const [deleting, setDeleting] = useState<{
    kind: Kind;
    id: string;
    label: string;
  } | null>(null);

  const slots = useMemo(() => data?.slots ?? [], [data]);
  const faq = useMemo(() => data?.faq ?? [], [data]);
  const canDelete = data?.canDelete ?? false;
  const busy = updateRows.isPending || deleteRow.isPending;

  // Stable per opening, so the dialog starts from them once.
  const slotInitial = useMemo(
    () => slotValues(editing?.kind === "slots" ? editing.row : null),
    [editing],
  );
  const faqInitial = useMemo(
    () => faqValues(editing?.kind === "faq" ? editing.row : null),
    [editing],
  );

  const move = async (
    kind: Kind,
    rows: { id: string; sort_order: number }[],
    id: string,
    direction: "up" | "down",
  ) => {
    try {
      await updateRows.mutateAsync({
        kind,
        patches: moveSortOrders(rows, id, direction),
      });
    } catch (err) {
      toast.error("L'ordre n'a pas pu être changé", {
        description: errorText(err),
      });
    }
  };

  const setStatus = async (
    kind: Kind,
    id: string,
    label: string,
    status: "published" | "archived",
  ) => {
    try {
      await updateRows.mutateAsync({ kind, patches: [{ id, status }] });
      toast.success(
        status === "archived"
          ? `« ${label} » masqué du site`
          : `« ${label} » remis sur le site`,
      );
    } catch (err) {
      toast.error("Le changement n'a pas pu être enregistré", {
        description: errorText(err),
      });
    }
  };

  const save = async (kind: Kind, body: object, label: string) => {
    try {
      if (editing?.row) {
        await updateRows.mutateAsync({
          kind,
          patches: [{ id: editing.row.id, ...body }],
        });
        toast.success(`« ${label} » enregistré`);
      } else {
        await createRow.mutateAsync({
          kind,
          body: body as Parameters<typeof createRow.mutateAsync>[0]["body"],
        });
        toast.success(`« ${label} » ajouté`);
      }
    } catch (err) {
      toast.error("L'enregistrement a échoué", {
        description: errorText(err),
      });
      throw err;
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await deleteRow.mutateAsync({ kind: deleting.kind, id: deleting.id });
      toast.success(`« ${deleting.label} » supprimé`);
      setDeleting(null);
    } catch (err) {
      toast.error("La suppression a échoué", { description: errorText(err) });
    }
  };

  if (error instanceof NotInstalledError) {
    return (
      <PageShell
        className="py-4 sm:py-6"
        title={PAGE_TITLE}
        description={PAGE_DESCRIPTION}
      >
        <Callout tone="warning" title="Pas encore installé">
          Cette page attend une mise à jour de la base de données. En attendant,
          le site affiche les horaires et la FAQ habituels.
        </Callout>
      </PageShell>
    );
  }

  const rowCard = ({
    kind,
    id,
    label,
    detail,
    hidden,
    index,
    rows,
    onEdit,
  }: {
    kind: Kind;
    id: string;
    label: string;
    detail: string;
    hidden: boolean;
    index: number;
    rows: { id: string; sort_order: number }[];
    onEdit: () => void;
  }) => (
    <li key={id}>
      <Card className="flex items-start gap-4 p-4">
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-body min-w-0 font-semibold break-words">
                {label}
              </h3>
              {hidden && <StatusBadge tone="neutral">Masqué</StatusBadge>}
            </div>
            <p className="text-note text-muted-foreground line-clamp-3">
              {detail}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              disabled={busy}
              className="mr-1"
            >
              <Pencil aria-hidden />
              Modifier
              <span className="sr-only"> « {label} »</span>
            </Button>
            <MoveButtons
              label={label}
              disabled={busy}
              onUp={index > 0 ? () => move(kind, rows, id, "up") : undefined}
              onDown={
                index < rows.length - 1
                  ? () => move(kind, rows, id, "down")
                  : undefined
              }
            />
          </div>
        </div>
        <RowActionsMenu
          name={label}
          onDelete={
            canDelete ? () => setDeleting({ kind, id, label }) : undefined
          }
          disabled={busy}
          className="-mt-1 -mr-1 shrink-0"
        >
          {hidden ? (
            <DropdownMenuItem
              onSelect={() => setStatus(kind, id, label, "published")}
            >
              <Eye aria-hidden />
              Remettre sur le site
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onSelect={() => setStatus(kind, id, label, "archived")}
            >
              <EyeOff aria-hidden />
              Masquer du site
            </DropdownMenuItem>
          )}
        </RowActionsMenu>
      </Card>
    </li>
  );

  const sectionHeader = (
    id: string,
    title: string,
    help: string,
    page: string,
    onAdd: () => void,
    addLabel: string,
  ) => (
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <div>
        <h2 id={id} className="text-section">
          {title}
        </h2>
        <p className="text-note text-muted-foreground">{help}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="ghost" size="sm" asChild>
          <a
            href={`${WEBSITE_URL}${page}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Voir sur le site
            <span className="sr-only"> (nouvel onglet)</span>
            <ExternalLink aria-hidden />
          </a>
        </Button>
        <Button variant="outline" size="sm" onClick={onAdd} disabled={busy}>
          <Plus aria-hidden />
          {addLabel}
        </Button>
      </div>
    </div>
  );

  return (
    <PageShell
      className="py-4 sm:py-6"
      title={PAGE_TITLE}
      description={PAGE_DESCRIPTION}
    >
      <DataState
        isLoading={isLoading}
        isError={isError}
        isEmpty={false}
        onRetry={() => refetch()}
        errorDescription="La FAQ et les horaires n'ont pas pu être chargés."
        skeleton={<ListSkeleton rows={4} label="Chargement…" />}
      >
        <div className="space-y-10">
          <section aria-labelledby="slots-heading" className="space-y-3">
            {sectionHeader(
              "slots-heading",
              "Horaires des répétitions",
              "Page Rejoindre, section « Répétitions et engagement ». L'agenda des membres reste la référence pour les dates.",
              "/rejoindre#repetitions",
              () => setEditing({ kind: "slots", row: null }),
              "Ajouter un horaire",
            )}
            <ul className="space-y-3">
              {slots.map((slot, index) =>
                rowCard({
                  kind: "slots",
                  id: slot.id,
                  label: slot.group_name,
                  detail: slotSentence(slot),
                  hidden: slot.status === "archived",
                  index,
                  rows: slots,
                  onEdit: () => setEditing({ kind: "slots", row: slot }),
                }),
              )}
            </ul>
          </section>

          <section aria-labelledby="faq-heading" className="space-y-3">
            {sectionHeader(
              "faq-heading",
              "Questions fréquentes",
              `${faq.filter((f) => f.status === "published").length} questions sur la page FAQ, dans cet ordre.`,
              "/faq",
              () => setEditing({ kind: "faq", row: null }),
              "Ajouter une question",
            )}
            <ul className="space-y-3">
              {faq.map((item, index) =>
                rowCard({
                  kind: "faq",
                  id: item.id,
                  label: item.question,
                  detail: item.answer,
                  hidden: item.status === "archived",
                  index,
                  rows: faq,
                  onEdit: () => setEditing({ kind: "faq", row: item }),
                }),
              )}
            </ul>
          </section>
        </div>
      </DataState>

      <RowDialog
        open={editing?.kind === "slots"}
        onOpenChange={(open) => !open && setEditing(null)}
        onSubmit={(values) => save("slots", values, values.group_name)}
        isPending={createRow.isPending || updateRows.isPending}
        title={editing?.row ? "Modifier l'horaire" : "Nouvel horaire"}
        description="Il s'affiche sur la page Rejoindre dans les minutes qui suivent."
        submitLabel={editing?.row ? "Enregistrer" : "Ajouter"}
        fields={SLOT_FIELDS}
        initial={slotInitial}
        formId="slot-form"
      />

      <RowDialog
        open={editing?.kind === "faq"}
        onOpenChange={(open) => !open && setEditing(null)}
        onSubmit={(values) => save("faq", faqInput(values), values.question)}
        isPending={createRow.isPending || updateRows.isPending}
        title={editing?.row ? "Modifier la question" : "Nouvelle question"}
        description="Elle s'affiche sur la page FAQ dans les minutes qui suivent, à la fin de la liste pour une nouvelle."
        submitLabel={editing?.row ? "Enregistrer" : "Ajouter"}
        fields={FAQ_FIELDS}
        initial={faqInitial}
        validate={validateFaq}
        formId="faq-form"
      />

      <DeleteConfirmDialog
        open={deleting !== null}
        onOpenChange={(next) => {
          if (!next && !deleteRow.isPending) setDeleting(null);
        }}
        onConfirm={confirmDelete}
        title={`Supprimer « ${deleting?.label ?? ""} » ?`}
        description="Il disparaît pour de bon. Pour le retirer du site sans le perdre, masquez-le."
        isLoading={deleteRow.isPending}
      />
    </PageShell>
  );
}
