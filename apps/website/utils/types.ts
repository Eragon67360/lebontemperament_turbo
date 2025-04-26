export enum RoundedSize {
  NONE = "rounded-none",
  SM = "rounded-sm",
  MD = "rounded-md",
  LG = "rounded-lg",
  XL = "rounded-xl",
  TWO_XL = "rounded-2xl",
  THREE_XL = "rounded-3xl",
  FULL = "rounded-full",
}

export interface ImageResourceProps {
  secure_url: string;
  public_id: string;
  format: string;
  width: number;
  height: number;
}

export interface PhotoData {
  src: string;
  width: number;
  height: number;
}

export interface DriveFile {
  id?: string;
  name: string;
  type: "file" | "folder";
  mimeType: string;
  content?: string; // Base64-encoded content for files
  files?: DriveFile[]; // Nested files for folders
}
