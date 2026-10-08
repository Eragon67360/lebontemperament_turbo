"use client";

import { APP_STORE_URL, GOOGLE_PLAY_URL } from "@/lib/app-links";
import { formatDeliveryCode } from "@/lib/deliveryCode";
import { buttonVariants } from "@heroui/react";
import { Smartphone } from "lucide-react";
import { IoLogoApple, IoLogoGooglePlaystore } from "react-icons/io5";

const storeButtonClass = buttonVariants({
  variant: "primary",
  size: "sm",
  className: "flex-1 sm:flex-none",
});

/**
 * Shown above the tracking view of `/l/<code>` (#593): the phone that opened
 * the SMS link in the browser can also follow the delivery in the app, with
 * the notifications of the delivery day. The code is repeated in its printed
 * form so it can be typed in the app by hand.
 */
export function AppInviteCard({ code }: { code: string }) {
  return (
    <section
      aria-labelledby="app-invite-title"
      className="rounded-2xl border border-white/20 bg-white/70 p-4 shadow-xl backdrop-blur-lg sm:p-5 dark:border-gray-500/20 dark:bg-gray-900/70"
    >
      <div className="flex items-start gap-3">
        <div className="bg-primary-50 dark:bg-primary-900/60 flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
          <Smartphone className="text-primary h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h2
            id="app-invite-title"
            className="text-base font-semibold text-gray-900 dark:text-gray-100"
          >
            Recevez les notifications de votre livraison dans l’appli Le Bon
            Tempérament
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href={APP_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={storeButtonClass}
            >
              <IoLogoApple className="shrink-0" aria-hidden />
              App Store
            </a>
            <a
              href={GOOGLE_PLAY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={storeButtonClass}
            >
              <IoLogoGooglePlaystore className="shrink-0" aria-hidden />
              Google Play
            </a>
          </div>
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
            Déjà installée ? Touchez à nouveau le lien du SMS, ou saisissez le
            code{" "}
            <span className="font-mono font-semibold tracking-wider text-gray-900 dark:text-gray-100">
              {formatDeliveryCode(code)}
            </span>{" "}
            dans l’appli (À propos › J’ai un code).
          </p>
        </div>
      </div>
    </section>
  );
}
