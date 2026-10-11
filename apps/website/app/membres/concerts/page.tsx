import MembresConcertsEvents from "@/components/membres/MembresConcertsEvents";
import { PageHeader } from "@/components/membres/PageHeader";

export default function Page() {
  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        current="Concerts et événements"
        title="Concerts et événements"
        intro="Les prochains concerts, les sorties et les ventes."
      />
      <MembresConcertsEvents />
    </div>
  );
}
