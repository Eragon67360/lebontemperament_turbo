"use client";

import { RoundedSize } from "@/utils/types";
import Link from "next/link";
import { JSX, useState } from "react";
import { IconType } from "react-icons";
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
];

const FileExplorer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabContent>(tabs[0]!);

  return (
    <div className="rounded-xl bg-white shadow-sm">
      {/* Header */}
      <div className="border-b p-6">
        <div className="flex items-center gap-3">
          <CloudinaryImage
            src={"Site/membres/logos/drive"}
            alt="Drive icon"
            width={24}
            height={24}
            rounded={RoundedSize.NONE}
          />
          <h2 className="text-lg font-semibold text-gray-900">Drive</h2>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* Sidebar */}
        <div className="w-full border-r border-gray-100 p-4 lg:w-72">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
            {tabs.map((tab, index) => (
              <button
                key={index}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-3 rounded-lg p-3 transition-all duration-200 ${
                  activeTab.id === tab.id
                    ? "bg-primary/5 text-primary"
                    : "hover:bg-gray-50"
                }`}
              >
                <div
                  className={`rounded-md p-2`}
                  style={{ backgroundColor: `#${tab.iconColor}1e` }}
                >
                  <tab.icon
                    className={`h-4 w-4`}
                    style={{ color: `#${tab.iconColor}` }}
                  />
                </div>
                <span className="text-sm font-medium">{tab.title}</span>
              </button>
            ))}
          </div>

          <div className="mt-6 border-t pt-6">
            <Link
              href="https://drive.google.com/drive/folders/1oQGEse5USfg9KhM7dZv7_w6olmk_slaU"
              target="_blank"
              rel="noopener"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
            >
              Accès direct au drive
              <LuExternalLink className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          <div className="mb-6 flex items-center gap-3">
            <div
              className={`rounded-md p-2`}
              style={{ backgroundColor: `#${activeTab.iconColor}1e` }}
            >
              <activeTab.icon
                className={`h-5 w-5`}
                style={{ color: `#${activeTab.iconColor}` }}
              />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              {activeTab.title}
            </h2>
          </div>

          <div className="rounded-lg bg-gray-50 p-4">{activeTab.component}</div>
        </div>
      </div>
    </div>
  );
};

export default FileExplorer;
