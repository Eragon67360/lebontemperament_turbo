import { heroui } from "@heroui/react";
import createPlugin from "tailwindcss/plugin";
const heroConfig: ReturnType<typeof createPlugin> = heroui({
  themes: {
    light: {
      layout: {},
      colors: {
        focus: "#1a878d",
      },
    },
    dark: {
      layout: {},
      colors: {
        primary: "#1a878d",
        focus: "#1a878d",
      },
    },
  },
});

export default heroConfig;
