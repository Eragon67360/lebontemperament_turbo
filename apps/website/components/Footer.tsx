"use client";
import React from "react";
import Link from "next/link";
import { IoLocationOutline } from "react-icons/io5";
import { FiPhone } from "react-icons/fi";
import { CiMail } from "react-icons/ci";
import { FaFacebookF } from "react-icons/fa";
import { FaInstagram } from "react-icons/fa";
import { CldImage } from "next-cloudinary";
import { usePathname } from "next/navigation";

const Footer = () => {
  const path = usePathname();
  if (path.startsWith("/membres")) {
    return <></>;
  }
  return (
    <>
      <div className="w-full bg-[#2C2C2C] flex flex-col select-none justify-center ">
        <div className="h-full mx-8 max-w-[1920px] flex flex-col lg:flex-row justify-evenly py-12 items-center lg:items-start gap-4">
          <CldImage
            src={"Site/logo_nega"}
            alt="Logo BT"
            width={190}
            height={190}
          />

          <div className="flex flex-col xl:flex-row gap-8">
            <div className="flex flex-col items-start text-white text-[14px] select-none gap-4">
              <h3 className="font-bold uppercase text-[16px]">Naviguer</h3>
              <Link
                href={"/"}
                aria-label="Aller à l'accueil"
                className="transition-all duration-300"
              >
                Accueil
              </Link>
              <Link
                href={"/galerie"}
                aria-label="Aller à la galerie"
                className="transition-all duration-300"
              >
                Galerie
              </Link>
              <Link
                href={"/decouvrir"}
                aria-label="Aller à la page Nous Découvrir"
                className="transition-all duration-300"
              >
                Nous découvrir
              </Link>
              <Link
                href={"/concerts"}
                aria-label="Aller à la page Nos Concerts"
                className="transition-all duration-300"
              >
                Nos concerts
              </Link>
              <Link
                href={"/contact"}
                aria-label="Aller à la page Contact"
                className=" transition-all duration-300"
              >
                Contact
              </Link>
            </div>

            <div className="flex flex-col items-start text-white text-[14px] select-none gap-4">
              <h3 className="font-bold uppercase text-[16px]">Contact</h3>
              <div className="flex justify-between items-center gap-4">
                <IoLocationOutline size={20} />
                <p>
                  3 Rue Clémenceau,
                  <br />
                  67700 SAVERNE, France
                </p>
              </div>

              <div className="flex justify-between items-center gap-4">
                <CiMail size={20} />
                <a
                  href="mailto:lebontemperament@gmail.com"
                  aria-label="Envoyer mail au bon tempérament"
                >
                  lebontemperament@gmail.com
                </a>
              </div>

              <div className="flex justify-between items-center gap-4">
                <FiPhone size={20} />
                <a
                  href="tel:+33952395789"
                  aria-label="Appel au bon tempérament"
                >
                  (+33) 09 52 39 57 89
                </a>
              </div>
            </div>

            <div className="flex flex-col items-start text-white text-[14px] select-none gap-4">
              <h3 className="font-bold uppercase text-[16px]">Nos réseaux</h3>
              <div className="flex justify-between items-center gap-4">
                <a
                  href="https://www.facebook.com/p/Le-Bon-Temp%C3%A9rament-100063069588507/"
                  aria-label="Facebook"
                  target="_blank"
                  rel="noreferrer"
                >
                  <FaFacebookF size={20} />
                </a>
                <a
                  href="https://www.instagram.com/lebontemperament_?igsh=bm1ndG4xNXpnZmI5"
                  aria-label="Accéder à la page Instagram"
                  target="_blank"
                  rel="noreferrer"
                >
                  <FaInstagram size={20} />
                </a>
              </div>
            </div>
          </div>
        </div>
        <hr className="opacity-10" />
        <div className="flex justify-center items-center py-4 text-[#c8c8c894] flex-col lg:flex-row text-center">
          © {new Date().getFullYear()} Tous droits réservés - Le Bon
          Tempérament
          <span className="hidden lg:block">&nbsp;|&nbsp;</span>
          <Link href={"/politique-de-confidentialite"} className="underline">
            Politique de Confidentialité
          </Link>
        </div>
      </div>
    </>
  );
};

export default Footer;
