"use client";

import type { Member } from "@/lib/membres/directory";
import { useEffect, useState } from "react";
import { IoCheckmark, IoCopyOutline } from "react-icons/io5";
import { MemberAvatar } from "./MemberAvatar";

/**
 * One member of the directory: photo or initials on their voice's colour,
 * name, voice, their e-mail address (a link that opens the mail app) and a
 * button that copies it, for those who write from a webmail.
 */
export function MemberCard({
  member,
  onCopy,
}: {
  member: Member;
  /** Copies the address (the directory announces it); false when it failed. */
  onCopy: () => Promise<boolean>;
}) {
  const name = member["NOM Prénom"];
  const email = member["Adresse mail"];
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  return (
    <li className="border-members-line flex items-center gap-4 rounded-[28px] border-2 p-3.5 pr-3">
      <MemberAvatar
        name={name}
        voice={member.Voix}
        photoUrl={member.photoUrl}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="leading-snug font-medium break-words">{name}</span>
        {member.Voix && (
          <span className="text-members-muted text-base">{member.Voix}</span>
        )}
        {email && (
          <a
            href={`mailto:${email}`}
            title={`Écrire à ${name}`}
            className="text-foreground truncate text-base underline decoration-1 underline-offset-4 hover:no-underline"
          >
            {email}
          </a>
        )}
      </div>
      {email && (
        <button
          type="button"
          aria-label={`Copier l’adresse de ${name}`}
          onClick={() => onCopy().then((ok) => setCopied(ok))}
          className="bg-members-band text-foreground hover:bg-members-line flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors"
        >
          {copied ? (
            <IoCheckmark aria-hidden="true" className="h-5 w-5" />
          ) : (
            <IoCopyOutline aria-hidden="true" className="h-5 w-5" />
          )}
        </button>
      )}
    </li>
  );
}
