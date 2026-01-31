"use client";
import CAMinutesList from "@/components/CAMinutesList";
import CloudinaryImage from "@/components/CloudinaryImage";
import PdfList from "@/components/PdfList";
import { RoundedSize } from "@/utils/types";
import { Button, Link } from "@heroui/react";
import { motion } from "motion/react";
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
  const [selected, setSelected] = useState<string>("archives");

  const ArchivesSection = () => (
    <div className="space-y-4 lg:space-y-6">
      {/* CA Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="group relative overflow-hidden rounded-xl"
      >
        <div className="from-primary/20 absolute inset-0 z-0 bg-gradient-to-r to-purple-500/20 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100" />
        <div className="bg-default-100/80 group-hover:bg-default-200/80 relative z-10 backdrop-blur-sm transition-all duration-300">
          <div className="flex items-start gap-3 p-4 md:p-6">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="bg-primary/10 rounded-lg p-2"
            >
              <MdOpenInNew className="text-primary h-5 w-5" />
            </motion.div>
            <div className="flex-1">
              <h3 className="from-primary via-foreground mb-1 bg-gradient-to-r to-purple-500 bg-clip-text text-lg font-bold text-transparent">
                Comptes-rendus CA
              </h3>
              <p className="text-foreground/60 text-sm">
                Archives des réunions du conseil d&apos;administration
              </p>
            </div>
          </div>
          <div className="px-4 pb-4 md:px-6 md:pb-6">
            <CAMinutesList />
            <Link
              href="https://drive.google.com/drive/folders/0B3HMykcVQJAVdmw2aTdyQUJyWUE?resourcekey=0-eSCStZ_H5-WvEpmFYk8sdQ"
              target="_blank"
              className="text-primary mt-4 flex items-center gap-2 transition-transform hover:scale-105"
            >
              Voir toutes les archives <MdOpenInNew />
            </Link>
          </div>
        </div>
      </motion.div>

      {/* AG Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="group relative overflow-hidden rounded-xl"
      >
        <div className="from-primary/20 absolute inset-0 z-0 bg-gradient-to-r to-purple-500/20 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100" />
        <div className="bg-default-100/80 group-hover:bg-default-200/80 relative z-10 backdrop-blur-sm transition-all duration-300">
          <div className="flex items-start gap-3 p-4 md:p-6">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="bg-primary/10 rounded-lg p-2"
            >
              <MdOpenInNew className="text-primary h-5 w-5" />
            </motion.div>
            <div className="flex-1">
              <h3 className="from-primary via-foreground mb-1 bg-gradient-to-r to-purple-500 bg-clip-text text-lg font-bold text-transparent">
                Comptes-rendus AG
              </h3>
              <p className="text-foreground/60 text-sm">
                Archives des assemblées générales
              </p>
            </div>
          </div>
          <div className="px-4 pb-4 md:px-6 md:pb-6">
            <PdfList jsonFileName="pdf_filesAG" context={"AG"} />
            <Link
              href="https://drive.google.com/drive/folders/0B3HMykcVQJAVUGE3SllOZlRDMFk?resourcekey=0-KWWoenv1O_uTnu0GNE1t2Q"
              target="_blank"
              className="text-primary mt-4 flex items-center gap-2 transition-transform hover:scale-105"
            >
              Voir toutes les archives <MdOpenInNew />
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Gazettes Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="group relative overflow-hidden rounded-xl"
      >
        <div className="from-primary/20 absolute inset-0 z-0 bg-gradient-to-r to-purple-500/20 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100" />
        <div className="bg-default-100/80 group-hover:bg-default-200/80 relative z-10 backdrop-blur-sm transition-all duration-300">
          <div className="flex items-start gap-3 p-4 md:p-6">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="bg-primary/10 rounded-lg p-2"
            >
              <MdOpenInNew className="text-primary h-5 w-5" />
            </motion.div>
            <div className="flex-1">
              <h3 className="from-primary via-foreground mb-1 bg-gradient-to-r to-purple-500 bg-clip-text text-lg font-bold text-transparent">
                Gazettes
              </h3>
              <p className="text-foreground/60 text-sm">
                Archives des gazettes
              </p>
            </div>
          </div>
          <div className="px-4 pb-4 md:px-6 md:pb-6">
            <PdfList jsonFileName="pdf_filesGazettes" context={"Gazettes"} />
          </div>
        </div>
      </motion.div>

      {/* Pêle-Mêle Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="group relative overflow-hidden rounded-xl"
      >
        <div className="from-primary/20 absolute inset-0 z-0 bg-gradient-to-r to-purple-500/20 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100" />
        <div className="bg-default-100/80 group-hover:bg-default-200/80 relative z-10 backdrop-blur-sm transition-all duration-300">
          <div className="flex items-start gap-3 p-4 md:p-6">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="bg-primary/10 rounded-lg p-2"
            >
              <MdOpenInNew className="text-primary h-5 w-5" />
            </motion.div>
            <div className="flex-1">
              <h3 className="from-primary via-foreground mb-1 bg-gradient-to-r to-purple-500 bg-clip-text text-lg font-bold text-transparent">
                Pêle-Mêle
              </h3>
              <p className="text-foreground/60 text-sm">Archives diverses</p>
            </div>
          </div>
          <div className="px-4 pb-4 md:px-6 md:pb-6">
            <PdfList jsonFileName="pdf_filesPM" context={"PM"} />
            <Link
              href="https://drive.google.com/drive/folders/0B3HMykcVQJAVcG9Nd1JRa19tM3c?resourcekey=0-kSko9ElajKHa981AXkCz8Q"
              target="_blank"
              className="text-primary mt-4 flex items-center gap-2 transition-transform hover:scale-105"
            >
              Voir toutes les archives <MdOpenInNew />
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );

  const RegulationsSection = () => (
    <div className="space-y-6">
      {/* Main Regulations Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="group relative overflow-hidden rounded-xl"
      >
        <div className="from-primary/20 absolute inset-0 z-0 bg-gradient-to-r to-purple-500/20 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100" />
        <div className="bg-default-100/80 group-hover:bg-default-200/80 relative z-10 backdrop-blur-sm transition-all duration-300">
          <div className="flex flex-col items-start justify-between gap-3 p-4 md:p-6 lg:flex-row lg:items-center">
            <div className="flex items-start gap-3">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="bg-primary/10 rounded-lg p-2"
              >
                <IoDocumentText className="text-primary h-5 w-5" />
              </motion.div>
              <div>
                <h3 className="from-primary via-foreground mb-1 bg-gradient-to-r to-purple-500 bg-clip-text text-lg font-bold text-transparent">
                  Règlement intérieur
                </h3>
                <p className="text-foreground/60 text-sm">
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
              className="transition-transform hover:scale-105"
            >
              Version complète
            </Button>
          </div>
          <div className="space-y-3 px-4 pb-4 md:px-6 md:pb-6">
            {/* Répétitions */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="bg-default-50/50 rounded-lg p-4 backdrop-blur-sm"
            >
              <h4 className="text-foreground mb-2 font-semibold">
                Répétitions
              </h4>
              <p className="text-foreground/60 text-sm italic">
                Le Bon Tempérament répète un dimanche par mois et part en
                tournée dix jours en été. Les répétitions de pupitres, hommes et
                femmes, ont lieu tous les 15 jours.
              </p>
            </motion.div>

            {/* Commission de solidarité */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="bg-default-50/50 rounded-lg p-4 backdrop-blur-sm"
            >
              <h4 className="text-foreground mb-2 font-semibold">
                Commission de solidarité
              </h4>
              <p className="text-foreground/60 text-sm italic">
                Une commission de solidarité est mise en place. Le fonds de
                solidarité est alimenté par des dons et par le produit de
                certaines manifestations auxquelles l&apos;association
                participe...
              </p>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Additional Documents */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.3 }}
        >
          <Link
            href="/pdf/charte_BT.pdf"
            target="_blank"
            className="group relative block overflow-hidden rounded-xl"
          >
            <div className="from-primary/20 absolute inset-0 z-0 bg-gradient-to-r to-purple-500/20 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100" />
            <div className="bg-default-100/80 group-hover:bg-default-200/80 relative z-10 flex items-start gap-4 p-4 backdrop-blur-sm transition-all duration-300">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="bg-primary/10 rounded-lg p-2"
              >
                <IoDocumentText className="text-primary h-5 w-5" />
              </motion.div>
              <div>
                <h4 className="text-foreground mb-1 font-semibold">
                  Charte des séjours
                </h4>
                <p className="text-foreground/60 text-sm">
                  Consultez la charte complète sur les séjours BT
                </p>
              </div>
            </div>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.3 }}
        >
          <Link
            href="/pdf/Statuts_Le_Bon_Tempérament.pdf"
            target="_blank"
            className="group relative block overflow-hidden rounded-xl"
          >
            <div className="from-primary/20 absolute inset-0 z-0 bg-gradient-to-r to-purple-500/20 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100" />
            <div className="bg-default-100/80 group-hover:bg-default-200/80 relative z-10 flex items-start gap-4 p-4 backdrop-blur-sm transition-all duration-300">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="bg-primary/10 rounded-lg p-2"
              >
                <IoDocumentText className="text-primary h-5 w-5" />
              </motion.div>
              <div>
                <h4 className="text-foreground mb-1 font-semibold">
                  Statuts de l&apos;association
                </h4>
                <p className="text-foreground/60 text-sm">
                  Consultez les statuts complets du Bon Tempérament
                </p>
              </div>
            </div>
          </Link>
        </motion.div>
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
        {softwareCategories.map((category, categoryIndex) => (
          <motion.div
            key={category.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 * categoryIndex }}
            className="group relative overflow-hidden rounded-xl"
          >
            <div className="from-primary/20 absolute inset-0 z-0 bg-gradient-to-r to-purple-500/20 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100" />
            <div className="bg-default-100/80 group-hover:bg-default-200/80 relative z-10 backdrop-blur-sm transition-all duration-300">
              <div className="flex items-center gap-3 p-4 md:p-6">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="bg-primary/10 rounded-lg p-2"
                >
                  <category.icon className="text-primary h-5 w-5" />
                </motion.div>
                <h3 className="from-primary via-foreground bg-gradient-to-r to-purple-500 bg-clip-text text-lg font-bold text-transparent">
                  {category.title}
                </h3>
              </div>
              <div className="px-4 pb-4 md:px-6 md:pb-6">
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                  {category.items.map((item, itemIndex) => (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.3, delay: 0.05 * itemIndex }}
                    >
                      <Link
                        href={item.link}
                        target="_blank"
                        className="group/item relative block overflow-hidden rounded-lg"
                      >
                        <div className="from-primary/10 absolute inset-0 z-0 bg-gradient-to-br to-purple-500/10 opacity-0 blur-md transition-opacity duration-300 group-hover/item:opacity-100" />
                        <div className="bg-default-50/80 group-hover/item:bg-default-100/80 relative z-10 flex flex-col items-center p-4 backdrop-blur-sm transition-all duration-300">
                          {item.imageType === "icon" && item.icon ? (
                            <item.icon className="mb-3 h-12 w-12 transition-transform group-hover/item:scale-110" />
                          ) : (
                            <CloudinaryImage
                              src={item.image!}
                              alt={`logo ${item.name}`}
                              width={48}
                              height={48}
                              rounded={RoundedSize.NONE}
                              className="mb-3 transition-transform group-hover/item:scale-110"
                            />
                          )}
                          <span className="text-foreground text-center text-sm font-medium">
                            {item.name}
                          </span>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        ))}

        {/* Tips Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="group relative overflow-hidden rounded-xl"
        >
          <div className="from-primary/20 absolute inset-0 z-0 bg-gradient-to-r to-purple-500/20 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100" />
          <div className="bg-default-100/80 group-hover:bg-default-200/80 relative z-10 backdrop-blur-sm transition-all duration-300">
            <div className="flex items-center gap-3 p-4 md:p-6">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="bg-primary/10 rounded-lg p-2"
              >
                <FaTools className="text-primary h-5 w-5" />
              </motion.div>
              <h3 className="from-primary via-foreground bg-gradient-to-r to-purple-500 bg-clip-text text-lg font-bold text-transparent">
                Trucs et astuces
              </h3>
            </div>
            <div className="px-4 pb-4 md:px-6 md:pb-6">
              <p className="text-foreground/60 text-sm">
                Windows Media Player permet de modifier la vitesse de lecture
                d&apos;un enregistrement sans modifier la tessiture...
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  };

  return (
    <div className="container mx-auto w-full px-2 py-6 md:px-4 md:py-8 lg:px-6 lg:py-12">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-6 flex items-center gap-4 md:mb-8"
      >
        <motion.div
          whileHover={{ scale: 1.1, rotate: 360 }}
          transition={{ duration: 0.6 }}
          className="bg-primary/10 rounded-xl p-3"
        >
          <MdAdminPanelSettings className="text-primary h-7 w-7" />
        </motion.div>
        <div>
          <h1 className="from-primary via-foreground bg-gradient-to-r to-purple-500 bg-clip-text text-2xl font-extrabold text-transparent md:text-3xl lg:text-4xl">
            Administration
          </h1>
          <p className="text-foreground/60 mt-1 text-sm md:text-base">
            Documents et ressources administratives
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="bg-default-50/50 rounded-xl p-1 backdrop-blur-sm md:p-2"
      >
        <div className="mb-4 flex gap-2 overflow-x-auto md:mb-6">
          {[
            { key: "archives", label: "Archives" },
            { key: "reglement", label: "Règlement" },
            { key: "logiciels", label: "Logiciels" },
          ].map((tab) => (
            <motion.button
              key={tab.key}
              onClick={() => setSelected(tab.key)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition-all duration-300 md:px-6 md:py-3 md:text-base ${
                selected === tab.key
                  ? "from-primary bg-gradient-to-r to-purple-500 text-white shadow-lg"
                  : "bg-default-100/80 text-foreground hover:bg-default-200/80 backdrop-blur-sm"
              }`}
            >
              {tab.label}
            </motion.button>
          ))}
        </div>

        <motion.div
          key={selected}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.4 }}
        >
          {selected === "archives" && <ArchivesSection />}
          {selected === "reglement" && <RegulationsSection />}
          {selected === "logiciels" && <SoftwareSection />}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Administration;
