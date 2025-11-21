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
import { PageShell } from "@/components/layouts/PageShell";

export default function GalleryPage() {
  return (
    <PageShell
      title="Galerie Multimédia"
      description="Gérez vos contenus photos et vidéos pour mettre en valeur vos événements."
      className="px-4 py-8 sm:px-6 lg:px-8"
    >
      {/* Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Photos Card */}
        <Link href={RouteNames.DASHBOARD.PUBLIC.GALLERY.IMAGES}>
          <Card className="cursor-pointer overflow-hidden rounded-2xl border-0 bg-white/50 shadow-lg backdrop-blur-xl transition-all duration-200 hover:scale-[1.02] hover:shadow-xl dark:bg-black/50">
            <CardHeader className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 rounded-full p-3">
                  <ImageIcon className="text-primary h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-lg font-semibold">
                    Photos
                  </CardTitle>
                  <CardDescription className="text-muted-foreground text-sm">
                    Gérez votre collection de photos et organisez vos albums
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </Link>

        {/* Videos Card */}
        <Link href={RouteNames.DASHBOARD.PUBLIC.GALLERY.VIDEOS}>
          <Card className="cursor-pointer overflow-hidden rounded-2xl border-0 bg-white/50 shadow-lg backdrop-blur-xl transition-all duration-200 hover:scale-[1.02] hover:shadow-xl dark:bg-black/50">
            <CardHeader className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 rounded-full p-3">
                  <Video className="text-primary h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-lg font-semibold">
                    Vidéos
                  </CardTitle>
                  <CardDescription className="text-muted-foreground text-sm">
                    Gérez vos vidéos et créez des playlists thématiques
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </PageShell>
  );
}
