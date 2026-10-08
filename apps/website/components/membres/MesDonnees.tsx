"use client";

import { PRIVACY_CONTACT_EMAIL } from "@/lib/contact";
import { DELETION_NOTE_MAX_LENGTH } from "@/lib/deletionRequest";
import {
  Button,
  Label,
  Modal,
  TextArea,
  TextField,
  toast,
} from "@heroui/react";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import {
  IoCheckmarkCircle,
  IoCreateOutline,
  IoDownloadOutline,
  IoTrashOutline,
} from "react-icons/io5";

const linkClass =
  "text-primary-text font-medium underline underline-offset-2 hover:no-underline";

function Panel({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  const id = `mes-donnees-${title.toLowerCase().replace(/[^a-z]+/g, "-")}`;
  return (
    <section
      aria-labelledby={id}
      className="bg-background border-primary/10 flex flex-col gap-4 rounded-xl border p-5 md:p-6"
    >
      <div className="flex items-center gap-3">
        <div
          className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
          aria-hidden="true"
        >
          {icon}
        </div>
        <h2 id={id} className="text-foreground text-lg font-bold">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

/** The file name the server chose, from its Content-Disposition header. */
function fileNameOf(response: Response): string {
  const header = response.headers.get("content-disposition") ?? "";
  return /filename="([^"]+)"/.exec(header)?.[1] ?? "mes-donnees.json";
}

function DownloadPanel() {
  const [isLoading, setIsLoading] = useState(false);

  const download = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/membres/mes-donnees", {
        cache: "no-store",
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileNameOf(response);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success("Vos données sont téléchargées");
    } catch (error) {
      console.error("Export failed:", error);
      toast.danger(
        `Le téléchargement a échoué. Réessayez, ou écrivez à ${PRIVACY_CONTACT_EMAIL}.`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Panel
      icon={<IoDownloadOutline className="h-5 w-5" />}
      title="Télécharger mes données"
    >
      <p className="text-foreground/70 text-sm leading-relaxed">
        Un fichier JSON avec tout ce que la base de l’association contient sur
        votre compte : votre profil (nom, pupitre, coordonnées, photo), votre
        compte (e-mail, modes de connexion, dates), les téléphones qui reçoivent
        vos notifications, vos notifications et vos signalements avec leurs
        réponses et, si vous administrez le site, ce que vous y avez publié.
        Seules vos propres données y figurent.
      </p>
      <div>
        <Button variant="primary" onPress={download} isPending={isLoading}>
          <IoDownloadOutline className="size-4" aria-hidden="true" />
          {isLoading ? "Préparation du fichier…" : "Télécharger mes données"}
        </Button>
      </div>
    </Panel>
  );
}

function CorrectPanel() {
  return (
    <Panel
      icon={<IoCreateOutline className="h-5 w-5" />}
      title="Corriger mes informations"
    >
      <p className="text-foreground/70 text-sm leading-relaxed">
        Une information est fausse ou a changé (nom, pupitre, coordonnées,
        photo) ? Écrivez à{" "}
        <a href={`mailto:${PRIVACY_CONTACT_EMAIL}`} className={linkClass}>
          {PRIVACY_CONTACT_EMAIL}
        </a>{" "}
        : nous la corrigeons dans votre profil et dans le fichier des adhérents,
        d’où viennent votre nom, votre adresse, votre téléphone fixe et votre
        pupitre.
      </p>
    </Panel>
  );
}

function DeletionPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [note, setNote] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const send = async () => {
    setIsSending(true);
    try {
      const response = await fetch("/api/membres/demande-suppression", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: note }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setIsSent(true);
      setIsOpen(false);
    } catch (error) {
      console.error("Deletion request failed:", error);
      toast.danger(
        `La demande n’a pas pu être envoyée. Réessayez, ou écrivez à ${PRIVACY_CONTACT_EMAIL}.`,
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Panel
      icon={<IoTrashOutline className="h-5 w-5" />}
      title="Supprimer mon compte"
    >
      {isSent ? (
        <p
          role="status"
          className="text-foreground flex items-start gap-2 text-sm leading-relaxed"
        >
          <IoCheckmarkCircle
            className="text-primary mt-0.5 size-5 shrink-0"
            aria-hidden="true"
          />
          <span>
            Votre demande est envoyée. Vous recevez une confirmation par e-mail
            et nous vous écrivons dès que votre compte est supprimé, dans un
            délai d’un mois.
          </span>
        </p>
      ) : (
        <>
          <p className="text-foreground/70 text-sm leading-relaxed">
            Votre demande part vers l’association, qui supprime votre compte de
            l’espace membres et de l’application, votre profil, vos
            notifications et vos signalements dans un délai d’un mois, puis vous
            le confirme par e-mail. Rien n’est supprimé tant que nous ne l’avons
            pas traitée : vous pouvez encore changer d’avis en répondant à
            l’e-mail de confirmation. Votre adhésion à l’association est une
            autre affaire : dites-nous dans le message si vous la quittez aussi.
          </p>
          <div>
            <Button variant="danger-soft" onPress={() => setIsOpen(true)}>
              <IoTrashOutline className="size-4" aria-hidden="true" />
              Demander la suppression de mon compte
            </Button>
          </div>
        </>
      )}

      <Modal>
        <Modal.Backdrop
          isOpen={isOpen}
          onOpenChange={(open) => {
            if (!open && !isSending) setIsOpen(false);
          }}
        >
          <Modal.Container>
            <Modal.Dialog>
              <Modal.CloseTrigger aria-label="Fermer" />
              <Modal.Header>
                <Modal.Heading>
                  Demander la suppression du compte ?
                </Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <div className="flex flex-col gap-4">
                  <p className="text-foreground/70 text-sm leading-relaxed">
                    L’association reçoit votre demande et supprime votre compte
                    dans un délai d’un mois. Pensez à{" "}
                    <strong>télécharger vos données</strong> avant si vous
                    voulez en garder une copie.
                  </p>
                  <TextField name="message">
                    <Label>Un mot pour l’association (facultatif)</Label>
                    <TextArea
                      value={note}
                      rows={4}
                      maxLength={DELETION_NOTE_MAX_LENGTH}
                      onChange={(e) => setNote(e.target.value)}
                    />
                  </TextField>
                </div>
              </Modal.Body>
              <Modal.Footer>
                <Button
                  variant="ghost"
                  onPress={() => setIsOpen(false)}
                  isDisabled={isSending}
                >
                  Annuler
                </Button>
                <Button variant="danger" onPress={send} isPending={isSending}>
                  {isSending ? "Envoi…" : "Envoyer la demande"}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </Panel>
  );
}

/** « Mes données » in the members area (#354). */
export function MesDonnees() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 py-8 pb-24 md:py-12">
      <header className="flex flex-col gap-2">
        <h1 className="text-primary-text text-2xl font-bold md:text-3xl">
          Mes données personnelles
        </h1>
        <p className="text-foreground/70 text-sm leading-relaxed md:text-base">
          Récupérez une copie de ce que l’association enregistre sur vous, ou
          demandez la suppression de votre compte. Le détail figure dans la{" "}
          <Link
            href="/politique-de-confidentialite#droits"
            className={linkClass}
          >
            politique de confidentialité
          </Link>
          .
        </p>
      </header>
      <DownloadPanel />
      <CorrectPanel />
      <DeletionPanel />
    </div>
  );
}
