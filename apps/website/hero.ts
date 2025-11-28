import { heroui } from "@heroui/react";

/**
 * HeroUI Theme Configuration for Tailwind v4
 * This plugin exports the heroui configuration to be used with @plugin directive
 * Reference: https://www.heroui.com/docs/guide/tailwind-v4
 */
export default heroui({
  themes: {
    light: {
      colors: {
        background: "#FFFFFF",
        foreground: "#11181C",
        primary: {
          50: "#E6F1F2",
          100: "#CCE4E5",
          200: "#99C9CB",
          300: "#66AEB1",
          400: "#339397",
          500: "#1a878d",
          600: "#156C71",
          700: "#105155",
          800: "#0B3638",
          900: "#051B1C",
          DEFAULT: "#1a878d",
          foreground: "#FFFFFF",
        },
        focus: "#1a878d",
      },
    },
    dark: {
      colors: {
        background: "#0d1616", // Very dark teal-tinted background instead of pure black
        foreground: "#ECEDEE",
        primary: {
          50: "#E6F4F5",
          100: "#CCE9EB",
          200: "#99D3D7",
          300: "#66BDC3",
          400: "#33A7AF",
          500: "#26a5ad",
          600: "#1E848A",
          700: "#176368",
          800: "#0F4245",
          900: "#082123",
          DEFAULT: "#66BDC3", // Lighter teal for better contrast on dark background
          foreground: "#FFFFFF", // Light text on dark teal for better accessibility
        },
        focus: "#66BDC3", // Match primary DEFAULT for consistency
        default: {
          50: "#142323", // More teal-tinted for better contrast with background
          100: "#1a2c2c",
          200: "#203535",
          300: "#263e3e",
          400: "#B8C5C6", // Lighter for better text contrast in dark mode
          500: "#325050",
          600: "#D1D9DA", // Even lighter for better contrast when using text-default-600
          700: "#E0E6E7",
          800: "#E8EDEE",
          900: "#F0F3F4",
          DEFAULT: "#1a2c2c",
          foreground: "#ECEDEE",
        },
      },
    },
  },
}) as any;
