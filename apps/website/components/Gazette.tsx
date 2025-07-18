"use client";

import { RoundedSize } from "@/utils/types";
import Link from "next/link";
import { useState } from "react";
import { IoIosArrowRoundForward } from "react-icons/io";
import CloudinaryImage from "./CloudinaryImage";

const Gazette = () => {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <div
      className="relative mt-8 h-64 w-full cursor-pointer overflow-hidden rounded-3xl transition duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CloudinaryImage
        src={"Site/membres/gazette"}
        alt="Gazette image"
        rounded={RoundedSize.THREE_XL}
        className="rounded-3xl object-cover"
        width={3000}
        height={2000}
      />
      {isHovered && (
        <div className="absolute inset-0 flex flex-col items-center justify-evenly bg-black/70 py-4 transition duration-300 lg:flex-row">
          <Link
            href={"/img/gazettes/gazette_2023_03_05.pdf"}
            target="_blank"
            rel="noopener"
            className="flex items-center gap-2 border border-black bg-white p-4 text-black transition hover:border-black/50 hover:text-black/50"
          >
            <span className="text-[12px] tracking-[2.4px] uppercase">
              Voir la dernière gazette
            </span>
            <IoIosArrowRoundForward className="scale-110" />
          </Link>
          <div className="hidden h-full w-[1px] bg-white lg:block"></div>
          <Link
            href={"/membres/administration#archives"}
            className="flex items-center gap-2 border border-black bg-white p-4 text-black transition hover:border-black/50 hover:text-black/50"
          >
            <span className="text-[12px] tracking-[2.4px] uppercase">
              Voir toutes les gazettes
            </span>
            <IoIosArrowRoundForward className="scale-110" />
          </Link>
        </div>
      )}
    </div>
  );
};

export default Gazette;
