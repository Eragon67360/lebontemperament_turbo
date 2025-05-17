"use client";

import { Button, Popover, PopoverTrigger, PopoverContent } from "@heroui/react";
import { FaFacebook, FaTiktok, FaInstagram, FaYoutube } from "react-icons/fa";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export const SocialPopover = () => {
  const [currentIconIndex, setCurrentIconIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const pathname = usePathname();
  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIconIndex((prevIndex) => (prevIndex + 1) % socials.length);
        setIsTransitioning(false);
      }, 200);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    !pathname.startsWith("/membres") && (
      <div className="fixed bottom-8 right-8">
        <Popover>
          <PopoverTrigger>
            <Button
              size="md"
              isIconOnly
              variant="flat"
              className="rounded-full bg-primary hover:scale-110 transition-all duration-500"
            >
              <span
                className={`
                text-white text-xl 
                transition-opacity duration-400 ease-in-out
                ${isTransitioning ? "opacity-0" : "opacity-100"}
              `}
              >
                {socials[currentIconIndex]?.icon}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="flex flex-col gap-2 p-4 items-start">
            {socials.map((social) => (
              <a
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 hover:text-primary transition-colors"
              >
                {social.icon}
                <span>{social.name}</span>
              </a>
            ))}
          </PopoverContent>
        </Popover>
      </div>
    )
  );
};

const socials = [
  {
    name: "Facebook",
    url: "https://www.facebook.com/profile.php?id=100063069588507",
    icon: <FaFacebook size={20} />,
  },
  {
    name: "Tiktok",
    url: "https://www.tiktok.com/@lebontemperament",
    icon: <FaTiktok size={20} />,
  },
  {
    name: "Instagram",
    url: "https://www.instagram.com/lebontemperament_/",
    icon: <FaInstagram size={20} />,
  },
  {
    name: "YouTube",
    url: "https://www.youtube.com/@lebontemperament",
    icon: <FaYoutube size={20} />,
  },
];
