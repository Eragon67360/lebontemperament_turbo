"use client";

import { MembersCard } from "@/components/membres/MembersCard";
import { useState } from "react";
import { IconType } from "react-icons";
import { FaMusic } from "react-icons/fa";
import { FaPerson } from "react-icons/fa6";
import { GiTrumpet } from "react-icons/gi";
import { LuBaby } from "react-icons/lu";
import Explorer from "./Explorer";

export interface DriveFolderTab {
  slug: string;
  label: string;
  folder_id: string;
}

/**
 * Icons stay in code, keyed by slug: the set of folders is fixed in the
 * database, only the folder they point at is editable from the admin.
 */
const TAB_ICONS: Record<string, IconType> = {
  adultes: FaPerson,
  jeunes: FaPerson,
  enfants: LuBaby,
  orchestre: GiTrumpet,
  "cahier-30-ans": FaMusic,
};

interface FileExplorerProps {
  folders: DriveFolderTab[];
  /** The folder to open first, when it exists; the first one otherwise. */
  initialSlug?: string;
}

/** The score library: one button per Drive folder, the chosen folder's files. */
const FileExplorer: React.FC<FileExplorerProps> = ({
  folders,
  initialSlug,
}) => {
  const tabs = folders.map((folder) => ({
    ...folder,
    icon: TAB_ICONS[folder.slug] ?? FaMusic,
  }));
  const [activeSlug, setActiveSlug] = useState<string>(
    tabs.find((tab) => tab.slug === initialSlug)?.slug ?? tabs[0]?.slug ?? "",
  );
  const activeTab = tabs.find((tab) => tab.slug === activeSlug) ?? tabs[0]!;

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <nav aria-label="Dossiers de partitions" className="w-full lg:w-80">
        <MembersCard className="p-3 sm:p-4">
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
            {tabs.map((tab) => {
              const active = activeTab.slug === tab.slug;
              return (
                <li key={tab.slug} className="flex">
                  <button
                    type="button"
                    onClick={() => setActiveSlug(tab.slug)}
                    aria-pressed={active}
                    className={`flex min-h-14 w-full items-center gap-3 rounded-full border px-2 pr-4 text-left text-lg font-medium transition-colors ${
                      active
                        ? "bg-primary-solid text-accent-foreground border-primary-solid"
                        : "text-foreground hover:bg-primary/10 border-transparent"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                        active
                          ? "bg-white/20"
                          : "bg-primary/10 text-primary-text"
                      }`}
                    >
                      <tab.icon className="h-5 w-5" />
                    </span>
                    {tab.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </MembersCard>
      </nav>

      <MembersCard
        as="section"
        aria-labelledby="travail-folder"
        className="min-w-0 flex-1 p-5 sm:p-7"
      >
        <h2
          id="travail-folder"
          className="font-members-display mb-5 flex items-center gap-3 text-[26px] font-semibold"
        >
          <span
            aria-hidden="true"
            className="bg-members-band text-foreground flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
          >
            <activeTab.icon className="h-6 w-6" />
          </span>
          {activeTab.label}
        </h2>
        <Explorer initialFolderId={activeTab.folder_id} />
      </MembersCard>
    </div>
  );
};

export default FileExplorer;
