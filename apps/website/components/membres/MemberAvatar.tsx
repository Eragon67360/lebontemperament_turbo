"use client";

import { getInitials } from "@/lib/membres/names";
import Image from "next/image";
import { useState } from "react";
import { voiceFill } from "./tones";

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
  const showPhoto = Boolean(photoUrl) && !failed;
  const { px, className: sizeClass } = SIZES[size];

  return (
    <span
      aria-hidden={showPhoto ? undefined : true}
      className={`font-members-display relative flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold ${sizeClass} ${voiceFill(voice)} ${className}`}
    >
      {showPhoto ? (
        <Image
          src={photoUrl!}
          alt={`Photo de ${name}`}
          width={px}
          height={px}
          // Photos come from arbitrary external hosts, with the initials
          // fallback below: served as-is, as before.
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
