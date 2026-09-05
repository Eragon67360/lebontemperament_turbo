// components/ChangePasswordModal.tsx
"use client";
import { createClient } from "@/utils/supabase/client";
import {
  Button,
  FieldError,
  Input,
  Label,
  Modal,
  TextField,
  toast,
} from "@heroui/react";
import { useState } from "react";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChangePasswordModal = ({ isOpen, onClose }: ChangePasswordModalProps) => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const handlePasswordChange = async () => {
    if (password !== confirmPassword) {
      toast.danger("Les mots de passe ne correspondent pas");
      return;
    }

    if (password.length < 6) {
      toast.danger("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    try {
      setIsLoading(true);
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      toast.success("Mot de passe modifié avec succès");
      onClose();
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Error changing password:", error);
      toast.danger("Erreur lors du changement de mot de passe");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal>
      <Modal.Backdrop
        isOpen={isOpen}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
      >
        <Modal.Container>
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>Changer mon mot de passe</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <div className="flex flex-col gap-4">
                <TextField name="password" type="password">
                  <Label>Nouveau mot de passe</Label>
                  <Input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Entrez votre nouveau mot de passe"
                  />
                  <FieldError />
                </TextField>
                <TextField name="confirmPassword" type="password">
                  <Label>Confirmer le mot de passe</Label>
                  <Input
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirmez votre nouveau mot de passe"
                  />
                  <FieldError />
                </TextField>
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant="danger-soft"
                onPress={onClose}
                isDisabled={isLoading}
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                onPress={handlePasswordChange}
                isPending={isLoading}
              >
                {isLoading ? "Modification..." : "Modifier"}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
};

export default ChangePasswordModal;
