"use client";

import musicDetails from "@/public/json/music_files_bt_album.json";
import Image from "next/image";
import { useState } from "react";
import { IoMusicalNotes, IoPlay } from "react-icons/io5"; // Add these imports
import MusicPlayer from "./MusicPlayer";

const MusicList = () => {
  const [currentSong, setCurrentSong] = useState("");
  const commonExtensions = [".mp3", ".wav", ".flac", ".aac", ".m4a"];

  const getMusicSrc = (fileName: string) => {
    const hasExtension = commonExtensions.some((ext) =>
      fileName.toLowerCase().endsWith(ext),
    );
    const fullPath = hasExtension ? fileName : `${fileName}.mp3`;
    return `/music/BT - Album/${fullPath}`;
  };

  const cleanDisplayName = (fileName: string) => {
    return fileName
      .replace("/music/BT - Album/", "")
      .replace(/^\d+ - Le Bon Tempérament - /, "")
      .replace(/\.mp3$/, "");
  };

  return (
    <div className="border-members-line bg-members-card overflow-hidden rounded-2xl border">
      {/* Album Header */}
      <div className="bg-primary-solid text-accent-foreground p-4 sm:p-5">
        <div className="flex items-center gap-4">
          <Image
            src="/music/BT - Album/bt_20ans_pochette.jpg"
            alt="album pochette"
            width={120}
            height={120}
            className="rounded-lg shadow-lg"
          />
          <div className="flex flex-col">
            <h3 className="text-xl font-extrabold">Les 20 ans du BT (Live)</h3>
            <p className="opacity-90">Le Bon Tempérament</p>
          </div>
        </div>

        {/* Music Player */}
        {currentSong && (
          <div className="mt-4">
            <MusicPlayer src={currentSong} />
          </div>
        )}
      </div>

      {/* Tracks List */}
      <div className="divide-members-line divide-y">
        {musicDetails.map((file, index) => (
          <button
            key={index}
            onClick={() => setCurrentSong(getMusicSrc(file.name))}
            aria-pressed={currentSong === getMusicSrc(file.name)}
            className={`hover:bg-primary/5 flex min-h-14 w-full items-center gap-3.5 px-4 py-3 transition-colors ${
              currentSong === getMusicSrc(file.name)
                ? "bg-primary/10"
                : "bg-transparent"
            }`}
          >
            <div className="bg-primary/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
              {currentSong === getMusicSrc(file.name) ? (
                <IoMusicalNotes
                  aria-hidden="true"
                  className="text-primary-text h-5 w-5"
                />
              ) : (
                <IoPlay
                  aria-hidden="true"
                  className="text-primary-text h-5 w-5"
                />
              )}
            </div>

            <div className="flex-1 text-left">
              <p className="text-foreground font-bold">
                {cleanDisplayName(file.name)}
              </p>
              <p className="text-muted text-base">Le Bon Tempérament</p>
            </div>

            <span className="text-muted text-base">{file.duration}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MusicList;
