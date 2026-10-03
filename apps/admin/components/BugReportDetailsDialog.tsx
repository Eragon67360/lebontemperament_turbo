// components/BugReportDetailsDialog.tsx
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DataState,
  EmptyState,
  ListSkeleton,
} from "@/components/ui/data-state";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useBugMessages, useCreateBugMessage } from "@/hooks/useBugMessages";
import { MessageSquare } from "lucide-react";
import { useState } from "react";
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

const getStatusColor = (status: string) => {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "in_progress":
      return "bg-blue-100 text-blue-800";
    case "resolved":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export function BugReportDetailsDialog({ report }: BugReportDetailsProps) {
  const [newMessage, setNewMessage] = useState("");
  const [open, setOpen] = useState(false);

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

      toast.success("Message envoyé avec succès");
      setNewMessage("");
    } catch (error) {
      toast.error("Erreur lors de l'envoi du message");
      console.error(error);
    }
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="min-h-11 w-full sm:w-auto">
          Voir les détails
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Détails du rapport</DialogTitle>
        </DialogHeader>
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <div className="min-w-0 space-y-1.5">
                <CardTitle className="text-lg break-words sm:text-xl">
                  {report.title}
                </CardTitle>
                <CardDescription className="break-words">
                  Signalé par{" "}
                  {report.profiles.display_name || report.profiles.email} le{" "}
                  {new Date(report.created_at).toLocaleDateString("fr-FR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </CardDescription>
              </div>
              <Badge
                className={`${getStatusColor(report.status)} w-fit shrink-0 capitalize`}
              >
                {report.status === "pending"
                  ? "En attente"
                  : report.status === "in_progress"
                    ? "En cours"
                    : "Résolu"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <div className="mt-2">
              <h3 className="mb-2 text-sm font-medium text-gray-500">
                Description
              </h3>
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-sm break-words whitespace-pre-wrap text-gray-700">
                  {report.description}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <div>
          <h3 className="mb-2 text-sm font-medium">Messages</h3>
          <DataState
            isLoading={isPending}
            isError={isError}
            isEmpty={messages.length === 0}
            onRetry={() => refetch()}
            errorDescription="Impossible de charger les messages de ce rapport."
            skeleton={
              <ListSkeleton rows={2} label="Chargement des messages…" />
            }
            empty={
              <EmptyState
                icon={MessageSquare}
                title="Aucun message pour le moment"
                description="Démarrez la conversation avec la personne qui a signalé ce bug."
                className="py-8"
              />
            }
          >
            <ScrollArea className="max-h-[200px]">
              <div className="space-y-2">
                {messages.map((message) => (
                  <div key={message.id} className="rounded-lg bg-gray-50 p-3">
                    <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                      <span className="min-w-0 truncate text-sm font-medium">
                        {message.sender.display_name || message.sender.email}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {new Date(message.created_at).toLocaleString("fr-FR")}
                      </span>
                    </div>
                    <p className="mt-1 text-sm break-words">
                      {message.message}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </DataState>

          <div className="mt-4">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Écrivez votre message..."
              aria-label="Nouveau message"
              className="mb-2"
              disabled={createMessageMutation.isPending}
            />
            <Button
              onClick={sendMessage}
              disabled={createMessageMutation.isPending}
              className="min-h-11 w-full sm:w-auto"
            >
              {createMessageMutation.isPending
                ? "Envoi en cours..."
                : "Envoyer le message"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
