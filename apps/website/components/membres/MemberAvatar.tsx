"use client";

import { getInitials } from "@/lib/membres/names";
import Image from "next/image";
import { useState } from "react";
import { TONES, voiceTone } from "./tones";

/** A member's photo, or their initials on a tint that follows their voice. */
export function MemberAvatar({
  name,
  voice,
  photoUrl,
}: {
  name: string;
  voice: string;
  photoUrl?: string;
}) {
  const [failed, setFailed] = useState(false);
  const showPhoto = Boolean(photoUrl) && !failed;

  return (
    <span
      aria-hidden={showPhoto ? undefined : true}
      className={`relative flex h-[52px] w-[52px] shrink-0 items-center justify-center overflow-hidden rounded-full text-lg font-semibold ${TONES[voiceTone(voice)]}`}
    >
      {showPhoto ? (
        <Image
          src={photoUrl!}
          alt={`Photo de ${name}`}
          width={52}
          height={52}
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
