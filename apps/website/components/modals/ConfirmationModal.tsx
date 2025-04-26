import { FC } from 'react';
import { Modal, Button, ModalBody, ModalFooter, ModalHeader, ModalContent } from "@heroui/react";

interface ConfirmationModalProps {
    visible: boolean;
    onOpenChange: () => void;
    onConfirm: () => void;
    message: string;
}

const ConfirmationModal: FC<ConfirmationModalProps> = ({ visible, onOpenChange, onConfirm, message }) => {
    return (
        <Modal isOpen={visible} onOpenChange={onOpenChange}>
            <ModalContent>

                {(onClose) => (
                    <>
                        <ModalHeader>
                            <h2 className="text-xl font-semibold">Confirmation</h2>
                        </ModalHeader>
                        <ModalBody>
                            <p>{message}</p>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant='flat' onClick={onClose}>
                                Cancel
                            </Button>
                            <Button color="danger" onClick={onConfirm}>
                                Delete
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
};

export default ConfirmationModal;
