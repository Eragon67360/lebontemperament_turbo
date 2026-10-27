import { nextJsConfig } from "@repo/eslint-config/next-js";

/** @type {import("eslint").Linter.Config} */
export default [
  { ignores: [".next/**", ".turbo/**"] },
  ...nextJsConfig,
  {
    // The site has one toast system, HeroUI's `toast` (audit UI-020).
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "sonner",
              message:
                "Use `toast` from @heroui/react: the website has one toast system.",
            },
          ],
        },
      ],
    },
  },
];
