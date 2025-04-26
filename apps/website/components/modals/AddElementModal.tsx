import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from "@heroui/react";
import { FC, useState } from "react";
import { useDropzone } from "react-dropzone";
import { FaFileAlt, FaFolder, FaTimes } from "react-icons/fa";
import { FiUploadCloud } from "react-icons/fi";

interface AddElementModalProps {
  visible: boolean;
  onOpenChange: () => void;
  onAdd: (files: File[]) => void;
}

const AddElementModal: FC<AddElementModalProps> = ({
  visible,
  onAdd,
  onOpenChange,
}) => {
  const modal = useDisclosure();

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const onDrop = (acceptedFiles: File[]) => {
    setSelectedFiles((prevFiles) => [...prevFiles, ...acceptedFiles]);
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  const handleAdd = () => {
    onAdd(selectedFiles);
    setSelectedFiles([]);
    modal.onClose();
  };

  const handleRemoveFile = (file: File) => {
    setSelectedFiles((prevFiles) => prevFiles.filter((f) => f !== file));
  };

  const formatFileSize = (size: number) => {
    const i = Math.floor(Math.log(size) / Math.log(1024));
    return `${(size / Math.pow(1024, i)).toFixed(2)} ${["B", "KB", "MB", "GB", "TB"][i]}`;
  };

  return (
    <Modal isOpen={visible} onClose={modal.onClose} onOpenChange={onOpenChange}>
      <ModalContent>
        {() => (
          <>
            <ModalHeader>
              <h2>Ajout de nouveaux éléments</h2>
            </ModalHeader>
            <ModalBody>
              <div
                {...getRootProps({ className: "dropzone" })}
                style={{}}
                className="p-5 border-2 border-dashed border-primary rounded-lg flex flex-col justify-center items-center gap-1 cursor-pointer text-center"
              >
                <input {...getInputProps()} />
                <FiUploadCloud color="#18858b" size={48} />
                <h2 className="text-primary font-bold">
                  Importer des fichiers ou
                </h2>
                <p>
                  Glissez et déposez des fichiers ou dossiers ici, ou cliquez
                  pour sélectionner des fichiers ou dossiers
                </p>
              </div>
              {selectedFiles.length > 0 && (
                <div className="mt-4">
                  <ul className="list-none p-0">
                    {selectedFiles.map((file) => (
                      <li
                        key={file.name}
                        className="flex items-center justify-between bg-gray-100 p-2 mb-2 rounded"
                      >
                        <div className="flex items-center">
                          {file.type === "folder" ? (
                            <FaFolder className="mr-2 text-primary" size={24} />
                          ) : (
                            <FaFileAlt
                              className="mr-2 text-primary"
                              size={24}
                            />
                          )}
                          <div>
                            <p className="m-0">{file.name}</p>
                            {file.type !== "folder" && (
                              <p className="m-0 text-sm text-gray-600">
                                {formatFileSize(file.size)}
                              </p>
                            )}
                          </div>
                        </div>
                        <FaTimes
                          className="text-red-500 cursor-pointer"
                          onClick={() => handleRemoveFile(file)}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </ModalBody>
            <ModalFooter>
              {selectedFiles.length > 0 && (
                <Button onClick={handleAdd}>Importer</Button>
              )}
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default AddElementModal;
