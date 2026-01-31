"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  useBugMessages,
  useCreateBugMessage,
  useMarkMessagesAsRead,
} from "@/hooks/useBugMessages";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useMyBugReports } from "@/hooks/useMyBugReports";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  MessageCircle,
  Send,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface MessagesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MessagesDialog({ open, onOpenChange }: MessagesDialogProps) {
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [showMobileChat, setShowMobileChat] = useState(false);

  const { data: bugReports = [], isLoading: isLoadingReports } =
    useMyBugReports();
  const { data: currentUser } = useCurrentUser();
  const { data: messages = [], isLoading: isLoadingMessages } = useBugMessages({
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
  useEffect(() => {
    if (!open) {
      setShowMobileChat(false);
    }
  }, [open]);

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
      toast.error("Erreur lors de l'envoi du message");
      console.error(error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-3 w-3" />;
      case "in_progress":
        return <AlertCircle className="h-3 w-3" />;
      case "resolved":
        return <CheckCircle2 className="h-3 w-3" />;
      default:
        return null;
    }
  };

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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "En attente";
      case "in_progress":
        return "En cours";
      case "resolved":
        return "Résolu";
      default:
        return status;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[85vh] p-0 lg:min-w-7xl">
        <div className="relative flex h-full overflow-hidden">
          {/* Left Sidebar - Conversations List */}
          <div
            className={cn(
              "flex w-full max-w-full flex-col overflow-hidden border-r bg-gray-50 transition-transform duration-300 ease-in-out md:w-96 md:max-w-96",
              "md:translate-x-0",
              showMobileChat
                ? "-translate-x-full md:translate-x-0"
                : "translate-x-0",
            )}
          >
            <DialogHeader className="border-b bg-white p-4">
              <DialogTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Mes messages
              </DialogTitle>
            </DialogHeader>

            <div className="w-full flex-1 overflow-x-hidden overflow-y-auto">
              {isLoadingReports ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  Chargement...
                </div>
              ) : bugReports.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  Aucun rapport de bug
                </div>
              ) : (
                <div className="flex w-full flex-col gap-1 p-2">
                  {bugReports.map((report) => (
                    <button
                      key={report.id}
                      onClick={() => handleSelectReport(report.id)}
                      className={cn(
                        "w-full overflow-hidden rounded-lg p-3 text-left transition-colors hover:bg-white",
                        selectedReportId === report.id
                          ? "bg-white shadow-sm"
                          : "bg-transparent",
                      )}
                    >
                      <div className="mb-1 flex min-w-0 items-start justify-between gap-2">
                        <h4 className="line-clamp-1 min-w-0 flex-1 truncate text-sm font-medium">
                          {report.title}
                        </h4>
                        <Badge
                          variant="secondary"
                          className={cn(
                            "flex h-5 shrink-0 items-center gap-1 px-1.5 py-0.5 text-[10px]",
                            getStatusColor(report.status),
                          )}
                        >
                          {getStatusIcon(report.status)}
                          <span className="whitespace-nowrap">
                            {getStatusLabel(report.status)}
                          </span>
                        </Badge>
                      </div>
                      {report.last_message ? (
                        <p className="truncate overflow-hidden text-xs text-gray-500">
                          {report.last_message.message}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-400 italic">
                          Aucun message
                        </p>
                      )}
                      <div className="mt-1 flex min-w-0 items-center justify-between gap-2">
                        <span className="shrink-0 text-[10px] text-gray-400">
                          {new Date(report.created_at).toLocaleDateString(
                            "fr-FR",
                            {
                              day: "numeric",
                              month: "short",
                            },
                          )}
                        </span>
                        <div className="flex shrink-0 items-center gap-2">
                          {report.message_count > 0 && (
                            <span className="text-[10px] whitespace-nowrap text-gray-400">
                              {report.message_count}{" "}
                              {report.message_count === 1
                                ? "message"
                                : "messages"}
                            </span>
                          )}
                          {report.unread_count > 0 && (
                            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-500 px-1.5 text-[10px] font-semibold text-white">
                              {report.unread_count}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Chat View */}
          <div
            className={cn(
              "absolute inset-0 flex flex-col bg-white transition-transform duration-300 ease-in-out md:relative md:flex-1",
              "md:translate-x-0",
              showMobileChat
                ? "translate-x-0"
                : "translate-x-full md:translate-x-0",
            )}
          >
            {selectedReport ? (
              <>
                {/* Chat Header */}
                <div className="border-b bg-gray-50 p-4">
                  <div className="flex items-start gap-3">
                    {/* Mobile Back Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 md:hidden"
                      onClick={handleBackToList}
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex min-w-0 flex-1 items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-semibold">
                          {selectedReport.title}
                        </h3>
                        <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                          {selectedReport.description}
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "ml-2 flex shrink-0 items-center gap-1 text-xs",
                          getStatusColor(selectedReport.status),
                        )}
                      >
                        {getStatusIcon(selectedReport.status)}
                        <span className="hidden sm:inline">
                          {getStatusLabel(selectedReport.status)}
                        </span>
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Messages Area */}
                <ScrollArea className="flex-1 bg-gray-50 p-4">
                  {isLoadingMessages ? (
                    <div className="text-center text-sm text-gray-500">
                      Chargement des messages...
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex h-full items-center justify-center">
                      <div className="text-center text-gray-500">
                        <MessageCircle className="mx-auto mb-2 h-12 w-12 text-gray-300" />
                        <p className="text-sm">Aucun message pour le moment</p>
                        <p className="mt-1 text-xs">
                          Envoyez un message pour démarrer la conversation
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {messages.map((message) => {
                        const isCurrentUser =
                          message.sender_id === currentUser?.id;
                        return (
                          <div
                            key={message.id}
                            className={cn(
                              "flex",
                              isCurrentUser ? "justify-end" : "justify-start",
                            )}
                          >
                            <div
                              className={cn(
                                "max-w-[70%] rounded-2xl px-4 py-2 shadow-sm",
                                isCurrentUser
                                  ? "rounded-br-sm bg-blue-500 text-white"
                                  : "rounded-bl-sm border border-gray-200 bg-white",
                              )}
                            >
                              {!isCurrentUser && (
                                <p className="mb-1 text-xs font-medium text-gray-700">
                                  {message.sender.display_name ||
                                    message.sender.email}
                                </p>
                              )}
                              <p className="text-sm break-words whitespace-pre-wrap">
                                {message.message}
                              </p>
                              <p
                                className={cn(
                                  "mt-1 text-[10px]",
                                  isCurrentUser
                                    ? "text-blue-100"
                                    : "text-gray-400",
                                )}
                              >
                                {new Date(
                                  message.created_at,
                                ).toLocaleTimeString("fr-FR", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>

                {/* Message Input */}
                <div className="border-t bg-white p-4">
                  <div className="flex gap-2">
                    <Textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Écrivez votre message..."
                      className="min-h-[60px] resize-none"
                      disabled={createMessageMutation.isPending}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={
                        createMessageMutation.isPending || !newMessage.trim()
                      }
                      className="self-end"
                      size="icon"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    Appuyez sur Entrée pour envoyer, Shift + Entrée pour une
                    nouvelle ligne
                  </p>
                </div>
              </>
            ) : (
              <div className="hidden h-full items-center justify-center text-gray-400 md:flex">
                <div className="text-center">
                  <MessageCircle className="mx-auto mb-4 h-16 w-16 text-gray-300" />
                  <p className="text-sm">Sélectionnez une conversation</p>
                  <p className="mt-1 text-xs">
                    Choisissez un rapport de bug pour voir les messages
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
