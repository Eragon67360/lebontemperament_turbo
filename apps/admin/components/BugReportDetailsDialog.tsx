// components/BugReportDetailsDialog.tsx
import { Button } from "@/components/ui/button";
import {
  DataState,
  EmptyState,
  ListSkeleton,
} from "@/components/ui/data-state";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/ui/status-badge";
import { Textarea } from "@/components/ui/textarea";
import { useBugMessages, useCreateBugMessage } from "@/hooks/useBugMessages";
import {
  bugReportStatusLabel,
  bugReportStatusTone,
  formatReportDate,
  personName,
} from "@/utils/bug-reports/status";
import { Loader2, MessageSquare, Send } from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";

// Export BugMessage type for reuse
export type { BugMessage } from "@/types/bugMessages";

interface BugReportDetailsProps {
  report: {
    id: string;
    title: string;
    description: string;
    status: "pending" | "in_progress" | "resolved";
    created_at: string;
    profiles: {
      email: string;
      display_name: string | null;
    };
  };
}

/**
 * « Voir les détails » of a signalement: the report itself, then the
 * conversation with its author and the reply box.
 */
export function BugReportDetailsDialog({ report }: BugReportDetailsProps) {
  const [newMessage, setNewMessage] = useState("");
  const [open, setOpen] = useState(false);
  const baseId = useId();

  // Use TanStack Query hooks for data fetching and mutations
  const {
    data: messages = [],
    isPending,
    isError,
    refetch,
  } = useBugMessages({
    bug_report_id: report.id,
  });
  const createMessageMutation = useCreateBugMessage();

  const sendMessage = async () => {
    if (!newMessage.trim()) {
      toast.error("Le message ne peut pas être vide");
      return;
    }

    try {
      await createMessageMutation.mutateAsync({
        bug_report_id: report.id,
        message: newMessage.trim(),
      });

      toast.success("Message envoyé");
      setNewMessage("");
    } catch (error) {
      toast.error("Le message n'a pas pu être envoyé");
      console.error(error);
    }
  };

  const isSending = createMessageMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full sm:w-auto">
          Voir les détails
          <span className="sr-only"> de « {report.title} »</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="break-words">{report.title}</DialogTitle>
          <DialogDescription className="break-words">
            Signalé par {personName(report.profiles)} le{" "}
            {formatReportDate(report.created_at)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <StatusBadge tone={bugReportStatusTone(report.status)}>
            {bugReportStatusLabel(report.status)}
          </StatusBadge>
          <div className="bg-muted rounded-md p-4">
            <h3 className="sr-only">Description</h3>
            <p className="text-detail text-foreground break-words whitespace-pre-wrap">
              {report.description}
            </p>
          </div>
        </div>

        <section aria-labelledby={`${baseId}-messages`} className="space-y-3">
          <h3
            id={`${baseId}-messages`}
            className="text-body text-foreground font-semibold"
          >
            Messages
          </h3>
          <DataState
            isLoading={isPending}
            isError={isError}
            isEmpty={messages.length === 0}
            onRetry={() => refetch()}
            errorDescription="Les messages de ce signalement n'ont pas pu être chargés."
            skeleton={
              <ListSkeleton rows={2} label="Chargement des messages…" />
            }
            empty={
              <EmptyState
                icon={MessageSquare}
                title="Aucun message pour le moment"
                description="Écrivez à la personne qui a fait ce signalement : elle lira votre réponse dans ses messages."
                className="py-6"
              />
            }
          >
            {/* A plain scroller: ScrollArea's viewport cannot scroll under a max-height alone. */}
            <div
              className="max-h-64 overflow-y-auto"
              tabIndex={0}
              aria-label="Messages du signalement"
            >
              <ul className="space-y-2">
                {messages.map((message) => (
                  <li
                    key={message.id}
                    className="bg-muted list-none rounded-md p-3"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                      <span className="text-detail text-foreground min-w-0 truncate font-medium">
                        {personName(message.sender)}
                      </span>
                      <span className="text-note text-muted-foreground">
                        {new Date(message.created_at).toLocaleString("fr-FR")}
                      </span>
                    </div>
                    <p className="text-detail text-foreground mt-1 break-words whitespace-pre-wrap">
                      {message.message}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </DataState>

          <div className="space-y-2">
            <Label htmlFor={`${baseId}-reply`}>Votre réponse</Label>
            <Textarea
              id={`${baseId}-reply`}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Écrivez votre message…"
              disabled={isSending}
            />
            <div className="flex sm:justify-end">
              <Button
                onClick={sendMessage}
                disabled={isSending}
                aria-busy={isSending || undefined}
                className="w-full sm:w-auto"
              >
                {isSending ? (
                  <Loader2 className="animate-spin" aria-hidden />
                ) : (
                  <Send aria-hidden />
                )}
                {isSending ? "Envoi…" : "Envoyer le message"}
              </Button>
            </div>
          </div>
        </section>
      </DialogContent>
    </Dialog>
  );
}
