"use client";

import {
  ConversationRow,
  MessageBubble,
} from "@/components/bug-reports/ConversationRow";
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
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StatusBadge } from "@/components/ui/status-badge";
import { Textarea } from "@/components/ui/textarea";
import {
  useBugMessages,
  useCreateBugMessage,
  useMarkMessagesAsRead,
} from "@/hooks/useBugMessages";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useMyBugReports } from "@/hooks/useMyBugReports";
import { useResetOnChange } from "@/hooks/useResetOnChange";
import { cn } from "@/lib/utils";
import {
  bugReportStatusLabel,
  bugReportStatusTone,
} from "@/utils/bug-reports/status";
import { ArrowLeft, Loader2, MessageCircle, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface MessagesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * The account menu's « Messages »: the signalements you sent on the left,
 * the conversation with the team on the right. On phones the two panes
 * slide: the list first, then the conversation with a back button.
 */
export function MessagesDialog({ open, onOpenChange }: MessagesDialogProps) {
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [showMobileChat, setShowMobileChat] = useState(false);

  const {
    data: bugReports = [],
    isLoading: isLoadingReports,
    isError: isReportsError,
    refetch: refetchReports,
  } = useMyBugReports();
  const { data: currentUser } = useCurrentUser();
  const {
    data: messages = [],
    isLoading: isLoadingMessages,
    isError: isMessagesError,
    refetch: refetchMessages,
  } = useBugMessages({
    bug_report_id: selectedReportId || "",
  });
  const createMessageMutation = useCreateBugMessage();
  const markAsReadMutation = useMarkMessagesAsRead();

  const selectedReport = bugReports.find((r) => r.id === selectedReportId);

  const handleSelectReport = (reportId: string) => {
    setSelectedReportId(reportId);
    setShowMobileChat(true);

    // Mark messages as read
    markAsReadMutation.mutate(reportId);
  };

  const handleBackToList = () => {
    setShowMobileChat(false);
  };

  // Reset mobile view when dialog is closed
  useResetOnChange([open], () => {
    if (!open) {
      setShowMobileChat(false);
    }
  });

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedReportId) {
      toast.error("Le message ne peut pas être vide");
      return;
    }

    try {
      await createMessageMutation.mutateAsync({
        bug_report_id: selectedReportId,
        message: newMessage.trim(),
      });

      setNewMessage("");
    } catch (error) {
      toast.error("Le message n'a pas pu être envoyé");
      console.error(error);
    }
  };

  const isSending = createMessageMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[85dvh] gap-0 overflow-hidden p-0 sm:p-0 md:max-w-[calc(100%-4rem)] xl:max-w-6xl">
        <div className="relative flex h-full min-h-0 overflow-hidden">
          {/* Conversations */}
          <div
            className={cn(
              "bg-surface-sunken border-border flex w-full max-w-full flex-col overflow-hidden border-r transition-transform duration-300 ease-in-out motion-reduce:transition-none md:w-96 md:max-w-96",
              "md:translate-x-0",
              showMobileChat
                ? "-translate-x-full md:translate-x-0"
                : "translate-x-0",
            )}
          >
            <DialogHeader className="border-border bg-card border-b p-4 pr-14 text-left">
              <DialogTitle className="flex items-center gap-2">
                <MessageCircle
                  className="text-primary size-5 shrink-0"
                  aria-hidden
                />
                Mes messages
              </DialogTitle>
              <DialogDescription>
                Vos signalements et les réponses de l&apos;équipe.
              </DialogDescription>
            </DialogHeader>

            <div className="w-full flex-1 overflow-x-hidden overflow-y-auto">
              <DataState
                isLoading={isLoadingReports}
                isError={isReportsError}
                isEmpty={bugReports.length === 0}
                onRetry={() => refetchReports()}
                errorDescription="Vos signalements n'ont pas pu être chargés."
                skeleton={
                  <ListSkeleton
                    rows={4}
                    className="p-2"
                    label="Chargement de vos signalements…"
                  />
                }
                empty={
                  <EmptyState
                    icon={MessageCircle}
                    title="Aucun signalement"
                    description="Ce que vous envoyez avec « Signaler un problème » apparaît ici, avec les réponses de l'équipe."
                    className="py-8"
                  />
                }
              >
                <ul className="flex w-full flex-col gap-1 p-2">
                  {bugReports.map((report) => (
                    <li key={report.id} className="list-none">
                      <ConversationRow
                        report={report}
                        selected={selectedReportId === report.id}
                        onSelect={() => handleSelectReport(report.id)}
                      />
                    </li>
                  ))}
                </ul>
              </DataState>
            </div>
          </div>

          {/* Conversation */}
          <div
            className={cn(
              "bg-card absolute inset-0 flex flex-col transition-transform duration-300 ease-in-out motion-reduce:transition-none md:relative md:flex-1",
              "md:translate-x-0",
              showMobileChat
                ? "translate-x-0"
                : "translate-x-full md:translate-x-0",
            )}
          >
            {selectedReport ? (
              <>
                <div className="border-border bg-card border-b p-4 pr-14">
                  <div className="flex items-start gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="-my-1 shrink-0 md:hidden"
                      onClick={handleBackToList}
                    >
                      <ArrowLeft aria-hidden />
                      <span className="sr-only">Retour à mes messages</span>
                    </Button>
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <h3 className="text-body text-foreground min-w-0 truncate font-semibold">
                          {selectedReport.title}
                        </h3>
                        <StatusBadge
                          tone={bugReportStatusTone(selectedReport.status)}
                        >
                          {bugReportStatusLabel(selectedReport.status)}
                        </StatusBadge>
                      </div>
                      <p className="text-note text-muted-foreground line-clamp-2">
                        {selectedReport.description}
                      </p>
                    </div>
                  </div>
                </div>

                <ScrollArea className="bg-surface-sunken flex-1 p-4">
                  <DataState
                    isLoading={isLoadingMessages}
                    isError={isMessagesError}
                    isEmpty={messages.length === 0}
                    onRetry={() => refetchMessages()}
                    errorDescription="Les messages de ce signalement n'ont pas pu être chargés."
                    skeleton={
                      <ListSkeleton rows={3} label="Chargement des messages…" />
                    }
                    empty={
                      <EmptyState
                        icon={MessageCircle}
                        title="Aucun message pour le moment"
                        description="Envoyez un message pour démarrer la conversation avec l'équipe."
                      />
                    }
                  >
                    <ul className="space-y-3">
                      {messages.map((message) => (
                        <li key={message.id} className="list-none">
                          <MessageBubble
                            message={message}
                            isMine={message.sender_id === currentUser?.id}
                          />
                        </li>
                      ))}
                    </ul>
                  </DataState>
                </ScrollArea>

                <div className="border-border bg-card border-t p-4">
                  <div className="flex gap-2">
                    <Textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Écrivez votre message…"
                      aria-label="Votre message"
                      aria-describedby="messages-send-hint"
                      className="min-h-16 resize-none"
                      disabled={isSending}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={isSending || !newMessage.trim()}
                      aria-busy={isSending || undefined}
                      className="self-end"
                      size="icon"
                    >
                      {isSending ? (
                        <Loader2 className="animate-spin" aria-hidden />
                      ) : (
                        <Send aria-hidden />
                      )}
                      <span className="sr-only">Envoyer le message</span>
                    </Button>
                  </div>
                  <p
                    id="messages-send-hint"
                    className="text-note text-muted-foreground mt-1"
                  >
                    Entrée pour envoyer, Maj + Entrée pour aller à la ligne.
                  </p>
                </div>
              </>
            ) : (
              <div className="hidden h-full items-center justify-center md:flex">
                <EmptyState
                  icon={MessageCircle}
                  title="Choisissez une conversation"
                  description="Sélectionnez un signalement à gauche pour lire ses messages."
                />
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
