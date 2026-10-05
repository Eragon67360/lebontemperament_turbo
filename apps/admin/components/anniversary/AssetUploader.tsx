"use client";

import { Button } from "@/components/ui/button";
import { useUploadFile } from "@/hooks/useAnniversaryUpload";
import { cn } from "@/lib/utils";
import { cloudinaryUrl, fileNameOf } from "@/utils/anniversary/media";
import {
  acceptFor,
  formatFileSize,
  uploadHint,
} from "@/utils/anniversary/uploadHints";
import { normalizeMimeType, UPLOAD_RULES } from "@/utils/uploads";
import { FileText, Loader2, Music, Upload, X } from "lucide-react";
import Image from "next/image";
import * as React from "react";
import { toast } from "sonner";

export type AssetKind = "image" | "audio" | "document";

const KINDS = {
  image: {
    rule: UPLOAD_RULES.anniversaryImage,
    resourceType: "image" as const,
    cloudinary: "image" as const,
    pick: "Choisir une image",
    drop: "ou déposez-la ici",
    remove: "Retirer l'image",
    failed: "L'image n'a pas pu être envoyée",
  },
  audio: {
    rule: UPLOAD_RULES.anniversaryAudio,
    resourceType: "audio" as const,
    cloudinary: "raw" as const,
    pick: "Choisir un fichier audio",
    drop: "ou déposez-le ici",
    remove: "Retirer le fichier audio",
    failed: "Le fichier audio n'a pas pu être envoyé",
  },
  document: {
    rule: UPLOAD_RULES.anniversaryDocument,
    resourceType: "raw" as const,
    cloudinary: "raw" as const,
    pick: "Choisir un document",
    drop: "ou déposez-le ici",
    remove: "Retirer le document",
    failed: "Le document n'a pas pu être envoyé",
  },
};

export interface AssetUploaderProps {
  kind: AssetKind;
  /** Id of the field: the file input gets `${id}-input`, the box `id` (for the error summary). */
  id: string;
  /** The stored public_id (or URL) of the current file. */
  value: string;
  onChange: (publicId: string, file: File) => void;
  onRemove: () => void;
  /** Cloudinary folder (one of utils/uploads.ts `ANNIVERSARY_FOLDERS`). */
  folder: string;
  "aria-labelledby": string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
  disabled?: boolean;
}

/** The hint under an uploader, true to the server's rule. */
export function assetHint(kind: AssetKind): string {
  return uploadHint(KINDS[kind].rule);
}

/**
 * One uploader for the campaign's images, audio files and documents: a
 * labelled file input (click or drop), the upload as soon as a file is
 * chosen, a preview with a named « Retirer » button. The hint lists what
 * the API really accepts.
 */
export function AssetUploader({
  kind,
  id,
  value,
  onChange,
  onRemove,
  folder,
  disabled,
  ...aria
}: AssetUploaderProps) {
  const config = KINDS[kind];
  const upload = useUploadFile();
  const [dragActive, setDragActive] = React.useState(false);
  const inputId = `${id}-input`;
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  const send = async (file: File) => {
    if (!Object.hasOwn(config.rule.types, normalizeMimeType(file.type))) {
      toast.error("Ce type de fichier n'est pas accepté", {
        description: assetHint(kind),
      });
      return;
    }
    if (file.size > config.rule.maxBytes) {
      toast.error("Le fichier est trop volumineux", {
        description: assetHint(kind),
      });
      return;
    }
    try {
      const result = await upload.mutateAsync({
        file,
        folder,
        resourceType: config.resourceType,
      });
      onChange(result.url, file);
    } catch (error) {
      toast.error(config.failed, {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  };

  const onDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (file && !disabled && !upload.isPending) void send(file);
  };

  const url = cloudinaryUrl(value, config.cloudinary, cloudName);

  return (
    <div id={id} tabIndex={-1} className="rounded-md" {...aria}>
      {value ? (
        <div className="border-border bg-card flex items-center gap-3 rounded-md border p-3">
          {kind === "image" && url ? (
            <div className="bg-muted relative aspect-video w-32 shrink-0 overflow-hidden rounded-sm">
              <Image
                src={url}
                alt=""
                fill
                sizes="128px"
                className="object-cover"
              />
            </div>
          ) : (
            <div className="bg-primary-soft text-primary-text grid size-11 shrink-0 place-items-center rounded-md">
              {kind === "audio" ? (
                <Music className="size-5" aria-hidden />
              ) : (
                <FileText className="size-5" aria-hidden />
              )}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-detail truncate font-medium">
              {fileNameOf(value)}
            </p>
            {kind === "audio" && url ? (
              <audio
                controls
                preload="none"
                src={url}
                className="mt-1 h-10 w-full max-w-xs"
              >
                <a href={url} target="_blank" rel="noreferrer">
                  Écouter le fichier
                </a>
              </audio>
            ) : url ? (
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="text-note text-primary-text underline underline-offset-[3px]"
              >
                Ouvrir dans un nouvel onglet
              </a>
            ) : null}
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={onRemove}
            disabled={disabled}
            title={config.remove}
          >
            <X aria-hidden />
            <span className="sr-only">{config.remove}</span>
          </Button>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          onDragEnter={(event) => {
            event.preventDefault();
            setDragActive(true);
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={(event) => {
            event.preventDefault();
            setDragActive(false);
          }}
          onDrop={onDrop}
          className={cn(
            "border-border-strong bg-card hover:bg-accent flex min-h-32 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-md border border-dashed px-4 py-6 text-center transition-colors motion-reduce:transition-none",
            dragActive && "border-primary bg-primary-soft",
            aria["aria-invalid"] && "border-danger",
            (disabled || upload.isPending) && "cursor-wait opacity-60",
          )}
        >
          <input
            id={inputId}
            type="file"
            accept={acceptFor(config.rule)}
            className="sr-only"
            disabled={disabled || upload.isPending}
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) void send(file);
            }}
          />
          {upload.isPending ? (
            <>
              <Loader2
                className="text-primary size-6 animate-spin"
                aria-hidden
              />
              <span className="text-detail text-muted-foreground">
                Envoi en cours…
              </span>
            </>
          ) : (
            <>
              <Upload className="text-primary size-6" aria-hidden />
              <span className="text-detail font-medium">{config.pick}</span>
              <span className="text-note text-muted-foreground">
                {config.drop}
              </span>
            </>
          )}
        </label>
      )}
    </div>
  );
}

/** Reads the duration of a chosen audio file, as « 5:32 »; null when unknown. */
export function readAudioDuration(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || typeof Audio === "undefined") {
      resolve(null);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    const audio = new Audio();
    const done = (value: string | null) => {
      URL.revokeObjectURL(objectUrl);
      resolve(value);
    };
    audio.addEventListener("loadedmetadata", () => {
      const seconds = Math.round(audio.duration);
      if (!Number.isFinite(seconds)) return done(null);
      done(
        `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`,
      );
    });
    audio.addEventListener("error", () => done(null));
    audio.src = objectUrl;
  });
}

export { formatFileSize };
