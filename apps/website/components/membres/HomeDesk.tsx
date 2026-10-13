import type { MemberDirectoryState } from "@/hooks/useMemberDirectory";
import { lastNameOf, normalize } from "@/lib/membres/directory";
import { VOICE_LABEL, voiceKeys, type VoiceKey } from "@/lib/membres/voices";
import { MemberAvatar } from "./MemberAvatar";
import { MembersLinkButton } from "./MembersButton";

const SHOWN = 9;

/**
 * « Ton pupitre »: a few faces of the member's section and the way to the
 * whole of it in the directory. Without a known voice: the whole choir.
 */
export function HomeDesk({
  voice,
  directory,
}: {
  voice: VoiceKey | null;
  directory: MemberDirectoryState;
}) {
  const label = voice ? VOICE_LABEL[voice].toLowerCase() : "";
  const desk =
    directory.status === "ready"
      ? directory.members
          .filter(
            (member) =>
              voice === null || voiceKeys(member.Voix).includes(voice),
          )
          .sort((a, b) =>
            normalize(lastNameOf(a["NOM Prénom"])).localeCompare(
              normalize(lastNameOf(b["NOM Prénom"])),
              "fr",
            ),
          )
      : [];
  const href = voice ? `/membres/membres?voix=${voice}` : "/membres/membres";

  return (
    <section
      aria-labelledby="home-desk"
      className="border-members-line-strong flex flex-col gap-4 rounded-[32px] border-2 p-5 sm:p-8"
    >
      <h2
        id="home-desk"
        className="font-members-display text-[26px] font-semibold sm:text-[30px]"
      >
        {voice ? "Ton pupitre" : "Le chœur"}
      </h2>
      <p className="text-members-muted">
        {voice
          ? voice === "orchestre"
            ? "Les musiciens avec qui tu joues, à un clic."
            : `Les ${label} avec qui tu chantes, à un clic.`
          : "Retrouve un choriste ou un musicien et écris-lui."}
      </p>

      {directory.status === "loading" && (
        <div aria-busy="true" className="flex flex-wrap gap-2">
          {Array.from({ length: 7 }, (_, i) => (
            <span
              key={i}
              className="bg-members-band h-14 w-14 animate-pulse rounded-full"
            />
          ))}
          <p role="status" className="sr-only">
            Chargement des membres…
          </p>
        </div>
      )}
      {directory.status === "error" && (
        <p role="alert">
          La liste des membres n’a pas pu être chargée. Réessaie dans un
          instant.
        </p>
      )}
      {directory.status === "ready" && desk.length > 0 && (
        <>
          <p className="font-medium">
            {desk.length}{" "}
            {voice
              ? voice === "orchestre"
                ? desk.length > 1
                  ? "musiciens"
                  : "musicien"
                : desk.length > 1
                  ? label
                  : label.replace(/s$/, "")
              : desk.length > 1
                ? "membres"
                : "membre"}
          </p>
          <ul className="flex flex-wrap gap-2">
            {desk.slice(0, SHOWN).map((member, index) => (
              <li
                key={`${member["Adresse mail"]}-${index}`}
                title={member["NOM Prénom"]}
              >
                <MemberAvatar
                  name={member["NOM Prénom"]}
                  voice={member.Voix}
                  photoUrl={member.photoUrl}
                  size="sm"
                  className="h-14 w-14"
                />
              </li>
            ))}
            {desk.length > SHOWN && (
              <li
                aria-hidden="true"
                className="bg-members-band flex h-14 items-center rounded-full px-4 font-semibold"
              >
                + {desk.length - SHOWN}
              </li>
            )}
          </ul>
        </>
      )}

      <MembersLinkButton href={href} size="md" className="mt-auto self-start">
        {voice
          ? voice === "orchestre"
            ? "Voir tout l’orchestre"
            : `Voir le pupitre des ${label}`
          : "Ouvrir l’annuaire"}
      </MembersLinkButton>
    </section>
  );
}
