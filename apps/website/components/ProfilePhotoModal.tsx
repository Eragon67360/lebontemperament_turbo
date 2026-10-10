// components/ProfilePhotoModal.tsx
"use client";
import { resizeToJpeg } from "@/lib/photoResize";
import { Avatar, Button, Modal, toast } from "@heroui/react";
import { useEffect, useRef, useState } from "react";

interface ProfilePhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** The photo shown today (the member's own, or their Google avatar). */
  currentUrl: string | null;
  /** True when the member has their own photo (something to remove). */
  hasOwnPhoto: boolean;
  initial: string;
  /** Called with the new URL, or null once the photo is removed. */
  onChanged: (url: string | null) => void;
}

/**
 * « Changer ma photo » in the account menu: pick a photo, see it, save it.
 * The photo goes through /api/profile/photo (the same route as the app),
 * which changes only the signed-in member's own photo, never their name.
 */
const ProfilePhotoModal = ({
  isOpen,
  onClose,
  currentUrl,
  hasOwnPhoto,
  initial,
  onChanged,
}: ProfilePhotoModalProps) => {
  const input = useRef<HTMLInputElement>(null);
  // The resized photo and its preview URL.
  const [picked, setPicked] = useState<{ blob: Blob; url: string } | null>(
    null,
  );
  const [busy, setBusy] = useState<"save" | "remove" | "read" | null>(null);
  const photo = picked?.blob ?? null;
  const preview = picked?.url ?? null;

  // The effect below revokes the previous preview URL.
  const setPhoto = (blob: Blob | null) =>
    setPicked(blob ? { blob, url: URL.createObjectURL(blob) } : null);

  useEffect(
    () => () => {
      if (picked) URL.revokeObjectURL(picked.url);
    },
    [picked],
  );

  const close = () => {
    if (busy === "save" || busy === "remove") return;
    setPhoto(null);
    onClose();
  };

  const choose = async (file: File | undefined) => {
    if (!file) return;
    setBusy("read");
    try {
      setPhoto(await resizeToJpeg(file));
    } catch {
      toast.danger("Cette image ne peut pas être lue. Choisissez une photo.");
    } finally {
      setBusy(null);
      if (input.current) input.current.value = "";
    }
  };

  const send = async (method: "POST" | "DELETE") => {
    setBusy(method === "POST" ? "save" : "remove");
    try {
      let body: FormData | undefined;
      if (method === "POST" && photo) {
        body = new FormData();
        body.append("file", photo, "photo.jpg");
      }
      const response = await fetch("/api/profile/photo", { method, body });
      const result = (await response.json().catch(() => ({}))) as {
        url?: string | null;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(
          response.status < 500 && result.error
            ? result.error
            : "La photo n'a pas pu être enregistrée. Réessayez plus tard.",
        );
      }
      onChanged(result.url ?? null);
      toast.success(
        method === "POST" ? "Photo de profil mise à jour" : "Photo retirée",
      );
      setPhoto(null);
      onClose();
    } catch (error) {
      toast.danger(
        error instanceof Error
          ? error.message
          : "La photo n'a pas pu être enregistrée.",
      );
    } finally {
      setBusy(null);
    }
  };

  const shown = preview ?? currentUrl;

  return (
    <Modal>
      <Modal.Backdrop
        isOpen={isOpen}
        onOpenChange={(open) => {
          if (!open) close();
        }}
      >
        <Modal.Container>
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>Changer ma photo</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <div className="flex flex-col items-center gap-4 text-center">
                <Avatar className="h-32 w-32 rounded-full text-4xl">
                  {shown ? (
                    <Avatar.Image src={shown} alt="Votre photo de profil" />
                  ) : null}
                  <Avatar.Fallback>{initial.toUpperCase()}</Avatar.Fallback>
                </Avatar>
                <p className="text-muted text-sm">
                  Les autres membres la voient dans la liste des membres. Votre
                  nom vient de la liste de l&apos;association : pour le
                  corriger, écrivez-nous.
                </p>
                <input
                  ref={input}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  tabIndex={-1}
                  aria-hidden="true"
                  onChange={(e) => choose(e.target.files?.[0])}
                />
                <div className="flex flex-wrap justify-center gap-2">
                  <Button
                    variant="secondary"
                    onPress={() => input.current?.click()}
                    isDisabled={busy !== null}
                  >
                    {preview ? "Choisir une autre photo" : "Choisir une photo"}
                  </Button>
                  {hasOwnPhoto && !preview ? (
                    <Button
                      variant="ghost"
                      className="text-danger data-[hovered=true]:bg-danger/20"
                      onPress={() => send("DELETE")}
                      isPending={busy === "remove"}
                      isDisabled={busy !== null && busy !== "remove"}
                    >
                      {busy === "remove" ? "Retrait..." : "Retirer la photo"}
                    </Button>
                  ) : null}
                </div>
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant="ghost"
                className="text-danger data-[hovered=true]:bg-danger/20"
                onPress={close}
                isDisabled={busy === "save" || busy === "remove"}
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                onPress={() => send("POST")}
                isPending={busy === "save"}
                isDisabled={!photo || (busy !== null && busy !== "save")}
              >
                {busy === "save" ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
};

export default ProfilePhotoModal;
