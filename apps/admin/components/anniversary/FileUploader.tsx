"use client";

import { useUploadFile } from "@/hooks/useAnniversaryUpload";
import { cn } from "@/lib/utils";
import { FileText, Loader2, Upload, X } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

interface FileUploaderProps {
  value?: string;
  onChange: (url: string, fileSize: string) => void;
  onRemove?: () => void;
  label?: string;
  error?: string;
  folder?: string;
  className?: string;
  accept?: string;
}

export function FileUploader({
  value,
  onChange,
  onRemove,
  label = "Fichier",
  error,
  folder = "Site/anniversary/archives",
  className,
  accept = ".pdf,.doc,.docx",
}: FileUploaderProps) {
  const uploadFile = useUploadFile();
  const [dragActive, setDragActive] = useState(false);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const handleUpload = useCallback(
    async (file: File) => {
      // Check file type
      const validTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      if (!validTypes.includes(file.type)) {
        toast.error("Le fichier doit être un PDF ou un document Word");
        return;
      }

      // Check file size (max 50MB)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        toast.error("Le fichier est trop volumineux (max 50MB)");
        return;
      }

      try {
        const result = await uploadFile.mutateAsync({
          file,
          folder,
          resourceType: "raw", // PDFs are stored as raw files in Cloudinary
        });

        const fileSize = formatFileSize(file.size);
        onChange(result.url, fileSize); // result.url is the public_id
        toast.success("Fichier uploadé avec succès");
      } catch (error) {
        toast.error("Erreur lors de l'upload du fichier");
        console.error("Upload error:", error);
      }
    },
    [uploadFile, onChange, folder],
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleUpload(e.dataTransfer.files[0]);
      }
    },
    [handleUpload],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        handleUpload(e.target.files[0]);
      }
    },
    [handleUpload],
  );

  const getFileUrl = (publicId: string) => {
    return `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/raw/upload/${publicId}`;
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
      )}

      {value ? (
        <div className="border-border bg-muted relative flex items-center gap-3 rounded-lg border p-4">
          <div className="bg-primary/10 text-primary rounded-lg p-2">
            <FileText className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {value.split("/").pop() || "Document"}
            </p>
            <a
              href={getFileUrl(value)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary text-xs underline"
            >
              Voir le fichier
            </a>
          </div>
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="bg-destructive hover:bg-destructive/90 shrink-0 rounded-full p-1.5 text-white shadow-lg transition-all"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      ) : (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={cn(
            "border-border bg-muted/50 hover:border-primary/50 hover:bg-muted relative flex min-h-[150px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors",
            dragActive && "border-primary bg-primary/5",
            uploadFile.isPending && "pointer-events-none opacity-60",
          )}
        >
          <input
            type="file"
            accept={accept}
            onChange={handleChange}
            disabled={uploadFile.isPending}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
          <div className="flex flex-col items-center gap-3 text-center">
            {uploadFile.isPending ? (
              <>
                <Loader2 className="text-primary h-10 w-10 animate-spin" />
                <p className="text-muted-foreground text-sm">
                  Upload en cours...
                </p>
              </>
            ) : (
              <>
                <div className="bg-primary/10 rounded-full p-3">
                  <Upload className="text-primary h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    Glissez un fichier ou cliquez pour parcourir
                  </p>
                  <p className="text-muted-foreground text-xs">
                    PDF, DOC, DOCX jusqu'à 50MB
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  );
}
