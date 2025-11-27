"use client";

import { RoundedSize } from "@/utils/types";
import { Button } from "@heroui/react";
import NextLink from "next/link";
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
          <Button
            as={NextLink}
            href={"/img/gazettes/gazette_2023_03_05.pdf"}
            target="_blank"
            rel="noopener"
            variant="bordered"
            radius="sm"
            className="flex items-center gap-2 border-white bg-white text-black hover:border-white/50 hover:text-black/50"
          >
            <span className="text-xs tracking-[2.4px] uppercase">
              Voir la dernière gazette
            </span>
            <IoIosArrowRoundForward className="scale-110" />
          </Button>
          <div className="hidden h-full w-[1px] bg-white lg:block"></div>
          <Button
            as={NextLink}
            href={"/membres/administration#archives"}
            variant="bordered"
            radius="sm"
            className="flex items-center gap-2 border-white bg-white text-black hover:border-white/50 hover:text-black/50"
          >
            <span className="text-xs tracking-[2.4px] uppercase">
              Voir toutes les gazettes
            </span>
            <IoIosArrowRoundForward className="scale-110" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default Gazette;
