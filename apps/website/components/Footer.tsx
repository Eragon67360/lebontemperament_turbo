"use client";
import { CldImage } from "next-cloudinary";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CiMail } from "react-icons/ci";
import { FaFacebookF, FaInstagram, FaTiktok, FaYoutube } from "react-icons/fa";
import { FiPhone } from "react-icons/fi";
import { IoLocationOutline } from "react-icons/io5";

const Footer = () => {
  const path = usePathname();
  if (path.startsWith("/membres")) {
    return <></>;
  }
  return (
    <footer
      className="bg-default-50 z-50 flex w-full flex-col justify-center transition-colors duration-200 select-none"
      role="contentinfo"
      aria-label="Pied de page"
    >
      <div className="z-50 mx-auto flex h-full max-w-[1440px] flex-col items-center justify-evenly gap-12 py-16 lg:flex-row lg:items-start lg:px-24">
        <div className="flex flex-col items-center gap-6 lg:items-start">
          <CldImage
            src={"Site/logo"}
            alt="Logo Le Bon Tempérament"
            width={160}
            height={160}
            className="scale-75"
          />
          <p className="text-default-600 max-w-xs text-center text-sm lg:text-left">
            Ensemble vocal et instrumental partageant la passion de la musique
            depuis 1987
          </p>
        </div>

        <div className="flex flex-col gap-12 xl:flex-row xl:gap-16">
          {/* Navigation Links */}
          <nav
            className="text-default-700 flex flex-col items-center gap-4 text-sm select-none lg:items-start"
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
              className="hover:text-primary dark:hover:text-primary transition-colors duration-200"
            >
              Accueil
            </Link>
            <Link
              href={"/galerie"}
              aria-label="Aller à la galerie"
              className="hover:text-primary dark:hover:text-primary transition-colors duration-200"
            >
              Galerie
            </Link>
            <Link
              href={"/decouvrir"}
              aria-label="Aller à la page Nous Découvrir"
              className="hover:text-primary dark:hover:text-primary transition-colors duration-200"
            >
              Nous découvrir
            </Link>
            <Link
              href={"/rejoindre"}
              aria-label="Découvrir comment rejoindre l'ensemble"
              className="hover:text-primary dark:hover:text-primary transition-colors duration-200"
            >
              Rejoindre
            </Link>
            <Link
              href={"/concerts"}
              aria-label="Aller à la page Nos Concerts"
              className="hover:text-primary dark:hover:text-primary transition-colors duration-200"
            >
              Nos concerts
            </Link>
            <Link
              href={"/contact"}
              aria-label="Aller à la page Contact"
              className="hover:text-primary dark:hover:text-primary transition-colors duration-200"
            >
              Contact
            </Link>
            <Link
              href={"/faq"}
              aria-label="Aller à la page Questions fréquentes"
              className="hover:text-primary dark:hover:text-primary transition-colors duration-200"
            >
              FAQ
            </Link>
          </nav>

          {/* Contact Information */}
          <address
            className="text-default-700 flex flex-col items-center gap-4 text-sm not-italic select-none lg:items-start"
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
                3 Rue Clémenceau,
                <br />
                67700 SAVERNE, France
              </p>
            </div>

            <div className="flex items-center gap-3">
              <CiMail
                size={18}
                className="text-primary shrink-0"
                aria-hidden="true"
              />
              <a
                href="mailto:lebontemperament@gmail.com"
                aria-label="Envoyer un email à Le Bon Tempérament"
                className="hover:text-primary dark:hover:text-primary transition-colors duration-200"
              >
                lebontemperament@gmail.com
              </a>
            </div>

            <div className="flex items-center gap-3">
              <FiPhone
                size={18}
                className="text-primary dark:text-primary shrink-0"
                aria-hidden="true"
              />
              <a
                href="tel:+33952395789"
                aria-label="Appeler Le Bon Tempérament"
                className="hover:text-primary dark:hover:text-primary transition-colors duration-200"
              >
                (+33) 09 52 39 57 89
              </a>
            </div>
          </address>

          {/* Social Media Links */}
          <nav
            className="text-default-700 flex flex-col items-center gap-4 text-sm select-none lg:items-start"
            aria-labelledby="footer-social"
          >
            <h3
              id="footer-social"
              className="text-foreground mb-2 text-lg font-semibold"
            >
              Nos réseaux
            </h3>
            <div className="flex items-center gap-4">
              <a
                href="https://www.facebook.com/p/Le-Bon-Temp%C3%A9rament-100063069588507/"
                aria-label="Accéder à la page Facebook de Le Bon Tempérament"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:bg-primary bg-default-100 text-default-700 flex h-10 w-10 items-center justify-center rounded-full shadow-sm transition-all duration-200 hover:text-white hover:shadow-md"
              >
                <FaFacebookF size={16} aria-hidden="true" />
              </a>
              <a
                href="https://www.instagram.com/lebontemperament_?igsh=bm1ndG4xNXpnZmI5"
                aria-label="Accéder à la page Instagram de Le Bon Tempérament"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:bg-primary bg-default-100 text-default-700 flex h-10 w-10 items-center justify-center rounded-full shadow-sm transition-all duration-200 hover:text-white hover:shadow-md"
              >
                <FaInstagram size={16} aria-hidden="true" />
              </a>
              <a
                href="https://www.youtube.com/@lebontemperament"
                aria-label="Accéder à la chaîne YouTube de Le Bon Tempérament"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:bg-primary bg-default-100 text-default-700 flex h-10 w-10 items-center justify-center rounded-full shadow-sm transition-all duration-200 hover:text-white hover:shadow-md"
              >
                <FaYoutube size={16} aria-hidden="true" />
              </a>
              <a
                href="https://www.tiktok.com/@lebontemperament"
                aria-label="Accéder à la page TikTok de Le Bon Tempérament"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:bg-primary bg-default-100 text-default-700 flex h-10 w-10 items-center justify-center rounded-full shadow-sm transition-all duration-200 hover:text-white hover:shadow-md"
              >
                <FaTiktok size={16} aria-hidden="true" />
              </a>
            </div>
          </nav>
        </div>
      </div>
      <hr className="border-divider" />
      <div className="text-default-500 flex flex-col items-center justify-center gap-2 py-6 text-center text-sm lg:flex-row">
        <p>
          © {new Date().getFullYear()} Tous droits réservés - Le Bon Tempérament
        </p>
        <span className="hidden lg:block">&nbsp;|&nbsp;</span>
        <Link
          href={"/politique-de-confidentialite"}
          className="hover:text-default-700 underline transition-colors"
          aria-label="Lire la politique de confidentialité"
        >
          Politique de Confidentialité
        </Link>
        <span className="hidden lg:block">&nbsp;|&nbsp;</span>
        <Link
          href={"/impressum"}
          className="hover:text-default-700 underline transition-colors"
          aria-label="Voir les mentions légales"
        >
          Impressum
        </Link>
      </div>
    </footer>
  );
};

export default Footer;
