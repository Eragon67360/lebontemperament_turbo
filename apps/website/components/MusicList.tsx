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
    <div className="bg-content1 overflow-hidden rounded-xl">
      {/* Album Header */}
      <div className="from-primary bg-gradient-to-r to-[#43475e] p-4">
        <div className="flex items-center gap-4">
          <Image
            src="/music/BT - Album/bt_20ans_pochette.jpg"
            alt="album pochette"
            width={120}
            height={120}
            className="rounded-lg shadow-lg"
          />
          <div className="flex flex-col">
            <h2 className="text-lg font-semibold text-white">
              Les 20 ans du BT (Live)
            </h2>
            <h3 className="text-sm text-white/80">Le Bon Tempérament</h3>
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
      <div className="divide-divider divide-y">
        {musicDetails.map((file, index) => (
          <button
            key={index}
            onClick={() => setCurrentSong(getMusicSrc(file.name))}
            className={`hover:bg-default-50 flex w-full items-center gap-3 px-4 py-3 transition-colors ${
              currentSong === getMusicSrc(file.name)
                ? "bg-primary/5"
                : "bg-transparent"
            }`}
          >
            <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-full">
              {currentSong === getMusicSrc(file.name) ? (
                <IoMusicalNotes className="text-primary h-4 w-4" />
              ) : (
                <IoPlay className="text-primary h-4 w-4" />
              )}
            </div>

            <div className="flex-1 text-left">
              <p className="text-foreground text-sm font-medium">
                {cleanDisplayName(file.name)}
              </p>
              <p className="text-default-500 text-xs">Le Bon Tempérament</p>
            </div>

            <span className="text-default-400 text-xs">{file.duration}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MusicList;
