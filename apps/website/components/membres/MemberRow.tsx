import type { Member } from "@/lib/membres/directory";
import { IoMailOutline } from "react-icons/io5";
import { MemberAvatar } from "./MemberAvatar";
import { membersButtonClass } from "./MembersButton";
import { TONES, voiceTone } from "./tones";

/** One line of the directory: photo, name and e-mail, voice, « Écrire ». */
export function MemberRow({ member }: { member: Member }) {
  const name = member["NOM Prénom"];
  const email = member["Adresse mail"];
  const voice = member.Voix;

  return (
    <li className="hover:bg-primary/5 border-members-line flex flex-wrap items-center gap-x-4 gap-y-3 border-t px-4 py-3.5 sm:gap-x-[18px] sm:px-6">
      <MemberAvatar name={name} voice={voice} photoUrl={member.photoUrl} />
      <div className="flex min-w-0 flex-[1_1_160px] flex-col">
        <span className="text-[19px] leading-snug font-extrabold break-words">
          {name}
        </span>
        {email && (
          <span className="text-muted hidden text-base break-all min-[760px]:block">
            {email}
          </span>
        )}
      </div>
      <div className="flex w-full items-center justify-between gap-3 pl-[68px] sm:ml-auto sm:w-auto sm:pl-0">
        {voice ? (
          <span
            className={`min-w-24 rounded-lg px-3 py-1 text-center text-base font-bold ${TONES[voiceTone(voice)]}`}
          >
            {voice}
          </span>
        ) : (
          <span aria-hidden="true" className="hidden min-w-24 sm:block" />
        )}
        {email && (
          <a
            href={`mailto:${email}`}
            aria-label={`Écrire à ${name}`}
            className={membersButtonClass("outlineTeal", "", "md")}
          >
            <IoMailOutline aria-hidden="true" className="h-5 w-5" />
            Écrire
          </a>
        )}
      </div>
    </li>
  );
}
