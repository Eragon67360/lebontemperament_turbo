"use client";
import CAMinutesList from "@/components/CAMinutesList";
import CloudinaryImage from "@/components/CloudinaryImage";
import { DocumentArchives } from "@/components/membres/DocumentArchives";
import { DocumentCard } from "@/components/membres/DocumentCard";
import { FilterButton } from "@/components/membres/FilterButton";
import { MembersLinkButton } from "@/components/membres/MembersButton";
import { PageHeader } from "@/components/membres/PageHeader";
import { RoundedSize } from "@/utils/types";
import { useState } from "react";
import { IconType } from "react-icons";
import { FaRegFilePdf } from "react-icons/fa6";
import { FcVlc } from "react-icons/fc";
import {
  IoBulbOutline,
  IoCreateOutline,
  IoDocumentTextOutline,
  IoHeadsetOutline,
  IoOpenOutline,
} from "react-icons/io5";

interface SoftwareItem {
  name: string;
  icon?: IconType;
  image?: string;
  link: string;
  imageType: "icon" | "cloudinary";
}

interface SoftwareCategory {
  title: string;
  icon: IconType;
  items: SoftwareItem[];
}

const ArchivesSection = () => (
  <div className="flex flex-col gap-6">
    <DocumentCard
      id="archives-ca"
      icon={IoOpenOutline}
      title="Comptes-rendus du CA"
      description="Les réunions du conseil d’administration."
    >
      <CAMinutesList />
    </DocumentCard>

    <DocumentArchives />
  </div>
);

const RegulationsSection = () => (
  <div className="flex flex-col gap-6">
    <DocumentCard
      id="reglement"
      icon={IoDocumentTextOutline}
      title="Règlement intérieur"
      description="Un extrait du règlement intérieur."
    >
      <div className="flex flex-col gap-4">
        <div className="bg-members-band rounded-[22px] p-5">
          <h3 className="mb-1 text-lg font-semibold">Répétitions</h3>
          <p className="text-muted">
            Le Bon Tempérament répète un dimanche par mois et part en tournée
            dix jours en été. Les répétitions de pupitres, hommes et femmes, ont
            lieu tous les 15 jours.
          </p>
        </div>
        <div className="bg-members-band rounded-[22px] p-5">
          <h3 className="mb-1 text-lg font-semibold">
            Commission de solidarité
          </h3>
          <p className="text-muted">
            Une commission de solidarité est mise en place. Le fonds de
            solidarité est alimenté par des dons et par le produit de certaines
            manifestations auxquelles l&apos;association participe...
          </p>
        </div>
      </div>
      <div>
        <MembersLinkButton href="/pdf/reglement.pdf" external>
          <IoDocumentTextOutline aria-hidden="true" className="h-5 w-5" />
          Lire la version complète
        </MembersLinkButton>
      </div>
    </DocumentCard>

    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <DocumentCard
        id="charte"
        icon={IoDocumentTextOutline}
        title="Charte des séjours"
        description="La charte complète des séjours du BT."
      >
        <div>
          <MembersLinkButton
            href="/pdf/charte_BT.pdf"
            variant="outline"
            external
          >
            Ouvrir la charte
          </MembersLinkButton>
        </div>
      </DocumentCard>
      <DocumentCard
        id="statuts"
        icon={IoDocumentTextOutline}
        title="Statuts de l’association"
        description="Les statuts complets du Bon Tempérament."
      >
        <div>
          <MembersLinkButton
            href="/pdf/Statuts_Le_Bon_Tempérament.pdf"
            variant="outline"
            external
          >
            Ouvrir les statuts
          </MembersLinkButton>
        </div>
      </DocumentCard>
    </div>
  </div>
);

const SoftwareSection = () => {
  const softwareCategories: SoftwareCategory[] = [
    {
      title: "Écouter",
      icon: IoHeadsetOutline,
      items: [
        {
          name: "VLC",
          icon: FcVlc,
          link: "https://www.01net.com/telecharger/multimedia/lecteurs_video_dvd/vlc-media-player.html",
          imageType: "icon",
        },
        {
          name: "iTunes",
          image: "Site/membres/logos/itunes",
          link: "https://www.apple.com/fr/itunes/",
          imageType: "cloudinary",
        },
        {
          name: "Windows Media Player",
          image: "Site/membres/logos/wmp",
          link: "https://www.01net.com/telecharger/multimedia/lecteurs_video_dvd/vlc-media-player.html",
          imageType: "cloudinary",
        },
      ],
    },
    {
      title: "Consulter",
      icon: IoDocumentTextOutline,
      items: [
        {
          name: "OpenOffice",
          image: "Site/membres/logos/openoffice",
          link: "https://www.openoffice.org/",
          imageType: "cloudinary",
        },
        {
          name: "Adobe Reader",
          icon: FaRegFilePdf,
          link: "https://get.adobe.com/fr/reader/",
          imageType: "icon",
        },
      ],
    },
    {
      title: "Modifier",
      icon: IoCreateOutline,
      items: [
        {
          name: "Musescore",
          image: "Site/membres/logos/musescore",
          link: "https://musescore.org/fr",
          imageType: "cloudinary",
        },
        {
          name: "Audacity",
          image: "Site/membres/logos/audacity",
          link: "https://www.audacityteam.org/",
          imageType: "cloudinary",
        },
      ],
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {softwareCategories.map((category) => (
        <DocumentCard
          key={category.title}
          id={`logiciels-${category.title}`}
          icon={category.icon}
          title={category.title}
        >
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {category.items.map((item) => (
              <li key={item.name} className="flex">
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-members-line bg-members-band hover:border-primary hover:bg-primary/5 text-foreground flex min-h-28 w-full flex-col items-center justify-center gap-3 rounded-[22px] border p-4 text-center font-medium no-underline transition-colors"
                >
                  {item.imageType === "icon" && item.icon ? (
                    <item.icon aria-hidden="true" className="h-12 w-12" />
                  ) : (
                    <CloudinaryImage
                      src={item.image!}
                      alt=""
                      width={48}
                      height={48}
                      rounded={RoundedSize.NONE}
                    />
                  )}
                  <span>
                    {item.name}
                    <span className="sr-only"> (nouvel onglet)</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </DocumentCard>
      ))}

      <DocumentCard id="astuces" icon={IoBulbOutline} title="Trucs et astuces">
        <p className="text-muted">
          Windows Media Player permet de modifier la vitesse de lecture
          d&apos;un enregistrement sans modifier la tessiture...
        </p>
      </DocumentCard>
    </div>
  );
};

const SECTIONS = [
  { key: "archives", label: "Archives" },
  { key: "reglement", label: "Règlement" },
  { key: "logiciels", label: "Logiciels" },
] as const;

const Administration = () => {
  const [selected, setSelected] = useState<string>("archives");

  return (
    <div className="flex flex-col gap-7">
      <PageHeader
        current="Documents de l’association"
        title="Documents de l’association"
        intro="Comptes-rendus du CA, règlement, gazettes, archives et logiciels utiles."
      />

      <fieldset className="m-0 flex flex-col gap-2.5 border-0 p-0">
        <legend className="mb-2.5 p-0 font-medium">Choisir une rubrique</legend>
        <div className="flex flex-wrap gap-2.5">
          {SECTIONS.map((tab) => (
            <FilterButton
              key={tab.key}
              label={tab.label}
              pressed={selected === tab.key}
              onPress={() => setSelected(tab.key)}
            />
          ))}
        </div>
      </fieldset>

      <div>
        {selected === "archives" && <ArchivesSection />}
        {selected === "reglement" && <RegulationsSection />}
        {selected === "logiciels" && <SoftwareSection />}
      </div>
    </div>
  );
};

export default Administration;
