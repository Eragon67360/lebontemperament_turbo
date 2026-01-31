import { CloudinaryUploadResponse } from "@/types/anniversary";
import { useMutation } from "@tanstack/react-query";

interface UploadOptions {
  file: File;
  folder?: string;
  resourceType?: "image" | "video" | "audio" | "raw";
}

// Upload file to Cloudinary
export function useUploadFile() {
  return useMutation({
    mutationFn: async ({
      file,
      folder,
      resourceType,
    }: UploadOptions): Promise<CloudinaryUploadResponse> => {
      const formData = new FormData();
      formData.append("file", file);
      if (folder) formData.append("folder", folder);
      if (resourceType) formData.append("resourceType", resourceType);

      const response = await fetch("/api/anniversary/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to upload file");
      }

      return response.json();
    },
  });
}
