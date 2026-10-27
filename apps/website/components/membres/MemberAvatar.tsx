"use client";

import { getInitials } from "@/lib/membres/names";
import { memberPhotoUrl } from "@repo/domain/utils/profilePicture";
import Image from "next/image";
import { useState } from "react";
import { voiceFill } from "./tones";

// Where members' uploaded photos are stored: this environment's Supabase
// project and production's two hosts (the ones next.config.js's images list).
const PHOTO_STORAGE = [
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  "https://fsklunxplbbtzgurwqmc.supabase.co",
  "https://api.lebontemperament.com",
];

const SIZES = {
  sm: { px: 48, className: "h-12 w-12 text-base" },
  md: { px: 60, className: "h-[60px] w-[60px] text-[19px]" },
} as const;

/** A member's photo, or their initials on their voice's colour. */
export function MemberAvatar({
  name,
  voice,
  photoUrl,
  size = "md",
  className = "",
}: {
  name: string;
  voice: string;
  photoUrl?: string;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  // The association's Storage or a Google account picture; any other address
  // shows the initials and is never requested.
  const photo = failed ? null : memberPhotoUrl(photoUrl, PHOTO_STORAGE);
  const { px, className: sizeClass } = SIZES[size];

  return (
    <span
      aria-hidden={photo ? undefined : true}
      className={`font-members-display relative flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold ${sizeClass} ${voiceFill(voice)} ${className}`}
    >
      {photo ? (
        <Image
          src={photo}
          alt={`Photo de ${name}`}
          width={px}
          height={px}
          // Storage or Google pictures only (checked above), with the
          // initials fallback below: served as-is, as before.
          unoptimized
          className="h-full w-full object-cover"
          crossOrigin="anonymous"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        getInitials(name)
      )}
    </span>
  );
}
