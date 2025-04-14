
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InvitationProgress } from "@/types/user";
import { Check, Plus, RefreshCw, Send, X, Upload } from "lucide-react";
import Papa from "papaparse";
import { useState } from 'react';
import { toast } from "sonner";
import { z } from "zod";
import { Progress } from "../ui/progress";

type InvitationStatus = 'pending' | 'sending' | 'sent' | 'error';
interface CSVRow {
  "NOM Prénom": string;
  "Adresse mail": string;
}

interface InvitationEntry {
  email: string;
  displayName: string;
  role: 'user' | 'admin';
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

export function InviteUserDialog({ isOpen, onOpenChange, onSuccess }: InviteUserDialogProps) {
  const [invitations, setInvitations] = useState<InvitationEntry[]>([
    { email: '', displayName: '', role: 'user', status: 'pending' }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<InvitationProgress>({
    current: 0,
    total: 0,
    percentage: 0
  });

  const resetState = () => {
    setInvitations([{ email: '', displayName: '', role: 'user', status: 'pending' }]);
    setIsProcessing(false);
    setProgress({ current: 0, total: 0, percentage: 0 });
  };

  const addInvitationField = () => {
    setInvitations([...invitations, { email: '', displayName: '', role: 'user', status: 'pending' }]);
  };

  const removeInvitationField = (index: number) => {
    const newInvitations = [...invitations];
    newInvitations.splice(index, 1);
    setInvitations(newInvitations);
  };

  const updateInvitation = (
    index: number,
    field: keyof InvitationEntry,
    value: string | InvitationStatus | 'user' | 'admin'
  ): void => {
    setInvitations(prevInvitations =>
      prevInvitations.map((invitation, i) =>
        i === index
          ? { ...invitation, [field]: value }
          : invitation
      )
    );
  };

  const sendInvitations = async () => {
    if (invitations.length > MAX_INVITATIONS) {
      toast.error("Limite dépassée", {
        description: `Vous ne pouvez pas inviter plus de ${MAX_INVITATIONS} utilisateurs à la fois.`
      });
      return;
    }

    const validationErrors = invitations.map((inv, index) => {
      try {
        emailSchema.parse(inv.email.trim());
        if (!inv.displayName.trim()) {
          throw new Error("Le nom complet est requis");
        }
        return null;
      } catch (error) {
        return {
          index,
          error: error instanceof z.ZodError
            ? error.errors[0]?.message
            : error instanceof Error
              ? error.message
              : 'Données invalides'
        };
      }
    }).filter(Boolean);

    if (validationErrors.length > 0) {
      const definedValidationErrors = validationErrors.filter(
        (err): err is { index: number; error: string } => err !== null
      );

      setInvitations(prevInvitations =>
        prevInvitations.map((invitation, index) => {
          const errorForThis = definedValidationErrors.find(err => err.index === index);
          if (errorForThis) {
            return {
              ...invitation,
              status: 'error' as const,
              errorMessage: errorForThis.error
            };
          }
          return invitation;
        })
      );
      return;
    }

    setIsProcessing(true);
    setProgress({ current: 0, total: invitations.length, percentage: 0 });

    try {

      const response = await fetch('/api/invite-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emails: invitations
            .filter(inv => inv.email.trim() && inv.displayName.trim())
            .map(inv => ({
              email: inv.email.trim(),
              displayName: inv.displayName.trim()
            }))
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Échec de l\'invitation');
      }

      const updatedInvitations: InvitationEntry[] = invitations.map(invitation => {
        if (!invitation.email.trim()) return invitation;

        const invitationResult = result.invitationResults.find(
          (r: { email: string }) => r.email === invitation.email.trim()
        );

        return {
          ...invitation,
          status: invitationResult?.success ? ('sent' as const) : ('error' as const),
          errorMessage: invitationResult?.success ? undefined : (invitationResult?.error || 'Échec de l\'invitation')
        };
      });

      setInvitations(updatedInvitations);

      // Toast notifications
      if (result.summary.failed > 0) {
        toast.error("Certaines invitations ont échoué", {
          description: `${result.summary.failed} invitation(s) n'ont pas pu être envoyées.`
        });
        onSuccess();
      } else {
        onSuccess();
        toast.success("Toutes les invitations ont été envoyées", {
          description: "Les utilisateurs recevront un email d'invitation."
        });
      }

    } catch (error) {
      toast.error("Erreur", {
        description: error instanceof Error
          ? error.message
          : 'Une erreur est survenue lors de l\'envoi des invitations'
      });
    } finally {
      setIsProcessing(false);
      setProgress({ current: 0, total: 0, percentage: 0 });
    }
  };

  const resendInvitation = async (index: number): Promise<void> => {
    // Initial validation
    if (index < 0 || index >= invitations.length) {
      console.error('Invalid invitation index');
      return;
    }

    // Set status to sending
    setInvitations(prevInvitations =>
      prevInvitations.map((invitation, i) =>
        i === index
          ? { ...invitation, status: 'sending' as const }
          : invitation
      )
    );

    try {
      const invitation = invitations[index];
      const emailTrimmed = invitation?.email.trim();

      // Validate email
      emailSchema.parse(emailTrimmed);

      // Send invitation via API route
      const response = await fetch('/api/invite-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emails: [emailTrimmed]
        })
      });

      const result = await response.json() as ApiResponse;

      if (!response.ok) {
        throw new Error(result.error || 'Échec de l\'invitation');
      }

      const invitationResult = result.invitationResults[0];

      setInvitations(prevInvitations =>
        prevInvitations.map((inv, i) => {
          if (i !== index) return inv;

          if (invitationResult?.success) {
            toast.success("Invitation renvoyée", {
              description: `L'invitation à ${emailTrimmed} a été envoyée avec succès.`
            });

            return {
              ...inv,
              status: 'sent' as const,
              errorMessage: undefined
            };
          } else {
            const errorMessage = invitationResult?.error || 'Échec de l\'invitation';

            toast.error("Échec de l'invitation", {
              description: errorMessage || `Impossible de renvoyer l'invitation à ${emailTrimmed}`
            });

            return {
              ...inv,
              status: 'error' as const,
              errorMessage
            };
          }
        })
      );

    } catch (error) {
      // Handle errors and update state
      const errorMessage = error instanceof z.ZodError
        ? 'Format d\'email invalide'
        : error instanceof Error
          ? error.message
          : 'Échec de l\'invitation';

      setInvitations(prevInvitations =>
        prevInvitations.map((inv, i) =>
          i === index
            ? {
              ...inv,
              status: 'error' as const,
              errorMessage
            }
            : inv
        )
      );

      toast.error("Erreur", {
        description: error instanceof Error
          ? error.message
          : 'Une erreur est survenue lors du renvoi de l\'invitation'
      });
    }
  };

  const formatName = (fullName: string) => {
    const [lastName, firstName] = fullName.split(' ').filter(Boolean);
    return firstName && lastName
      ? `${firstName} ${lastName}`
      : fullName;
  };

  const handleCSVImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: (results) => {
        const validData = (results.data as CSVRow[])
          .filter(row => row["NOM Prénom"] && row["Adresse mail"])
          .map(row => ({
            email: row["Adresse mail"].trim(),
            displayName: formatName(row["NOM Prénom"].trim()),
            role: 'user' as const,
            status: 'pending' as const
          }));

        setInvitations(validData);

        toast.success("CSV importé avec succès", {
          description: `${validData.length} entrées ont été importées.`
        });
      },
      error: (error) => {
        toast.error("Erreur lors de l'import", {
          description: error.message
        });
      }
    });
  };

  const isInvitationReady = invitations.some(inv => inv.email.trim() !== '');
  const allSent = invitations.every(inv => inv.status === 'sent' || inv.email.trim() === '');

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        resetState();
      }
      onOpenChange(open);
    }}>
      <DialogContent className="max-w-xs sm:max-w-[800px] rounded-md">
        <DialogHeader>
          <DialogTitle>Inviter des Utilisateurs</DialogTitle>
          <DialogDescription>
            Invitez jusqu&apos;à {MAX_INVITATIONS} utilisateurs à la fois. Les invitations seront envoyées par lots.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end mb-4">
          <div className="relative">
            <input
              type="file"
              accept=".csv"
              onChange={handleCSVImport}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Button variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              Importer CSV
            </Button>
          </div>
        </div>
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-4 py-2 pl-2">
          <div className="grid grid-cols-2 gap-4">
            <Label>Nom complet</Label>
            <Label>Email</Label>
          </div>
          {invitations.map((invitation, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="flex-grow grid grid-cols-2 gap-4">
                <div>
                  <Input
                    id={`displayName-${index}`}
                    placeholder="Jean Dupont"
                    value={invitation.displayName}
                    onChange={(e) => updateInvitation(index, 'displayName', e.target.value)}
                    disabled={invitation.status === 'sent'}
                    className={
                      invitation.status === 'error'
                        ? 'border-destructive focus-visible:ring-destructive'
                        : ''
                    }
                  />
                </div>
                <div>
                  <Input
                    id={`email-${index}`}
                    placeholder="exemple@domaine.com"
                    value={invitation.email}
                    onChange={(e) => updateInvitation(index, 'email', e.target.value)}
                    disabled={invitation.status === 'sent'}
                    className={
                      invitation.status === 'error'
                        ? 'border-destructive focus-visible:ring-destructive'
                        : ''
                    }
                  />
                  {invitation.status === 'error' && invitation.errorMessage && (
                    <p className="text-xs text-destructive mt-1">
                      {invitation.errorMessage}
                    </p>
                  )}
                </div>
              </div>
              <div className="w-[50px] flex items-center justify-center">
                {invitation.status === 'pending' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeInvitationField(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
                {invitation.status === 'sending' && (
                  <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
                )}
                {invitation.status === 'sent' && (
                  <Check className="h-4 w-4 text-green-500" />
                )}
                {invitation.status === 'error' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => resendInvitation(index)}
                  >
                    <RefreshCw className="h-4 w-4 text-red-500" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={addInvitationField}
          >
            <Plus className="mr-2 h-4 w-4" /> Ajouter un email
          </Button>
          <p className="text-sm text-muted-foreground">
            {invitations.length} personne{invitations.length > 1 ? 's' : ''}
          </p>
        </div>
        {isProcessing && (
          <div className="space-y-2">
            <Progress value={progress.percentage} />
            <p className="text-sm text-center text-muted-foreground">
              Traitement en cours : {progress.current} sur {progress.total} ({progress.percentage}%)
            </p>
          </div>
        )}
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => {
              resetState();
              onOpenChange(false);
            }}
            disabled={isProcessing && !allSent}
          >
            Annuler
          </Button>
          <Button
            onClick={sendInvitations}
            disabled={!isInvitationReady || isProcessing}
          >
            {isProcessing ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Envoyer les invitations
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
