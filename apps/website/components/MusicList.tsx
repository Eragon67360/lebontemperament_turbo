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
      fileName.toLowerCase().endsWith(ext)
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
    <div className="bg-white rounded-xl overflow-hidden">
      {/* Album Header */}
      <div className="bg-gradient-to-r from-primary to-[#43475e] p-4">
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
      <div className="divide-y divide-gray-100">
        {musicDetails.map((file, index) => (
          <button
            key={index}
            onClick={() => setCurrentSong(getMusicSrc(file.name))}
            className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors ${
              currentSong === getMusicSrc(file.name)
                ? "bg-primary/5"
                : "bg-transparent"
            }`}
          >
            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-primary/10">
              {currentSong === getMusicSrc(file.name) ? (
                <IoMusicalNotes className="text-primary w-4 h-4" />
              ) : (
                <IoPlay className="text-primary w-4 h-4" />
              )}
            </div>

            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-gray-900">
                {cleanDisplayName(file.name)}
              </p>
              <p className="text-xs text-gray-500">Le Bon Tempérament</p>
            </div>

            <span className="text-xs text-gray-400">{file.duration}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MusicList;
