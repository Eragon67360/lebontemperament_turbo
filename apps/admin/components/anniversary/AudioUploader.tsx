"use client";

import { useUploadFile } from "@/hooks/useAnniversaryUpload";
import { cn } from "@/lib/utils";
import { Loader2, Music, Upload, X } from "lucide-react";
import { useCallback } from "react";
import { toast } from "sonner";

interface AudioUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  onRemove?: () => void;
  label?: string;
  error?: string;
  folder?: string;
  className?: string;
}

export function AudioUploader({
  value,
  onChange,
  onRemove,
  label = "Fichier audio",
  error,
  folder = "Site/anniversary/audio",
  className,
}: AudioUploaderProps) {
  const uploadFile = useUploadFile();

  const handleUpload = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("audio/")) {
        toast.error("Le fichier doit être un fichier audio");
        return;
      }

      try {
        const result = await uploadFile.mutateAsync({
          file,
          folder,
          resourceType: "audio",
        });
        onChange(result.url); // This is the public_id
        toast.success("Audio uploadé avec succès");
      } catch (error) {
        toast.error("Erreur lors de l'upload du fichier audio");
        console.error("Upload error:", error);
      }
    },
    [uploadFile, onChange, folder],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        handleUpload(e.target.files[0]);
      }
    },
    [handleUpload],
  );

  const getFileName = (url: string) => {
    const parts = url.split("/");
    return parts[parts.length - 1];
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
      )}

      {value ? (
        <div className="border-border bg-muted flex items-center gap-3 rounded-lg border p-4">
          <div className="bg-primary/10 rounded-full p-2">
            <Music className="text-primary h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{getFileName(value)}</p>
            <p className="text-muted-foreground text-xs">
              Fichier audio uploadé
            </p>
          </div>
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-full p-1.5 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      ) : (
        <div
          className={cn(
            "border-border bg-muted/50 hover:border-primary/50 hover:bg-muted relative flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors",
            uploadFile.isPending && "pointer-events-none opacity-60",
          )}
        >
          <input
            type="file"
            accept="audio/*"
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
                  <p className="text-sm font-medium">Cliquez pour parcourir</p>
                  <p className="text-muted-foreground text-xs">
                    MP3, WAV jusqu'à 50MB
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
