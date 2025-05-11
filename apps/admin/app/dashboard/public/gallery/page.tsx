// app/dashboard/public/gallery/page.tsx
import { DashboardPageHeader } from "@/components/DashboardPageHeader";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import RouteNames from "@/utils/routes";
import { Image as ImageIcon, Video } from "lucide-react";
import Link from "next/link";

export default function GalleryPage() {
  return (
    <div className="container px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Section */}
      <DashboardPageHeader
        title="Galerie Multimédia"
        description=" Gérez vos contenus photos et vidéos pour mettre en valeur vos
          événements."
      />

      {/* Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Photos Card */}
        <Link href={RouteNames.DASHBOARD.PUBLIC.GALLERY.IMAGES}>
          <Card className="backdrop-blur-xl bg-white/50 dark:bg-black/50 border-0 shadow-lg rounded-2xl overflow-hidden hover:scale-[1.02] hover:shadow-xl transition-all duration-200 cursor-pointer">
            <CardHeader className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <ImageIcon className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-lg font-semibold">
                    Photos
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    Gérez votre collection de photos et organisez vos albums
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </Link>

        {/* Videos Card */}
        <Link href={RouteNames.DASHBOARD.PUBLIC.GALLERY.VIDEOS}>
          <Card className="backdrop-blur-xl bg-white/50 dark:bg-black/50 border-0 shadow-lg rounded-2xl overflow-hidden hover:scale-[1.02] hover:shadow-xl transition-all duration-200 cursor-pointer">
            <CardHeader className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Video className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-lg font-semibold">
                    Vidéos
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    Gérez vos vidéos et créez des playlists thématiques
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}
