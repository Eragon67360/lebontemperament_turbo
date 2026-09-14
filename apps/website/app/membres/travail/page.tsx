import FileExplorer from "@/components/travail/FileExplorer";
import { createClient } from "@/utils/supabase/server";
import { DRIVE_ROOT_SLUG, driveFolderUrl } from "@repo/domain/utils/drive";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Travail",
  description:
    "Accédez à l'espace Membres du Bon Tempérament, accédez à de multiples ressources comme des partitions, des gazettes, etc... ",
  keywords: "Espace membres, gazette, travail, règlement, drive",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/membres/travail`,
    siteName: "Le Bon Tempérament",
    images: [
      {
        url: "https://res.cloudinary.com/dlt2j3dld/image/upload/v1716454520/Site/og/default-og.png",
        width: 800,
        height: 600,
        alt: "Le Bon Tempérament",
      },
    ],
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
  if (error || !data?.length) {
    return (
      <div className="flex w-full flex-1 items-center justify-center p-6">
        <p className="text-muted text-sm">
          Les dossiers Drive n&apos;ont pas pu être chargés. Réessayez dans un
          instant.
        </p>
      </div>
    );
  }

  const rootFolder = data.find((folder) => folder.slug === DRIVE_ROOT_SLUG);

  return (
    <>
      <div className="w-full p-0 md:p-6">
        <FileExplorer
          folders={data.filter((folder) => folder.slug !== DRIVE_ROOT_SLUG)}
          driveUrl={
            rootFolder ? driveFolderUrl(rootFolder.folder_id) : undefined
          }
        />
      </div>
    </>
  );
};

export default Travail;
