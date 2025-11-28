"use client";

import { RoundedSize } from "@/utils/types";
import { motion } from "motion/react";
import Link from "next/link";
import { JSX, useState } from "react";
import { IconType } from "react-icons";
import { FaMusic } from "react-icons/fa";
import { FaPerson } from "react-icons/fa6";
import { GiTrumpet } from "react-icons/gi";
import { LuBaby, LuExternalLink } from "react-icons/lu";
import CloudinaryImage from "../CloudinaryImage";
import Explorer from "./Explorer";

interface TabContent {
  id: number;
  title: string;
  icon: IconType;
  iconColor: string;
  component: JSX.Element;
}

const adultesId =
  process.env.NEXT_PUBLIC_GDRIVE_ADULTES_FOLDER ||
  "19vwE3JOMqUGSHGKEQxKuttAhvD0gu3cd";
const jeunesId =
  process.env.NEXT_PUBLIC_GDRIVE_JEUNES_FOLDER ||
  "18ZukzBIhWotJ9UxpUTdodGBSY1wf0Q81";
const enfantsId =
  process.env.NEXT_PUBLIC_GDRIVE_ENFANTS_FOLDER ||
  "1Jcn6pSKBHpOvFXp5j0h6kKcwOBrAIkId";
const orchestreId =
  process.env.NEXT_PUBLIC_GDRIVE_ORCHESTRE_FOLDER ||
  "1t72TgfhowS2WqYDFYLkasqopdUI_FEem";

const tabs: TabContent[] = [
  {
    id: 1,
    title: "Adultes",
    icon: FaPerson,
    iconColor: "11BBF8",
    component: <Explorer initialFolderId={adultesId} />,
  },
  {
    id: 2,
    title: "Jeunes",
    icon: FaPerson,
    iconColor: "F84E11",
    component: <Explorer initialFolderId={jeunesId} />,
  },
  {
    id: 3,
    title: "Enfants",
    icon: LuBaby,
    iconColor: "C211F8",
    component: <Explorer initialFolderId={enfantsId} />,
  },
  {
    id: 4,
    title: "Orchestre",
    icon: GiTrumpet,
    iconColor: "41EDBA",
    component: <Explorer initialFolderId={orchestreId} />,
  },
  {
    id: 5,
    title: "Cahier 30 ans",
    icon: FaMusic,
    iconColor: "eb4034",
    component: <Explorer initialFolderId="1HJaLRjjkRxwIFiC2FUgN-c-7KoepLKFB" />,
  },
];

const FileExplorer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabContent>(tabs[0]!);

  return (
    <div className="container mx-auto w-full px-2 py-6 md:px-4 md:py-8 lg:px-6 lg:py-12">
      {/* Header */}
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
          <CloudinaryImage
            src={"Site/membres/logos/drive"}
            alt="Drive icon"
            width={28}
            height={28}
            rounded={RoundedSize.NONE}
          />
        </motion.div>
        <div>
          <h1 className="from-primary via-foreground bg-gradient-to-r to-purple-500 bg-clip-text text-2xl font-extrabold text-transparent md:text-3xl lg:text-4xl">
            Partitions & Documents
          </h1>
          <p className="text-foreground/60 mt-1 text-sm md:text-base">
            Accédez aux documents de travail du Bon Tempérament
          </p>
        </div>
      </motion.div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full lg:w-80"
        >
          <div className="bg-default-100/80 rounded-xl p-3 backdrop-blur-sm md:p-4">
            <div className="grid grid-cols-2 gap-2 md:gap-3 lg:grid-cols-1">
              {tabs.map((tab, index) => (
                <motion.button
                  key={index}
                  onClick={() => setActiveTab(tab)}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 * index }}
                  className={`group relative flex cursor-pointer items-center gap-3 overflow-hidden rounded-xl p-3 transition-all duration-300 md:p-4 ${
                    activeTab.id === tab.id
                      ? "from-primary/20 bg-gradient-to-r to-purple-500/20 shadow-lg"
                      : "hover:bg-default-50/50 bg-transparent"
                  }`}
                >
                  <motion.div
                    whileHover={{ rotate: 10 }}
                    className="rounded-lg p-2"
                    style={{ backgroundColor: `#${tab.iconColor}15` }}
                  >
                    <tab.icon
                      className="h-5 w-5"
                      style={{ color: `#${tab.iconColor}` }}
                    />
                  </motion.div>
                  <span
                    className={`text-sm font-semibold md:text-base ${
                      activeTab.id === tab.id
                        ? "text-foreground"
                        : "text-foreground/70"
                    }`}
                  >
                    {tab.title}
                  </span>
                </motion.button>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="mt-4 md:mt-6"
            >
              <Link
                href="https://drive.google.com/drive/folders/1oQGEse5USfg9KhM7dZv7_w6olmk_slaU"
                target="_blank"
                rel="noopener"
              >
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="from-primary flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r to-purple-500 px-4 py-3 text-sm font-medium text-white shadow-lg transition-shadow hover:shadow-xl"
                >
                  Accès direct au drive
                  <LuExternalLink className="h-4 w-4" />
                </motion.div>
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {/* Main Content */}
        <motion.div
          key={activeTab.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex-1"
        >
          <div className="group relative overflow-hidden rounded-xl">
            <div className="from-primary/20 absolute inset-0 z-0 bg-gradient-to-r to-purple-500/20 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100" />
            <div className="bg-default-100/80 relative z-10 backdrop-blur-sm">
              <div className="flex items-center gap-4 p-4 md:p-6">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.4 }}
                  className="rounded-xl p-3"
                  style={{ backgroundColor: `#${activeTab.iconColor}15` }}
                >
                  <activeTab.icon
                    className="h-6 w-6 md:h-7 md:w-7"
                    style={{ color: `#${activeTab.iconColor}` }}
                  />
                </motion.div>
                <h2
                  className="text-xl font-extrabold md:text-2xl"
                  style={{
                    background: `linear-gradient(to right, #${activeTab.iconColor} 0%, #${activeTab.iconColor}88 50%, hsl(var(--heroui-foreground) / 1) 100%)`,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    color: "transparent",
                  }}
                >
                  {activeTab.title}
                </h2>
              </div>

              <div className="p-4 md:p-6">
                <div className="bg-default-50/50 rounded-xl p-3 backdrop-blur-sm md:p-4">
                  {activeTab.component}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default FileExplorer;
