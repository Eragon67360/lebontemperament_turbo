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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useBugMessages, useCreateBugMessage } from "@/hooks/useBugMessages";
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
  const { data: messages = [], isLoading } = useBugMessages({
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
        <Button variant="outline">Voir les détails</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Détails du rapport</DialogTitle>
        </DialogHeader>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">{report.title}</CardTitle>
                <CardDescription>
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
              <Badge className={`${getStatusColor(report.status)} capitalize`}>
                {report.status === "pending"
                  ? "En attente"
                  : report.status === "in_progress"
                    ? "En cours"
                    : "Résolu"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mt-2">
              <h4 className="mb-2 text-sm font-medium text-gray-500">
                Description
              </h4>
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-sm whitespace-pre-wrap text-gray-700">
                  {report.description}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="mt-6">
          <h4 className="mb-2 text-sm font-medium">Messages</h4>
          <ScrollArea className="max-h-[200px] space-y-2 overflow-y-auto">
            {isLoading ? (
              <div className="text-center text-sm text-gray-500">
                Chargement des messages...
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-sm text-gray-500">
                Aucun message pour le moment
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className="rounded-lg bg-gray-50 p-3">
                  <div className="flex items-start justify-between">
                    <span className="text-sm font-medium">
                      {message.sender.display_name || message.sender.email}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(message.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-1 text-sm">{message.message}</p>
                </div>
              ))
            )}
          </ScrollArea>

          <div className="mt-4">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Écrivez votre message..."
              className="mb-2"
              disabled={createMessageMutation.isPending}
            />
            <Button
              onClick={sendMessage}
              disabled={createMessageMutation.isPending}
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
