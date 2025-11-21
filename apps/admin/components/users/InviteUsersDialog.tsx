import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InvitationProgress } from "@/types/user";
import { Check, Plus, RefreshCw, Send, X, Upload } from "lucide-react";
import Papa from "papaparse";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Progress } from "../ui/progress";

type InvitationStatus = "pending" | "sending" | "sent" | "error";
interface CSVRow {
  "NOM Prénom": string;
  "Adresse mail": string;
}

interface InvitationEntry {
  email: string;
  displayName: string;
  role: "user" | "admin";
  status: InvitationStatus;
  errorMessage?: string;
}

interface InviteUserDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}
interface InvitationResult {
  success: boolean;
  error?: string;
}
interface ApiResponse {
  invitationResults: InvitationResult[];
  error?: string;
}

const emailSchema = z.string().email("Format d'email invalide");
const MAX_INVITATIONS = 200;

export function InviteUserDialog({
  isOpen,
  onOpenChange,
  onSuccess,
}: InviteUserDialogProps) {
  const [invitations, setInvitations] = useState<InvitationEntry[]>([
    { email: "", displayName: "", role: "user", status: "pending" },
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<InvitationProgress>({
    current: 0,
    total: 0,
    percentage: 0,
  });

  const resetState = () => {
    setInvitations([
      { email: "", displayName: "", role: "user", status: "pending" },
    ]);
    setIsProcessing(false);
    setProgress({ current: 0, total: 0, percentage: 0 });
  };

  const addInvitationField = () => {
    setInvitations([
      ...invitations,
      { email: "", displayName: "", role: "user", status: "pending" },
    ]);
  };

  const removeInvitationField = (index: number) => {
    const newInvitations = [...invitations];
    newInvitations.splice(index, 1);
    setInvitations(newInvitations);
  };

  const updateInvitation = (
    index: number,
    field: keyof InvitationEntry,
    value: string | InvitationStatus | "user" | "admin",
  ): void => {
    setInvitations((prevInvitations) =>
      prevInvitations.map((invitation, i) =>
        i === index ? { ...invitation, [field]: value } : invitation,
      ),
    );
  };

  const sendInvitations = async () => {
    if (invitations.length > MAX_INVITATIONS) {
      toast.error("Limite dépassée", {
        description: `Vous ne pouvez pas inviter plus de ${MAX_INVITATIONS} utilisateurs à la fois.`,
      });
      return;
    }

    const validationErrors = invitations
      .map((inv, index) => {
        try {
          emailSchema.parse(inv.email.trim());
          if (!inv.displayName.trim()) {
            throw new Error("Le nom complet est requis");
          }
          return null;
        } catch (error) {
          return {
            index,
            error:
              error instanceof z.ZodError
                ? error.errors[0]?.message
                : error instanceof Error
                  ? error.message
                  : "Données invalides",
          };
        }
      })
      .filter(Boolean);

    if (validationErrors.length > 0) {
      const definedValidationErrors = validationErrors.filter(
        (err): err is { index: number; error: string } => err !== null,
      );

      setInvitations((prevInvitations) =>
        prevInvitations.map((invitation, index) => {
          const errorForThis = definedValidationErrors.find(
            (err) => err.index === index,
          );
          if (errorForThis) {
            return {
              ...invitation,
              status: "error" as const,
              errorMessage: errorForThis.error,
            };
          }
          return invitation;
        }),
      );
      return;
    }

    setIsProcessing(true);
    setProgress({ current: 0, total: invitations.length, percentage: 0 });

    try {
      const response = await fetch("/api/invite-users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          emails: invitations
            .filter((inv) => inv.email.trim() && inv.displayName.trim())
            .map((inv) => ({
              email: inv.email.trim(),
              displayName: inv.displayName.trim(),
            })),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Échec de l'invitation");
      }

      const updatedInvitations: InvitationEntry[] = invitations.map(
        (invitation) => {
          if (!invitation.email.trim()) return invitation;

          const invitationResult = result.invitationResults.find(
            (r: { email: string }) => r.email === invitation.email.trim(),
          );

          return {
            ...invitation,
            status: invitationResult?.success
              ? ("sent" as const)
              : ("error" as const),
            errorMessage: invitationResult?.success
              ? undefined
              : invitationResult?.error || "Échec de l'invitation",
          };
        },
      );

      setInvitations(updatedInvitations);

      // Toast notifications
      if (result.summary.failed > 0) {
        toast.error("Certaines invitations ont échoué", {
          description: `${result.summary.failed} invitation(s) n'ont pas pu être envoyées.`,
        });
        onSuccess();
      } else {
        onSuccess();
        toast.success("Toutes les invitations ont été envoyées", {
          description: "Les utilisateurs recevront un email d'invitation.",
        });
      }
    } catch (error) {
      toast.error("Erreur", {
        description:
          error instanceof Error
            ? error.message
            : "Une erreur est survenue lors de l'envoi des invitations",
      });
    } finally {
      setIsProcessing(false);
      setProgress({ current: 0, total: 0, percentage: 0 });
    }
  };

  const resendInvitation = async (index: number): Promise<void> => {
    // Initial validation
    if (index < 0 || index >= invitations.length) {
      console.error("Invalid invitation index");
      return;
    }

    // Set status to sending
    setInvitations((prevInvitations) =>
      prevInvitations.map((invitation, i) =>
        i === index
          ? { ...invitation, status: "sending" as const }
          : invitation,
      ),
    );

    try {
      const invitation = invitations[index];
      const emailTrimmed = invitation?.email.trim();

      // Validate email
      emailSchema.parse(emailTrimmed);

      // Send invitation via API route
      const response = await fetch("/api/invite-users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          emails: [emailTrimmed],
        }),
      });

      const result = (await response.json()) as ApiResponse;

      if (!response.ok) {
        throw new Error(result.error || "Échec de l'invitation");
      }

      const invitationResult = result.invitationResults[0];

      setInvitations((prevInvitations) =>
        prevInvitations.map((inv, i) => {
          if (i !== index) return inv;

          if (invitationResult?.success) {
            toast.success("Invitation renvoyée", {
              description: `L'invitation à ${emailTrimmed} a été envoyée avec succès.`,
            });

            return {
              ...inv,
              status: "sent" as const,
              errorMessage: undefined,
            };
          } else {
            const errorMessage =
              invitationResult?.error || "Échec de l'invitation";

            toast.error("Échec de l'invitation", {
              description:
                errorMessage ||
                `Impossible de renvoyer l'invitation à ${emailTrimmed}`,
            });

            return {
              ...inv,
              status: "error" as const,
              errorMessage,
            };
          }
        }),
      );
    } catch (error) {
      // Handle errors and update state
      const errorMessage =
        error instanceof z.ZodError
          ? "Format d'email invalide"
          : error instanceof Error
            ? error.message
            : "Échec de l'invitation";

      setInvitations((prevInvitations) =>
        prevInvitations.map((inv, i) =>
          i === index
            ? {
                ...inv,
                status: "error" as const,
                errorMessage,
              }
            : inv,
        ),
      );

      toast.error("Erreur", {
        description:
          error instanceof Error
            ? error.message
            : "Une erreur est survenue lors du renvoi de l'invitation",
      });
    }
  };

  const formatName = (fullName: string) => {
    const [lastName, firstName] = fullName.split(" ").filter(Boolean);
    return firstName && lastName ? `${firstName} ${lastName}` : fullName;
  };

  const handleCSVImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: (results) => {
        const validData = (results.data as CSVRow[])
          .filter((row) => row["NOM Prénom"] && row["Adresse mail"])
          .map((row) => ({
            email: row["Adresse mail"].trim(),
            displayName: formatName(row["NOM Prénom"].trim()),
            role: "user" as const,
            status: "pending" as const,
          }));

        setInvitations(validData);

        toast.success("CSV importé avec succès", {
          description: `${validData.length} entrées ont été importées.`,
        });
      },
      error: (error) => {
        toast.error("Erreur lors de l'import", {
          description: error.message,
        });
      },
    });
  };

  const isInvitationReady = invitations.some((inv) => inv.email.trim() !== "");
  const allSent = invitations.every(
    (inv) => inv.status === "sent" || inv.email.trim() === "",
  );

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          resetState();
        }
        onOpenChange(open);
      }}
    >
      <DialogContent className="max-w-[95vw] rounded-md sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Inviter des Utilisateurs</DialogTitle>
          <DialogDescription>
            Invitez jusqu&apos;à {MAX_INVITATIONS} utilisateurs à la fois. Les
            invitations seront envoyées par lots.
          </DialogDescription>
        </DialogHeader>
        <div className="mb-4 flex justify-end">
          <div className="relative">
            <input
              type="file"
              accept=".csv"
              onChange={handleCSVImport}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
            <Button variant="outline" size="sm" className="text-xs sm:text-sm">
              <Upload className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Importer CSV</span>
              <span className="sm:hidden">CSV</span>
            </Button>
          </div>
        </div>
        <div className="max-h-[400px] space-y-3 overflow-y-auto py-2 pr-2 pl-1 sm:pr-4 sm:pl-2">
          <div className="hidden grid-cols-2 gap-4 sm:grid">
            <Label>Nom complet</Label>
            <Label>Email</Label>
          </div>
          {invitations.map((invitation, index) => (
            <div
              key={index}
              className="flex items-start gap-2 rounded-lg border border-gray-100 p-3 sm:items-center sm:border-0 sm:p-0"
            >
              <div className="flex-grow space-y-2 sm:space-y-0">
                {/* Mobile: Stacked layout */}
                <div className="flex flex-col gap-2 sm:hidden">
                  <div>
                    <Label
                      htmlFor={`displayName-${index}`}
                      className="text-xs text-gray-600"
                    >
                      Nom complet
                    </Label>
                    <Input
                      id={`displayName-${index}`}
                      placeholder="Jean Dupont"
                      value={invitation.displayName}
                      onChange={(e) =>
                        updateInvitation(index, "displayName", e.target.value)
                      }
                      disabled={invitation.status === "sent"}
                      className={
                        invitation.status === "error"
                          ? "border-destructive focus-visible:ring-destructive"
                          : ""
                      }
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor={`email-${index}`}
                      className="text-xs text-gray-600"
                    >
                      Email
                    </Label>
                    <Input
                      id={`email-${index}`}
                      placeholder="exemple@domaine.com"
                      value={invitation.email}
                      onChange={(e) =>
                        updateInvitation(index, "email", e.target.value)
                      }
                      disabled={invitation.status === "sent"}
                      className={
                        invitation.status === "error"
                          ? "border-destructive focus-visible:ring-destructive"
                          : ""
                      }
                    />
                    {invitation.status === "error" &&
                      invitation.errorMessage && (
                        <p className="text-destructive mt-1 text-xs">
                          {invitation.errorMessage}
                        </p>
                      )}
                  </div>
                </div>

                {/* Desktop: Grid layout */}
                <div className="hidden grid-cols-2 gap-4 sm:grid">
                  <div>
                    <Input
                      id={`displayName-${index}`}
                      placeholder="Jean Dupont"
                      value={invitation.displayName}
                      onChange={(e) =>
                        updateInvitation(index, "displayName", e.target.value)
                      }
                      disabled={invitation.status === "sent"}
                      className={
                        invitation.status === "error"
                          ? "border-destructive focus-visible:ring-destructive"
                          : ""
                      }
                    />
                  </div>
                  <div>
                    <Input
                      id={`email-${index}`}
                      placeholder="exemple@domaine.com"
                      value={invitation.email}
                      onChange={(e) =>
                        updateInvitation(index, "email", e.target.value)
                      }
                      disabled={invitation.status === "sent"}
                      className={
                        invitation.status === "error"
                          ? "border-destructive focus-visible:ring-destructive"
                          : ""
                      }
                    />
                    {invitation.status === "error" &&
                      invitation.errorMessage && (
                        <p className="text-destructive mt-1 text-xs">
                          {invitation.errorMessage}
                        </p>
                      )}
                  </div>
                </div>
              </div>
              <div className="flex w-[36px] flex-shrink-0 items-center justify-center sm:w-[50px]">
                {invitation.status === "pending" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => removeInvitationField(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
                {invitation.status === "sending" && (
                  <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
                )}
                {invitation.status === "sent" && (
                  <Check className="h-4 w-4 text-green-500" />
                )}
                {invitation.status === "error" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => resendInvitation(index)}
                  >
                    <RefreshCw className="h-4 w-4 text-red-500" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={addInvitationField}
            className="w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" /> Ajouter un email
          </Button>
          <p className="text-muted-foreground text-center text-xs sm:text-sm">
            {invitations.length} personne{invitations.length > 1 ? "s" : ""}
          </p>
        </div>
        {isProcessing && (
          <div className="space-y-2">
            <Progress value={progress.percentage} />
            <p className="text-muted-foreground text-center text-sm">
              Traitement en cours : {progress.current} sur {progress.total} (
              {progress.percentage}%)
            </p>
          </div>
        )}
        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={() => {
              resetState();
              onOpenChange(false);
            }}
            disabled={isProcessing && !allSent}
            className="w-full sm:w-auto"
          >
            Annuler
          </Button>
          <Button
            onClick={sendInvitations}
            disabled={!isInvitationReady || isProcessing}
            className="w-full sm:w-auto"
          >
            {isProcessing ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            <span className="hidden sm:inline">Envoyer les invitations</span>
            <span className="sm:hidden">Envoyer</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
