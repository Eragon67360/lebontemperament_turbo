import { MembersCard } from "@/components/membres/MembersCard";
import { PageHeader } from "@/components/membres/PageHeader";
import FileExplorer from "@/components/travail/FileExplorer";
import { createClient } from "@/utils/supabase/server";
import { DRIVE_ROOT_SLUG } from "@repo/domain/utils/drive";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mes partitions",
  description:
    "Accédez à l'espace Membres du Bon Tempérament, accédez à de multiples ressources comme des partitions, des gazettes, etc... ",
  keywords: "Espace membres, gazette, travail, règlement, drive",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/membres/travail`,
    siteName: "Le Bon Tempérament",
  },
};

const Travail = async () => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("drive_folders")
    .select("slug, label, folder_id")
    .order("display_order");

  // Rendering an explorer with zero tabs would read as "the drive is empty",
  // so say what actually happened instead.
  const folders = error || !data?.length ? null : data;

  return (
    <div className="flex flex-col gap-7">
      <PageHeader
        current="Mes partitions"
        title="Mes partitions"
        intro="Les partitions et les enregistrements pour travailler chez toi."
      />
      {!folders ? (
        <MembersCard className="p-6 sm:p-8">
          <p role="alert">
            Les dossiers de partitions n&apos;ont pas pu être chargés. Réessaie
            dans un instant.
          </p>
        </MembersCard>
      ) : (
        /* The root folder is not a tab, and members no longer get a link
           to open Drive itself (#347): documents open through the site. */
        <FileExplorer
          folders={folders.filter((folder) => folder.slug !== DRIVE_ROOT_SLUG)}
        />
      )}
    </div>
  );
};

export default Travail;
