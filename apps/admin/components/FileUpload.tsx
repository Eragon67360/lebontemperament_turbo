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
  currentPDFUrl?: string | null;
  mode?: "image" | "pdf";
}

export function FileUpload({
  onFileSelect,
  onFileClear,
  currentImageUrl,
  currentPDFUrl,
  mode,
}: FileUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  useEffect(() => {
    if (currentImageUrl) {
      setPreview(currentImageUrl);
    } else if (currentPDFUrl) {
      const fileName = currentPDFUrl.split("/").pop() || "document.pdf";
      const fakeFile = new File([], fileName, { type: "application/pdf" });
      setPdfFile(fakeFile);
    }
  }, [currentImageUrl, currentPDFUrl]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];

      if (mode === "pdf") {
        if (file?.type !== "application/pdf") {
          toast.error("Seuls les fichiers PDF sont acceptés");
          return;
        }
        if (file.size > 5 * 1024 * 1024) {
          toast.error("La taille du fichier ne doit pas dépasser 5MB");
          return;
        }
        setPreview(null);
        setPdfFile(file);
        onFileSelect(file);
        return;
      }

      if (!file?.type.startsWith("image/")) {
        toast.error("Seules les images sont acceptées");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("La taille du fichier ne doit pas dépasser 5MB");
        return;
      }
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
      setPdfFile(null);
      onFileSelect(file);

      return () => URL.revokeObjectURL(objectUrl);
    },
    [onFileSelect, mode],
  );

  const acceptedFiles: Record<string, string[]> =
    mode === "image"
      ? { "image/*": [".jpeg", ".jpg", ".png", ".gif", ".svg", ".webp"] }
      : { "application/pdf": [".pdf"] };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFiles,
    maxFiles: 1,
  });

  const handleClear = () => {
    setPreview(null);
    setPdfFile(null);
    onFileClear();
  };

  return (
    <div className="w-full">
      {!preview && !pdfFile ? (
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
                ? mode === "pdf"
                  ? "Déposez le PDF ici"
                  : "Déposez l'image ici"
                : mode === "pdf"
                  ? "Glissez-déposez un PDF ou cliquez pour sélectionner"
                  : "Glissez-déposez une image ou cliquez pour sélectionner"}
            </p>
            <p className="text-xs">
              {mode === "pdf"
                ? "PDF (max. 5MB)"
                : "PNG, JPG, GIF, SVG ou WEBP (max. 5MB)"}
            </p>
          </div>
        </div>
      ) : preview ? (
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
      ) : pdfFile ? (
        <div className="bg-muted relative w-full rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{pdfFile.name}</p>
              <p className="text-muted-foreground text-xs">
                {(pdfFile.size / 1024).toFixed(2)} KB
              </p>
            </div>
            <button
              onClick={handleClear}
              className="rounded-full bg-black/50 p-1 transition-colors hover:bg-black/70"
              type="button"
            >
              <X className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
