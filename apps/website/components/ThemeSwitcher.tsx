"use client";

import { useTheme } from "next-themes";
import {
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";
import { FiSun, FiMoon } from "react-icons/fi";
import { BiDesktop } from "react-icons/bi";
import { useState, useEffect } from "react";

export const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) return null;
  return (
    <Dropdown>
      <DropdownTrigger>
        <Button
          variant="ghost"
          className="w-9 h-9 p-0 pointer-events-none opacity-0"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <FiMoon className="h-5 w-5" />
          ) : (
            <FiSun className="h-5 w-5" />
          )}
        </Button>
      </DropdownTrigger>
      <DropdownMenu aria-label="Theme selection">
        <DropdownItem
          key="light"
          startContent={<FiSun className="h-4 w-4" />}
          onPress={() => setTheme("light")}
        >
          Clair
        </DropdownItem>
        <DropdownItem
          key="dark"
          startContent={<FiMoon className="h-4 w-4" />}
          onPress={() => setTheme("dark")}
        >
          Sombre
        </DropdownItem>
        <DropdownItem
          key="system"
          startContent={<BiDesktop className="h-4 w-4" />}
          onPress={() => setTheme("system")}
        >
          Système
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
};
