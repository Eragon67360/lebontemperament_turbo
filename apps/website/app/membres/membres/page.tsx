"use client";
import { MemberDirectory } from "@/components/membres/MemberDirectory";
import { PageHeader } from "@/components/membres/PageHeader";

const Membres = () => {
  return (
    <div className="flex flex-col gap-7">
      <PageHeader
        current="Les membres"
        title="Les membres"
        intro="Le chœur et l’orchestre, pupitre par pupitre. Clique sur une adresse pour écrire, ou copie-la."
      />
      <MemberDirectory />
    </div>
  );
};

export default Membres;
