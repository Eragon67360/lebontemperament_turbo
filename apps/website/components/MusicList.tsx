"use client";

import musicDetails from "@/public/json/music_files_bt_album.json";
import Image from "next/image";
import { useState } from "react";
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
    const cleanedName = fileName
      .replace("/music/BT - Album/", "")
      .replace(/^\d+ - Le Bon Tempérament - /, "")
      .replace(/\.mp3$/, "");
    // Additional cleanup logic if necessary
    return cleanedName;
  };

  return (
    <div>
      <div className="flex flex-col rounded-2xl mx-0 lg:mx-32 bg-gradient-to-r from-[#599c9b] to-[#43475e]">
        <div className="rounded-md md:rounded-xl lg:rounded-2xl bg-gradient-to-r from-primary to-[#43475e] p-4 md:p-8 lg:p-16 shadow-xl flex flex-col lg:flex-row items-center lg:items-start gap-16">
          <Image
            src={"/music/BT - Album/bt_20ans_pochette.jpg"}
            alt="album pochette"
            width={280}
            height={120}
          />
          <div className="flex flex-col w-full justify-between px-8 lg:px-0">
            <h2 className="text-xl md:text-2xl lg:text-4xl text-white font-bold">
              Les 20 ans du BT (Live)
            </h2>
            <h3 className="text-lg md:text-xl lg:text-2xl text-white font-semibold">
              Le Bon Tempérament
            </h3>

            <div className="mt-8 space-y-2">
              {currentSong && <MusicPlayer src={currentSong} />}
            </div>
          </div>
        </div>
        <div className="my-4 md:my-8 lg:my-16 px-2 md:px-4 lg:px-8 space-y-4 text-white text-left ">
          {musicDetails.map((file, index) => (
            <button
              key={index}
              onClick={() => setCurrentSong(getMusicSrc(file.name))}
              className="bg-[#1E1E1E] p-8 w-full rounded-lg text-left flex justify-between hover:bg-[#1e1e1eaa]"
            >
              <div>
                <p className="text-base md:text-lg lg:text-xl font-bold">
                  {cleanDisplayName(file.name)}
                </p>
                <p className="text-sm md:text-base lg:text-lg">
                  Le Bon Tempérament
                </p>
              </div>
              <span className="text-white text-xs md:text-sm lg:text-base">
                {file.duration}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MusicList;
