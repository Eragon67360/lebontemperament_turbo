// app/dashboard/public/page.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Home, Image, LucideIcon, Phone } from "lucide-react";
import Link from "next/link";
export default function PublicDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Site Public</h2>
        <p className="text-muted-foreground">
          Gérez le contenu public de votre site web.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Quick access cards */}
        <DashboardCard
          title="Page d'accueil"
          description="Gérez le contenu de la page d'accueil"
          icon={Home}
          href="/dashboard/public/home"
        />
        <DashboardCard
          title="Concerts"
          description="Gérez les concerts à venir et passés"
          icon={Calendar}
          href="/dashboard/public/concerts"
        />
        <DashboardCard
          title="Contact"
          description="Modifiez les informations de contact"
          icon={Phone}
          href="/dashboard/public/contact"
        />
        <DashboardCard
          title="Médiathèque"
          description="Gérez les médias du site"
          icon={Image}
          href="/dashboard/public/gallery"
        />
      </div>
    </div>
  );
}

const DashboardCard = ({
  title,
  description,
  icon: Icon,
  href,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
}) => {
  return (
    <Link href={href}>
      <Card className="hover:bg-muted/50 transition-colors">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Icon className="h-6 w-6" />
            <CardTitle>{title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    </Link>
  );
};
