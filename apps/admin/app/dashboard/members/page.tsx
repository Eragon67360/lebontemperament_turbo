import { PageShell } from "@/components/layouts/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Calendar, LucideIcon, Users } from "lucide-react";
import Link from "next/link";
// app/dashboard/members/page.tsx
export default function MembersDashboardPage() {
  return (
    <PageShell
      theme="members"
      className="px-4 py-8 sm:px-6 lg:px-8"
      title="Espace Membres"
      description="Gérez l'espace réservé aux membres."
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <DashboardCard
          title="Gestion Membres"
          description="Gérez les utilisateurs et leurs accès"
          icon={Users}
          href="/dashboard/members/users"
        />
        <DashboardCard
          title="Travail"
          description="Accédez aux sections de travail"
          icon={Briefcase}
          href="/dashboard/members/travail"
        />
        <DashboardCard
          title="Prochains Concerts"
          description="Consultez les prochains concerts"
          icon={Calendar}
          href="/dashboard/members/upcoming-concerts"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Membres actifs" value="42" icon={Users} />
      </div>
    </PageShell>
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
          <p className="text-muted-foreground text-sm">{description}</p>
        </CardContent>
      </Card>
    </Link>
  );
};

const StatsCard = ({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string;
  icon: LucideIcon;
}) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="text-muted-foreground h-4 w-4" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
};
