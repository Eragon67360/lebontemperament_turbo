"use client";
import React from "react";
import Link from "next/link";
import { IoLocationOutline } from "react-icons/io5";
import { FiPhone } from "react-icons/fi";
import { CiMail } from "react-icons/ci";
import { FaFacebookF, FaTiktok, FaInstagram, FaYoutube } from "react-icons/fa";
import { CldImage } from "next-cloudinary";
import { usePathname } from "next/navigation";

const Footer = () => {
  const path = usePathname();
  if (path.startsWith("/membres")) {
    return <></>;
  }
  return (
    <footer
      className="w-full bg-[#2C2C2C] flex flex-col select-none justify-center"
      role="contentinfo"
      aria-label="Pied de page"
    >
      <div className="h-full mx-8 max-w-[1920px] flex flex-col lg:flex-row justify-evenly py-12 items-center lg:items-start gap-4">
        <CldImage
          src={"Site/logo_nega"}
          alt="Logo Le Bon Tempérament en version négative"
          width={190}
          height={190}
        />

        <div className="flex flex-col xl:flex-row gap-8">
          {/* Navigation Links */}
          <nav
            className="flex flex-col items-start text-white text-[14px] select-none gap-4"
            aria-labelledby="footer-navigation"
          >
            <h3
              id="footer-navigation"
              className="font-bold uppercase text-[16px]"
            >
              Naviguer
            </h3>
            <Link
              href={"/"}
              aria-label="Aller à l'accueil"
              className="transition-all duration-300 hover:text-primary"
            >
              Accueil
            </Link>
            <Link
              href={"/galerie"}
              aria-label="Aller à la galerie"
              className="transition-all duration-300 hover:text-primary"
            >
              Galerie
            </Link>
            <Link
              href={"/decouvrir"}
              aria-label="Aller à la page Nous Découvrir"
              className="transition-all duration-300 hover:text-primary"
            >
              Nous découvrir
            </Link>
            <Link
              href={"/concerts"}
              aria-label="Aller à la page Nos Concerts"
              className="transition-all duration-300 hover:text-primary"
            >
              Nos concerts
            </Link>
            <Link
              href={"/contact"}
              aria-label="Aller à la page Contact"
              className="transition-all duration-300 hover:text-primary"
            >
              Contact
            </Link>
          </nav>

          {/* Contact Information */}
          <address
            className="flex flex-col items-start text-white text-[14px] select-none gap-4 not-italic"
            aria-labelledby="footer-contact"
          >
            <h3 id="footer-contact" className="font-bold uppercase text-[16px]">
              Contact
            </h3>
            <div className="flex justify-between items-center gap-4">
              <IoLocationOutline size={20} aria-hidden="true" />
              <p>
                3 Rue Clémenceau,
                <br />
                67700 SAVERNE, France
              </p>
            </div>

            <div className="flex justify-between items-center gap-4">
              <CiMail size={20} aria-hidden="true" />
              <a
                href="mailto:lebontemperament@gmail.com"
                aria-label="Envoyer un email à Le Bon Tempérament"
                className="hover:text-primary transition-colors"
              >
                lebontemperament@gmail.com
              </a>
            </div>

            <div className="flex justify-between items-center gap-4">
              <FiPhone size={20} aria-hidden="true" />
              <a
                href="tel:+33952395789"
                aria-label="Appeler Le Bon Tempérament"
                className="hover:text-primary transition-colors"
              >
                (+33) 09 52 39 57 89
              </a>
            </div>
          </address>

          {/* Social Media Links */}
          <nav
            className="flex flex-col items-start text-white text-[14px] select-none gap-4"
            aria-labelledby="footer-social"
          >
            <h3 id="footer-social" className="font-bold uppercase text-[16px]">
              Nos réseaux
            </h3>
            <div className="flex justify-between items-center gap-4">
              <a
                href="https://www.facebook.com/p/Le-Bon-Temp%C3%A9rament-100063069588507/"
                aria-label="Accéder à la page Facebook de Le Bon Tempérament"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors"
              >
                <FaFacebookF size={20} aria-hidden="true" />
              </a>
              <a
                href="https://www.instagram.com/lebontemperament_?igsh=bm1ndG4xNXpnZmI5"
                aria-label="Accéder à la page Instagram de Le Bon Tempérament"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors"
              >
                <FaInstagram size={20} aria-hidden="true" />
              </a>
              <a
                href="https://www.youtube.com/@lebontemperament"
                aria-label="Accéder à la chaîne YouTube de Le Bon Tempérament"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors"
              >
                <FaYoutube size={20} aria-hidden="true" />
              </a>
              <a
                href="https://www.tiktok.com/@lebontemperament"
                aria-label="Accéder à la page TikTok de Le Bon Tempérament"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors"
              >
                <FaTiktok size={20} aria-hidden="true" />
              </a>
            </div>
          </nav>
        </div>
      </div>
      <hr className="opacity-10" />
      <div className="flex justify-center items-center py-4 text-[#c8c8c894] flex-col lg:flex-row text-center">
        <p>
          © {new Date().getFullYear()} Tous droits réservés - Le Bon
          Tempérament
        </p>
        <span className="hidden lg:block">&nbsp;|&nbsp;</span>
        <Link
          href={"/politique-de-confidentialite"}
          className="underline hover:text-white transition-colors"
          aria-label="Lire la politique de confidentialité"
        >
          Politique de Confidentialité
        </Link>
      </div>
    </footer>
  );
};

export default Footer;
