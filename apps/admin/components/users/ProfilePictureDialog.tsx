import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useResetOnChange } from "@/hooks/useResetOnChange";
import {
  useDeleteProfilePicture,
  useUploadProfilePicture,
} from "@/hooks/useUsers";
import { Loader2, Trash2, Upload } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";

interface ProfilePictureDialogProps {
  userId: string;
  currentAvatar?: string;
  displayName: string;
  email: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfilePictureDialog({
  userId,
  currentAvatar,
  displayName,
  email,
  isOpen,
  onOpenChange,
}: ProfilePictureDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  // Both refresh the users list on success.
  const uploadPicture = useUploadProfilePicture();
  const deletePicture = useDeleteProfilePicture();
  const isUploading = uploadPicture.isPending;
  const isDeleting = deletePicture.isPending;

  // Reset state when dialog opens
  useResetOnChange([isOpen], () => {
    if (isOpen) {
      setSelectedFile(null);
      setPreview(null);
    }
  });

  // Revoke a blob preview once it is replaced or the dialog unmounts.
  useEffect(() => {
    if (!preview?.startsWith("blob:")) return;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file?.type.startsWith("image/")) {
      toast.error("Seules les images sont acceptées");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La taille du fichier ne doit pas dépasser 5MB");
      return;
    }
    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    // Same types as the API accepts (no SVG: it can carry scripts).
    accept: {
      "image/jpeg": [".jpeg", ".jpg"],
      "image/png": [".png"],
      "image/gif": [".gif"],
      "image/webp": [".webp"],
      "image/avif": [".avif"],
    },
    maxFiles: 1,
  });

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      await uploadPicture.mutateAsync({ userId, file: selectedFile });

      toast.success("Photo de profil mise à jour avec succès");
      onOpenChange(false);
      setSelectedFile(null);
      setPreview(null);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors du téléversement de la photo",
      );
    }
  };

  const handleDelete = async () => {
    try {
      await deletePicture.mutateAsync(userId);

      toast.success("Photo de profil supprimée avec succès");
      onOpenChange(false);
      setSelectedFile(null);
      setPreview(null);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de la suppression de la photo",
      );
    }
  };

  const handleClose = () => {
    if (!isUploading && !isDeleting) {
      setSelectedFile(null);
      setPreview(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Photo de profil</DialogTitle>
          <DialogDescription>
            Modifiez la photo de profil de {displayName || email}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Avatar Preview */}
          <div className="flex flex-col items-center gap-4">
            <Avatar
              className="h-24 w-24 border-2 border-gray-200"
              key={currentAvatar}
            >
              <AvatarImage
                src={preview || currentAvatar || undefined}
                alt={displayName || email}
              />
              <AvatarFallback className="bg-gray-50 text-lg font-medium text-gray-600">
                {displayName?.[0] || email[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {/* Upload Area */}
            {!preview && (
              <div
                {...getRootProps()}
                className={`w-full cursor-pointer rounded-lg border-2 border-dashed p-6 transition-colors ${
                  isDragActive
                    ? "border-primary bg-primary/10"
                    : "hover:border-primary border-gray-300"
                }`}
              >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-2 text-gray-600">
                  <Upload className="h-8 w-8" />
                  <p className="text-center text-sm">
                    {isDragActive
                      ? "Déposez l'image ici"
                      : "Glissez-déposez une image ou cliquez pour sélectionner"}
                  </p>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, GIF, SVG ou WEBP (max. 5MB)
                  </p>
                </div>
              </div>
            )}

            {/* Preview */}
            {preview && (
              <div className="relative w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview}
                  alt="Aperçu"
                  className="w-full rounded-lg object-contain"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedFile(null);
                    setPreview(null);
                    URL.revokeObjectURL(preview);
                  }}
                  className="mt-2 w-full"
                >
                  Changer d&apos;image
                </Button>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          {currentAvatar && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isUploading || isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Suppression...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer
                </>
              )}
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isUploading || isDeleting}
          >
            Annuler
          </Button>
          {selectedFile && (
            <Button
              type="button"
              onClick={handleUpload}
              disabled={isUploading || isDeleting}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Téléversement...
                </>
              ) : (
                "Enregistrer"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
