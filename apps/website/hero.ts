import { heroui } from "@heroui/react";
import createPlugin from "tailwindcss/plugin";
const heroConfig: ReturnType<typeof createPlugin> = heroui({
  themes: {
    light: {
      layout: {},
      colors: {},
    },
    dark: {
      layout: {},
      colors: {
        primary: "#1a878d",
      },
    },
  },
});

export default heroConfig;
