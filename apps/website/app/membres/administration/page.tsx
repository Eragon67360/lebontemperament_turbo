"use client";
import CloudinaryImage from "@/components/CloudinaryImage";
import PdfList from "@/components/PdfList";
import { RoundedSize } from "@/utils/types";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Link,
  Tab,
  Tabs,
} from "@heroui/react";
import { useState } from "react";
import { IconType } from "react-icons";
import { FaEdit, FaTools } from "react-icons/fa";
import { FaHeadphones, FaRegFilePdf } from "react-icons/fa6";
import { FcVlc } from "react-icons/fc";
import { IoDocumentText } from "react-icons/io5";
import { MdAdminPanelSettings, MdOpenInNew } from "react-icons/md";

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

const Administration = () => {
  const [selected, setSelected] = useState("archives");

  const ArchivesSection = () => (
    <div className="space-y-6">
      {/* CA Section */}
      <Card>
        <CardHeader className="flex gap-3">
          <div className="p-2 bg-primary/10 rounded-md">
            <MdOpenInNew className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Comptes-rendus CA</h3>
            <p className="text-sm text-default-500">
              Archives des réunions du conseil d&apos;administration
            </p>
          </div>
        </CardHeader>
        <CardBody>
          <PdfList jsonFileName="pdf_filesCA" context={"CA"} />
          <Link
            href="https://drive.google.com/drive/folders/0B3HMykcVQJAVdmw2aTdyQUJyWUE?resourcekey=0-eSCStZ_H5-WvEpmFYk8sdQ"
            target="_blank"
            className="mt-4 flex items-center gap-2 text-primary"
          >
            Voir toutes les archives <MdOpenInNew />
          </Link>
        </CardBody>
      </Card>

      {/* AG Section */}
      <Card>
        <CardHeader className="flex gap-3">
          <div className="p-2 bg-primary/10 rounded-md">
            <MdOpenInNew className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Comptes-rendus AG</h3>
            <p className="text-sm text-default-500">
              Archives des assemblées générales
            </p>
          </div>
        </CardHeader>
        <CardBody>
          <PdfList jsonFileName="pdf_filesAG" context={"AG"} />
          <Link
            href="https://drive.google.com/drive/folders/0B3HMykcVQJAVUGE3SllOZlRDMFk?resourcekey=0-KWWoenv1O_uTnu0GNE1t2Q"
            target="_blank"
            className="mt-4 flex items-center gap-2 text-primary"
          >
            Voir toutes les archives <MdOpenInNew />
          </Link>
        </CardBody>
      </Card>

      {/* Gazettes Section */}
      <Card>
        <CardHeader className="flex gap-3">
          <div className="p-2 bg-primary/10 rounded-md">
            <MdOpenInNew className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Gazettes</h3>
            <p className="text-sm text-default-500">Archives des gazettes</p>
          </div>
        </CardHeader>
        <CardBody>
          <PdfList jsonFileName="pdf_filesGazettes" context={"Gazettes"} />
        </CardBody>
      </Card>

      {/* Pêle-Mêle Section */}
      <Card>
        <CardHeader className="flex gap-3">
          <div className="p-2 bg-primary/10 rounded-md">
            <MdOpenInNew className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Pêle-Mêle</h3>
            <p className="text-sm text-default-500">Archives diverses</p>
          </div>
        </CardHeader>
        <CardBody>
          <PdfList jsonFileName="pdf_filesPM" context={"PM"} />
          <Link
            href="https://drive.google.com/drive/folders/0B3HMykcVQJAVcG9Nd1JRa19tM3c?resourcekey=0-kSko9ElajKHa981AXkCz8Q"
            target="_blank"
            className="mt-4 flex items-center gap-2 text-primary"
          >
            Voir toutes les archives <MdOpenInNew />
          </Link>
        </CardBody>
      </Card>
    </div>
  );

  const RegulationsSection = () => (
    <div className="space-y-6">
      {/* Main Regulations Card */}
      <Card>
        <CardHeader className="flex justify-between items-start">
          <div className="flex gap-3 items-center">
            <div className="p-2 bg-primary/10 rounded-md h-fit">
              <IoDocumentText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Règlement intérieur</h3>
              <p className="text-sm text-default-500">
                Extrait du règlement intérieur
              </p>
            </div>
          </div>
          <Button
            as={Link}
            href="/pdf/reglement.pdf"
            target="_blank"
            variant="bordered"
            startContent={<IoDocumentText />}
          >
            Version complète
          </Button>
        </CardHeader>
        <Divider />
        <CardBody>
          <div className="space-y-4">
            {/* Répétitions */}
            <Card>
              <CardBody>
                <h4 className="font-medium mb-2">Répétitions</h4>
                <p className="text-sm text-default-500 italic">
                  Le Bon Tempérament répète un dimanche par mois et part en
                  tournée dix jours en été. Les répétitions de pupitres, hommes
                  et femmes, ont lieu tous les 15 jours.
                </p>
              </CardBody>
            </Card>

            {/* Commission de solidarité */}
            <Card>
              <CardBody>
                <h4 className="font-medium mb-2">Commission de solidarité</h4>
                <p className="text-sm text-default-500 italic">
                  Une commission de solidarité est mise en place. Le fonds de
                  solidarité est alimenté par des dons et par le produit de
                  certaines manifestations auxquelles l&apos;association
                  participe...
                </p>
              </CardBody>
            </Card>

            {/* Add other sections similarly */}
          </div>
        </CardBody>
      </Card>

      {/* Additional Documents */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card isPressable as={Link} href="/pdf/charte_BT.pdf" target="_blank">
          <CardBody className="flex items-start gap-4">
            <div className="p-2 bg-primary/10 rounded-md">
              <IoDocumentText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h4 className="font-medium">Charte des séjours</h4>
              <p className="text-sm text-default-500">
                Consultez la charte complète sur les séjours BT
              </p>
            </div>
          </CardBody>
        </Card>

        <Card
          isPressable
          as={Link}
          href="/pdf/Statuts_Le_Bon_Tempérament.pdf"
          target="_blank"
        >
          <CardBody className="flex items-start gap-4">
            <div className="p-2 bg-primary/10 rounded-md">
              <IoDocumentText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h4 className="font-medium">Statuts de l&apos;association</h4>
              <p className="text-sm text-default-500">
                Consultez les statuts complets du Bon Tempérament
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );

  const SoftwareSection = () => {
    const softwareCategories: SoftwareCategory[] = [
      {
        title: "Écouter",
        icon: FaHeadphones,
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
        icon: IoDocumentText,
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
        icon: FaEdit,
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
      <div className="space-y-6">
        {softwareCategories.map((category) => (
          <Card key={category.title}>
            <CardHeader className="flex gap-3">
              <div className="p-2 bg-primary/10 rounded-md">
                <category.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">{category.title}</h3>
            </CardHeader>
            <Divider />
            <CardBody>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {category.items.map((item) => (
                  <Card
                    key={item.name}
                    isPressable
                    as={Link}
                    href={item.link}
                    target="_blank"
                  >
                    <CardBody className="flex flex-col items-center p-4">
                      {item.imageType === "icon" && item.icon ? (
                        <item.icon className="w-12 h-12 mb-3" />
                      ) : (
                        <CloudinaryImage
                          src={item.image!}
                          alt={`logo ${item.name}`}
                          width={48}
                          height={48}
                          rounded={RoundedSize.NONE}
                          className="mb-3"
                        />
                      )}
                      <span className="text-sm">{item.name}</span>
                    </CardBody>
                  </Card>
                ))}
              </div>
            </CardBody>
          </Card>
        ))}

        {/* Tips Section */}
        <Card>
          <CardHeader>
            <div className="flex gap-3">
              <div className="p-2 bg-primary/10 rounded-md">
                <FaTools className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Trucs et astuces</h3>
            </div>
          </CardHeader>
          <Divider />
          <CardBody>
            <p className="text-sm text-default-500">
              Windows Media Player permet de modifier la vitesse de lecture
              d&apos;un enregistrement sans modifier la tessiture...{" "}
              {/* Rest of the content */}
            </p>
          </CardBody>
        </Card>
      </div>
    );
  };

  return (
    <div className="p-6 w-full">
      <Card>
        <CardHeader className="flex gap-3">
          <div className="p-2 bg-primary/10 rounded-md">
            <MdAdminPanelSettings className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Administration</h2>
            <p className="text-sm text-default-500">
              Documents et ressources administratives
            </p>
          </div>
        </CardHeader>
        <Divider />
        <CardBody>
          <Tabs
            selectedKey={selected}
            onSelectionChange={setSelected as any}
            aria-label="Administration sections"
          >
            <Tab key="archives" title="Archives">
              <ArchivesSection />
            </Tab>
            <Tab key="reglement" title="Règlement">
              <RegulationsSection />
            </Tab>
            <Tab key="logiciels" title="Logiciels">
              <SoftwareSection />
            </Tab>
          </Tabs>
        </CardBody>
      </Card>
    </div>
  );
};

export default Administration;
