"use client";

import { useUploadFile } from "@/hooks/useAnniversaryUpload";
import { cn } from "@/lib/utils";
import { Loader2, Upload, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useState } from "react";
import { toast } from "sonner";

interface ImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  onRemove?: () => void;
  label?: string;
  error?: string;
  folder?: string;
  className?: string;
}

export function ImageUploader({
  value,
  onChange,
  onRemove,
  label = "Image",
  error,
  folder = "Site/anniversary",
  className,
}: ImageUploaderProps) {
  const uploadFile = useUploadFile();
  const [dragActive, setDragActive] = useState(false);

  const handleUpload = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast.error("Le fichier doit être une image");
        return;
      }

      try {
        const result = await uploadFile.mutateAsync({
          file,
          folder,
          resourceType: "image",
        });
        onChange(result.url); // This is the public_id
        toast.success("Image uploadée avec succès");
      } catch (error) {
        toast.error("Erreur lors de l'upload de l'image");
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

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
      )}

      {value ? (
        <div className="border-border bg-muted relative aspect-video w-full overflow-hidden rounded-lg border">
          <Image
            src={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/${value}`}
            alt="Preview"
            fill
            className="object-cover"
          />
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="bg-destructive hover:bg-destructive/90 absolute top-2 right-2 rounded-full p-1.5 text-white shadow-lg transition-all"
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
            "border-border bg-muted/50 hover:border-primary/50 hover:bg-muted relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors",
            dragActive && "border-primary bg-primary/5",
            uploadFile.isPending && "pointer-events-none opacity-60",
          )}
        >
          <input
            type="file"
            accept="image/*"
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
                    Glissez une image ou cliquez pour parcourir
                  </p>
                  <p className="text-muted-foreground text-xs">
                    PNG, JPG, WebP jusqu'à 10MB
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
