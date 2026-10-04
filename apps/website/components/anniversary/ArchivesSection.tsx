"use client";

import { FaArrowRight } from "react-icons/fa";
import AnniversaryCTA from "./AnniversaryCTA";
import ScoreHeading from "./score/ScoreHeading";
import { SECTION_MARKS } from "./score/sections";

const ArchivesSection = () => {
  return (
    <section
      id="archives"
      className="bg-background text-foreground py-16 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScoreHeading
          kicker={SECTION_MARKS.archives!}
          title="Archives"
          intro="Rapports d’assemblée générale, documents officiels, programmes de concerts : feuilletez nos archives."
        />
        <div className="mt-8">
          <AnniversaryCTA href="/40-ans/archives">
            Consulter les archives
            <FaArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
          </AnniversaryCTA>
        </div>
      </div>
    </section>
  );
};

export default ArchivesSection;
