// app/dashboard/travail/[programId]/page.tsx
import { createClient } from "@/utils/supabase/server";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import Link from "next/link";
// import * as Icons from "lucide-react"

interface WorkProgramPageProps {
  programId: string;
}

export default async function WorkProgramPage({
  params,
}: {
  params: Promise<WorkProgramPageProps>;
}) {
  const supabase = await createClient();
  const { programId } = await params;
  // Get program details
  const { data: program } = await supabase
    .from("programs")
    .select("*")
    .eq("id", programId)
    .single();

  // Get all groups (choirs + orchestra)
  const { data: groups } = await supabase
    .from("groups")
    .select("*")
    .order("order_index");

  if (!program || !groups) {
    return <div>Not found</div>;
  }

  return (
    <div className="container mx-auto ">
      <h1 className="text-2xl font-bold mb-8">{program.name}</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {groups.map((group) => {
          // const IconComponent = Icons[group.icon as keyof typeof Icons]

          return (
            <Link
              key={group.id}
              href={`/dashboard/travail/${programId}/${group.slug}`}
            >
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  {/* <IconComponent className="w-8 h-8 mb-2 text-primary" /> */}
                  <CardTitle>{group.name}</CardTitle>
                  <CardDescription>{group.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
