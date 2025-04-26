import { heroui } from "@heroui/react";
import createPlugin from "tailwindcss/plugin";
const heroConfig: ReturnType<typeof createPlugin> = heroui();

export default heroConfig;
