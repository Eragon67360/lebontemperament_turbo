"use client";
import { MemberDirectory } from "@/components/membres/MemberDirectory";
import { PageHeader } from "@/components/membres/PageHeader";

const Membres = () => {
  return (
    <div className="flex flex-col gap-7">
      <PageHeader
        current="Les membres"
        title="Les membres"
        intro="Retrouve un choriste ou un musicien. Clique sur « Écrire » pour lui envoyer un e-mail."
      />
      <MemberDirectory />
    </div>
  );
};

export default Membres;
