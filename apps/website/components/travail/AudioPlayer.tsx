"use client";

import { membersButtonClass } from "@/components/membres/MembersButton";
import { MembersCard } from "@/components/membres/MembersCard";
import { PageHeader } from "@/components/membres/PageHeader";
import NextLink from "next/link";
import { useSearchParams } from "next/navigation";
import { IoDownloadOutline } from "react-icons/io5";

const AudioPlayer = () => {
  const searchParams = useSearchParams();
  const fileUrl = searchParams.get("fileUrl");
  const fileName = searchParams.get("fileName");
  const title = fileName ? `${fileName}` : "Lecteur audio";

  return (
    <div className="flex flex-col gap-7">
      <PageHeader
        parents={[{ label: "Mes partitions", href: "/membres/travail" }]}
        current={title}
        title={title}
        intro="Écoute l’enregistrement ici, ou télécharge-le pour l’écouter plus tard."
      />
      <MembersCard className="flex max-w-2xl flex-col gap-6 p-5 sm:p-8">
        {fileUrl ? (
          <>
            <audio
              controls
              src={fileUrl}
              className="w-full"
              aria-label={`Lecture audio de ${fileName}`}
            >
              Votre navigateur ne supporte pas l&apos;élément audio.
            </audio>
            <div>
              <a
                aria-label={`Télécharger ${fileName || "le fichier audio"}`}
                className={membersButtonClass("solid")}
                href={fileUrl + "&export=download"}
                download={fileName || "audio"}
              >
                <IoDownloadOutline aria-hidden="true" className="h-5 w-5" />
                Télécharger le fichier
              </a>
            </div>
          </>
        ) : (
          <>
            <p role="status">
              Aucun enregistrement à écouter. Retourne aux partitions pour en
              choisir un.
            </p>
            <div>
              <NextLink
                href="/membres/travail"
                className={membersButtonClass("outline")}
              >
                Retour aux partitions
              </NextLink>
            </div>
          </>
        )}
      </MembersCard>
    </div>
  );
};

export default AudioPlayer;
