// components/ChangePasswordModal.tsx
"use client";
import { createClient } from "@/utils/supabase/client";
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  addToast,
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
      addToast({
        description: "Les mots de passe ne correspondent pas",
        color: "danger",
      });
      return;
    }

    if (password.length < 6) {
      addToast({
        description: "Le mot de passe doit contenir au moins 6 caractères",
        color: "danger",
      });
      return;
    }

    try {
      setIsLoading(true);
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      addToast({
        description: "Mot de passe modifié avec succès",
        color: "success",
      });
      onClose();
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Error changing password:", error);
      addToast({
        description: "Erreur lors du changement de mot de passe",
        color: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <ModalHeader>Changer mon mot de passe</ModalHeader>
        <ModalBody>
          <div className="flex flex-col gap-4">
            <Input
              type="password"
              label="Nouveau mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Entrez votre nouveau mot de passe"
            />
            <Input
              type="password"
              label="Confirmer le mot de passe"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirmez votre nouveau mot de passe"
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            color="danger"
            variant="light"
            onPress={onClose}
            disabled={isLoading}
          >
            Annuler
          </Button>
          <Button
            color="primary"
            onPress={handlePasswordChange}
            disabled={isLoading}
          >
            {isLoading ? "Modification..." : "Modifier"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ChangePasswordModal;
