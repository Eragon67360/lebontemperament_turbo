import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/react";
import { FC, useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";

interface PasswordModalProps {
  visible: boolean;
  onOpenChange: () => void;
  onPasswordSubmit: (password: string) => void;
}

const PasswordModal: FC<PasswordModalProps> = ({
  visible,
  onPasswordSubmit,
  onOpenChange,
}) => {
  const [password, setPassword] = useState("");
  const [isVisible, setIsVisible] = useState(false);

  const toggleVisibility = () => setIsVisible(!isVisible);

  const handlePasswordSubmit = () => {
    onPasswordSubmit(password);
    setPassword("");
  };

  return (
    <Modal isOpen={visible} onOpenChange={onOpenChange}>
      <ModalContent>
        {() => (
          <>
            <ModalHeader>
              <h2>Mot de Passe Administrateur</h2>
            </ModalHeader>
            <ModalBody>
              <Input
                placeholder="Entrez votre mot de passe"
                endContent={
                  <button
                    className="focus:outline-none"
                    type="button"
                    onClick={toggleVisibility}
                  >
                    {isVisible ? (
                      <FaEyeSlash className="text-default-400 pointer-events-none text-2xl" />
                    ) : (
                      <FaEye className="text-default-400 pointer-events-none text-2xl" />
                    )}
                  </button>
                }
                type={isVisible ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </ModalBody>
            <ModalFooter>
              <Button onClick={handlePasswordSubmit}>Confirmer</Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default PasswordModal;
