import { PageShell } from "@/components/layouts/PageShell";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Baby, Music, UserRound, Users } from "lucide-react";
import Link from "next/link";

export default function TravailPage() {
  return (
    <PageShell
      theme="members"
      title="Espace de Travail"
      className="px-4 py-8 sm:px-6 lg:px-8"
    >
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Link href="">
          <Card className="cursor-pointer transition-shadow hover:shadow-lg">
            <CardHeader>
              <Users className="text-primary mb-2 h-8 w-8" />
              <CardTitle>Adultes</CardTitle>
              <CardDescription>
                Partitions, exercices et ressources pédagogiques adaptés aux
                musiciens adultes.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/dashboard/travail/jeunes">
          <Card className="cursor-pointer transition-shadow hover:shadow-lg">
            <CardHeader>
              <UserRound className="text-primary mb-2 h-8 w-8" />
              <CardTitle>Jeunes</CardTitle>
              <CardDescription>
                Matériel d&apos;étude et programme de formation pour les
                adolescents et jeunes musiciens.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/dashboard/travail/enfants">
          <Card className="cursor-pointer transition-shadow hover:shadow-lg">
            <CardHeader>
              <Baby className="text-primary mb-2 h-8 w-8" />
              <CardTitle>Enfants</CardTitle>
              <CardDescription>
                Activités ludiques, exercices simples et supports pédagogiques
                pour l&apos;éveil musical.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/dashboard/travail/orchestre">
          <Card className="cursor-pointer transition-shadow hover:shadow-lg">
            <CardHeader>
              <Music className="text-primary mb-2 h-8 w-8" />
              <CardTitle>Orchestre</CardTitle>
              <CardDescription>
                Partitions d&apos;orchestre, planning des répétitions et
                informations pour les ensembles.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </PageShell>
  );
}
