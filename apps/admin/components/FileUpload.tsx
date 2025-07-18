// components/FileUpload.tsx
import { Upload, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import Image from "next/image";
interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onFileClear: () => void;
  value?: File | null;
  currentImageUrl?: string | null;
}

export function FileUpload({
  onFileSelect,
  onFileClear,
  currentImageUrl,
}: FileUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  useEffect(() => {
    if (currentImageUrl) {
      setPreview(currentImageUrl);
    }
  }, [currentImageUrl]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];

      // Validate file type
      if (!file?.type.startsWith("image/")) {
        toast.error("Seules les images sont acceptées");
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("La taille du fichier ne doit pas dépasser 5MB");
        return;
      }

      // Create preview
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
      onFileSelect(file);

      return () => URL.revokeObjectURL(objectUrl);
    },
    [onFileSelect],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".svg", ".webp"],
    },
    maxFiles: 1,
  });

  const handleClear = () => {
    setPreview(null);
    onFileClear();
  };

  return (
    <div className="w-full">
      {!preview ? (
        <div
          {...getRootProps()}
          className={`cursor-pointer rounded-lg border-2 border-dashed p-6 transition-colors ${
            isDragActive
              ? "border-primary bg-primary/10"
              : "border-muted-foreground/25 hover:border-primary"
          }`}
        >
          <input {...getInputProps()} />
          <div className="text-muted-foreground flex flex-col items-center gap-2">
            <Upload className="h-8 w-8" />
            <p className="text-center text-sm">
              {isDragActive
                ? "Déposez l'image ici"
                : "Glissez-déposez une image ou cliquez pour sélectionner"}
            </p>
            <p className="text-xs">PNG, JPG, GIF, SVG ou WEBP (max. 5MB)</p>
          </div>
        </div>
      ) : (
        <div className="relative h-[200px] w-full">
          <Image
            src={preview}
            alt="Aperçu de l'affiche"
            fill
            className="rounded-lg object-contain"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority
          />
          <button
            onClick={handleClear}
            className="absolute top-2 right-2 z-10 rounded-full bg-black/50 p-1 transition-colors hover:bg-black/70"
            type="button"
          >
            <X className="h-4 w-4 text-white" />
          </button>
        </div>
      )}
    </div>
  );
}
