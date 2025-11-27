"use client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { motion } from "motion/react";

export function DashboardWelcomeHeader() {
  const { data: user } = useCurrentUser();

  const displayName =
    user?.user_metadata.display_name || user?.user_metadata.name;

  return (
    <div className="mb-8 lg:mb-0">
      {/* Mobile/Tablet View (Default) */}
      <div className="mt-8 lg:hidden">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 md:text-3xl">
          Bonjour,{" "}
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-gray-600"
          >
            {displayName}
          </motion.span>
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Voici ce qu'il se passe sur votre espace d'administration.
        </p>
      </div>

      {/* Desktop "Wave" View (iPhone Notch Style) */}
      <div className="pointer-events-none -mx-6 -mt-6 mb-6 hidden justify-center select-none lg:flex">
        <div className="pointer-events-auto relative flex items-start">
          {/* Left Wing (Smooth Curve) */}
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            className="mt-4 fill-current text-[#c9e2e4]" // -mr-[1px] to prevent sub-pixel gaps
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M20 20C20 8 10 0 0 0H20V20Z" />
          </svg>

          {/* Center Block */}
          <div className="mt-4 flex min-w-[200px] flex-col items-center justify-center rounded-b-[1.5rem] bg-[#c9e2e4] px-10 py-1">
            <div className="flex flex-col items-center gap-0.5">
              <h1 className="text-base font-semibold tracking-tight text-gray-900">
                Bonjour,{" "}
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6 }}
                  className="text-primary"
                >
                  {displayName}
                </motion.span>
              </h1>
              <p className="text-[10px] font-medium tracking-wider text-gray-500 uppercase opacity-80">
                Espace d'administration
              </p>
            </div>
          </div>

          {/* Right Wing (Smooth Curve) */}
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            className="mt-4 fill-current text-[#c9e2e4]" // -ml-[1px] to prevent sub-pixel gaps
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M0 20C0 8 10 0 20 0H0V20Z" />
          </svg>
        </div>
      </div>
    </div>
  );
}
