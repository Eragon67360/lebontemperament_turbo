"use client";
import CookiePreferencesButton from "@/components/cookies/CookiePreferencesButton";
import { useSiteSettings } from "@/components/providers/SiteSettingsProvider";
import { cloudinaryLoader } from "@/lib/cloudinaryImage";
import type { SocialNetwork } from "@repo/domain/utils/siteSettings";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { IconType } from "react-icons";
import { CiMail } from "react-icons/ci";
import { FaFacebookF, FaInstagram, FaTiktok, FaYoutube } from "react-icons/fa";
import { IoLocationOutline } from "react-icons/io5";

// Not imported from lib/contact: that module derives from the settings'
// defaults, which must stay out of the browser bundle.
const COUNTRY = "France";

// The links themselves are the admin's (social_links setting); the icon and
// the screen-reader label are the site's.
const SOCIALS: Record<SocialNetwork, { icon: IconType; label: string }> = {
  facebook: {
    icon: FaFacebookF,
    label: "Accéder à la page Facebook de Le Bon Tempérament",
  },
  instagram: {
    icon: FaInstagram,
    label: "Accéder à la page Instagram de Le Bon Tempérament",
  },
  youtube: {
    icon: FaYoutube,
    label: "Accéder à la chaîne YouTube de Le Bon Tempérament",
  },
  tiktok: {
    icon: FaTiktok,
    label: "Accéder à la page TikTok de Le Bon Tempérament",
  },
};

const Footer = () => {
  const path = usePathname();
  const { contact, social_links } = useSiteSettings();
  if (path.startsWith("/membres")) {
    return <></>;
  }
  return (
    <footer
      className="bg-surface-secondary z-50 flex w-full flex-col justify-center transition-colors duration-200 select-none"
      role="contentinfo"
      aria-label="Pied de page"
    >
      <div className="z-50 mx-auto flex h-full max-w-[1440px] flex-col items-center justify-evenly gap-12 py-16 lg:flex-row lg:items-start lg:px-24">
        <div className="flex flex-col items-center gap-6 lg:items-start">
          <Image
            loader={cloudinaryLoader}
            src={"Site/logo"}
            alt="Logo Le Bon Tempérament"
            width={120}
            height={120}
          />
          <p className="text-muted max-w-xs text-center text-sm lg:text-left">
            Ensemble vocal et instrumental partageant la passion de la musique
            depuis 1987
          </p>
        </div>

        <div className="flex flex-col gap-12 xl:flex-row xl:gap-16">
          {/* Navigation Links */}
          <nav
            className="text-muted flex flex-col items-center gap-4 text-sm select-none lg:items-start"
            aria-labelledby="footer-navigation"
          >
            <h3
              id="footer-navigation"
              className="text-foreground mb-2 text-lg font-semibold"
            >
              Naviguer
            </h3>
            <Link
              href={"/"}
              aria-label="Aller à l'accueil"
              className="hover:text-primary-text transition-colors duration-200"
            >
              Accueil
            </Link>
            <Link
              href={"/galerie"}
              aria-label="Aller à la galerie"
              className="hover:text-primary-text transition-colors duration-200"
            >
              Galerie
            </Link>
            <Link
              href={"/decouvrir"}
              aria-label="Aller à la page Nous Découvrir"
              className="hover:text-primary-text transition-colors duration-200"
            >
              Nous découvrir
            </Link>
            <Link
              href={"/rejoindre"}
              aria-label="Découvrir comment rejoindre l'ensemble"
              className="hover:text-primary-text transition-colors duration-200"
            >
              Rejoindre
            </Link>
            <Link
              href={"/don"}
              aria-label="Faire un don à l'association"
              className="hover:text-primary-text transition-colors duration-200"
            >
              Faire un don
            </Link>
            <Link
              href={"/concerts"}
              aria-label="Consulter l’agenda des concerts"
              className="hover:text-primary-text transition-colors duration-200"
            >
              Agenda
            </Link>
            <Link
              href={"/contact"}
              aria-label="Aller à la page Contact"
              className="hover:text-primary-text transition-colors duration-200"
            >
              Contact
            </Link>
            <Link
              href={"/faq"}
              aria-label="Aller à la page Questions fréquentes"
              className="hover:text-primary-text transition-colors duration-200"
            >
              FAQ
            </Link>
          </nav>

          {/* Contact Information */}
          <address
            className="text-muted flex flex-col items-center gap-4 text-sm not-italic select-none lg:items-start"
            aria-labelledby="footer-contact"
          >
            <h3
              id="footer-contact"
              className="text-foreground mb-2 text-lg font-semibold"
            >
              Contact
            </h3>
            <div className="flex items-start gap-3">
              <IoLocationOutline
                size={18}
                className="text-primary mt-0.5 shrink-0"
                aria-hidden="true"
              />
              <p className="text-left">
                {contact.street},
                <br />
                {contact.postalCode} {contact.city.toUpperCase()}, {COUNTRY}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <CiMail
                size={18}
                className="text-primary shrink-0"
                aria-hidden="true"
              />
              <a
                href={`mailto:${contact.email}`}
                aria-label="Envoyer un email à Le Bon Tempérament"
                className="hover:text-primary-text transition-colors duration-200"
              >
                {contact.email}
              </a>
            </div>
          </address>

          {/* Social Media Links */}
          {social_links.links.length > 0 && (
            <nav
              className="text-muted flex flex-col items-center gap-4 text-sm select-none lg:items-start"
              aria-labelledby="footer-social"
            >
              <h3
                id="footer-social"
                className="text-foreground mb-2 text-lg font-semibold"
              >
                Nos réseaux
              </h3>
              <div className="flex items-center gap-4">
                {social_links.links.map(({ network, url }) => {
                  const { icon: Icon, label } = SOCIALS[network];
                  return (
                    <a
                      key={network}
                      href={url}
                      aria-label={label}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:bg-primary-solid bg-surface-secondary text-muted flex h-10 w-10 items-center justify-center rounded-full shadow-sm transition-all duration-200 hover:text-white hover:shadow-md"
                    >
                      <Icon size={16} aria-hidden="true" />
                    </a>
                  );
                })}
              </div>
            </nav>
          )}
        </div>
      </div>
      <hr className="border-separator" />
      <div className="text-muted flex flex-col items-center justify-center gap-2 py-6 text-center text-sm lg:flex-row">
        <p>
          © {new Date().getFullYear()} Tous droits réservés - Le Bon Tempérament
        </p>
        <span className="hidden lg:block">&nbsp;|&nbsp;</span>
        <CookiePreferencesButton className="hover:text-muted cursor-pointer border-none bg-transparent p-0 text-inherit underline transition-colors">
          Gérer les cookies
        </CookiePreferencesButton>
        <span className="hidden lg:block">&nbsp;|&nbsp;</span>
        <Link
          href={"/politique-de-confidentialite"}
          className="hover:text-muted underline transition-colors"
          aria-label="Lire la politique de confidentialité"
        >
          Politique de Confidentialité
        </Link>
        <span className="hidden lg:block">&nbsp;|&nbsp;</span>
        <Link
          href={"/mentions-legales"}
          className="hover:text-muted underline transition-colors"
        >
          Mentions légales
        </Link>
      </div>
    </footer>
  );
};

export default Footer;
