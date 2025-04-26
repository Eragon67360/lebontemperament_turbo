import CloudinaryImage from "@/components/CloudinaryImage";
import PdfList from "@/components/PdfList";
import { RoundedSize } from "@/utils/types";
import Link from "next/link";
import { FaRegFilePdf } from "react-icons/fa6";
import { FcVlc } from "react-icons/fc";
import { IoIosArrowRoundForward } from "react-icons/io";
import { MdOpenInNew } from "react-icons/md";

const Administration = () => {
  return (
    <>
      <div className="mx-8 max-w-[1440px] w-full flex flex-col">
        <div id="archives" className="py-8">
          <h1 className="text-title text-primary/50 font-light leading-none">
            Les
          </h1>
          <h2 className="text-title text-[#333] font-bold leading-none">
            Archives
          </h2>
          <hr className="my-8" />

          <h2 className="text-xl md:text-2xl lg:text-3xl text-primary font-light leading-none">
            Comptes-rendus CA
          </h2>
          <div className="flex flex-col gap-8">
            <PdfList jsonFileName="pdf_filesCA" context={"CA"} />
            <div className="flex">
              <Link
                href={
                  "https://drive.google.com/drive/folders/0B3HMykcVQJAVdmw2aTdyQUJyWUE?resourcekey=0-eSCStZ_H5-WvEpmFYk8sdQ"
                }
                target="_blank"
                rel="noopener"
                className="bg-white text-black rounded-lg border border-primary p-2 lg:p-4 flex gap-2 items-center hover:bg-primary hover:border-primary hover:text-white transition"
              >
                <span className="uppercase text-xs tracking-[2.4px]">
                  Voir toutes les archives des CA
                </span>
                <MdOpenInNew className=" scale-110" />
              </Link>
            </div>
          </div>
          <h2 className="mt-8 text-xl md:text-2xl lg:text-3xl text-primary font-light leading-none">
            Comptes-rendus AG
          </h2>
          <div className="flex flex-col gap-8">
            <PdfList jsonFileName="pdf_filesAG" context={"AG"} />
            <div className="flex">
              <Link
                href={
                  "https://drive.google.com/drive/folders/0B3HMykcVQJAVUGE3SllOZlRDMFk?resourcekey=0-KWWoenv1O_uTnu0GNE1t2Q"
                }
                target="_blank"
                rel="noopener"
                className="bg-white text-black rounded-lg border border-primary p-2 lg:p-4 flex gap-2 items-center hover:bg-primary hover:border-primary hover:text-white transition"
              >
                <span className="uppercase text-xs tracking-[2.4px]">
                  Voir toutes les archives des AG
                </span>
                <MdOpenInNew className=" scale-110" />
              </Link>
            </div>
          </div>
          <h2 className="mt-8 text-xl md:text-2xl lg:text-3xl text-primary font-light leading-none">
            Des gazettes...
          </h2>
          <div className="flex flex-col gap-8">
            <PdfList jsonFileName="pdf_filesGazettes" context={"Gazettes"} />
          </div>
          <h2 className="mt-8 text-xl md:text-2xl lg:text-3xl text-primary font-light leading-none">
            ...et des Pêle-Mêle
          </h2>
          <div className="flex flex-col gap-8">
            <PdfList jsonFileName="pdf_filesPM" context={"PM"} />
            <div className="flex">
              <Link
                href={
                  "https://drive.google.com/drive/folders/0B3HMykcVQJAVcG9Nd1JRa19tM3c?resourcekey=0-kSko9ElajKHa981AXkCz8Q"
                }
                target="_blank"
                rel="noopener"
                className="bg-white text-black rounded-lg border border-primary p-2 lg:p-4 flex gap-2 items-center hover:bg-primary hover:border-primary hover:text-white transition"
              >
                <span className="uppercase text-xs tracking-[2.4px]">
                  Voir toutes les archives des gazettes
                </span>
                <MdOpenInNew className=" scale-110" />
              </Link>
            </div>
          </div>
        </div>

        <div id="reglement" className="my-8">
          <h1 className="text-title text-primary/50 font-light leading-none">
            Notre
          </h1>
          <h2 className="text-title text-[#333] font-bold leading-none">
            Règlement
          </h2>
          <hr className="my-8" />
          <div className="flex flex-col lg:flex-row justify-between items-end gap-2">
            <h2 className="font-bold text-base md:text-lg lg:text-xl">
              Veuillez trouver ci-dessous un extrait de notre règlement
              intérieur:
            </h2>
            <Link
              href={"/pdf/reglement.pdf"}
              target="_blank"
              rel="noopener"
              className="justify-start p-2 md:p-4 lg:p-5 bg-white text-[#333] border border-[#333]  hover:bg-[#333] hover:text-[#F2F2F2] transition-all flex items-center space-x-[18px]"
            >
              <span className="uppercase text-xs tracking-[2.4px]">
                Consulter l&apos;intégralité du règlement intérieur
              </span>
              <IoIosArrowRoundForward className=" scale-110" />
            </Link>
          </div>

          <div className="mt-8 flex flex-col p-4 md:p-8 lg:p-12 gap-4 border border-primary rounded-lg italic">
            <p>
              [...] Le Bon Tempérament répète un dimanche par mois et part en
              tournée dix jours en été. Les répétitions de pupitres, hommes et
              femmes, ont lieu tous les 15 jours. [...]
            </p>
            <h2 className="text-base md:text-lg lg:text-xl font-semibold">
              Commission de solidarité
            </h2>
            <p className="mx-8">
              Une commission de solidarité est mise en place. Le fonds de
              solidarité est alimenté par des dons et par le produit de
              certaines manifestations auxquelles l&apos;association participe.
              L&apos;affectation des sommes est décidée par le conseil
              d&apos;Administration.
              <br />
              Les personnes en difficulté financière doivent s&apos;adresser à
              cette commission dès lors qu&apos;elles se rendent compte
              qu&apos;elles ne pourront pas financer leur participation aux
              activités de l&apos;association dans les délais requis.
            </p>
            <h2 className="text-base md:text-lg lg:text-xl font-semibold">
              Modalités de participation financière des membres aux activités
            </h2>
            <div className="mx-8">
              [...] Les cotisations valent d&apos;une assemblée générale à
              l&apos;autre. Le paiement de la cotisation avant la prochaine
              assemblée ou au plus tard au début de l&apos;assemblée [...] .
              <br />
              Le montant de la cotisation pour l&apos;année en cours, est de :
              <br />
              <ul className="list-disc mx-8">
                <li>Tarif normal : 12€</li>
                <li>
                  Tarif réduit : 8€ personnes scolarisées de l&apos;école
                  primaire à l&apos;université ou en recherche d&apos;emploi au
                  1er janvier
                </li>
                <li>5€ : enfants scolarisés à l&apos;école maternelle</li>
              </ul>
            </div>
            <h2 className="text-base md:text-lg lg:text-xl font-semibold">
              Séjours d&apos;été
            </h2>
            <p className="mx-8">
              Pour couvrir les frais de participation aux activités de
              l&apos;association (partitions, matériel divers, etc.) il est
              demandé aux membres en plus de la cotisation:
              <br />
              <strong>28€</strong> : choristes et instrumentistes adultes (le
              chef de choeur est exempté)
              <br />
              <strong>8€</strong> : personnes scolarisées du collège à
              l&apos;université ou en recherche d&apos;emploi au 1er janvier
            </p>
            <h2 className="text-base md:text-lg lg:text-xl font-semibold">
              Tenue de concert
            </h2>
            <p className="mx-8">
              Des arrhes fixées à 50€ par famille, sont demandées avant le début
              du séjour, afin de pouvoir payer la réservation des locaux. […]
            </p>
            <h2 className="text-base md:text-lg lg:text-xl font-semibold">
              Commission de solidarité
            </h2>
            <p className="mx-8">
              La tenue des choristes de tous les chœurs et celle des
              instrumentistes est composée de vêtements corrects blancs et/ou
              noirs. Pour le chœur des adultes, cette tenue est agrémentée
              d&apos;un accessoire vert, fourni si nécessaire par Corinne.
              <br />
              Des chaussures présentables sont requises. Une chemise cartonnée
              noire, pour mettre les partitions durant les concerts, est fournie
              par Jean-Pierre. Afin d&apos;en prolonger la durée de vie, cette
              chemise doit être utilisée exclusivement lors des concerts.
            </p>
          </div>
          <div className="flex flex-col lg:flex-row justify-between items-end mt-8 gap-2">
            <h2 className="font-bold text-base md:text-lg lg:text-xl">
              Veuillez trouver ci-contre la charte sur les séjours BT:
            </h2>
            <Link
              href={"/pdf/charte_BT.pdf"}
              target="_blank"
              rel="noopener"
              className="justify-start p-2 md:p-4 lg:p-5 bg-white text-[#333] border border-[#333]  hover:bg-[#333] hover:text-[#F2F2F2] transition-all flex items-center space-x-[18px]"
            >
              <span className="uppercase text-xs tracking-[2.4px]">
                Consulter l&apos;intégralité de la charte sur les séjours BT
              </span>
              <IoIosArrowRoundForward className=" scale-110" />
            </Link>
          </div>
          <div className="flex flex-col lg:flex-row justify-between items-end mt-8 gap-2">
            <h2 className="font-bold text-base md:text-lg lg:text-xl">
              Veuillez trouver ci-contre les statuts du &quot;Bon
              Tempérament&quot;:
            </h2>
            <Link
              href={"/pdf/Statuts_Le_Bon_Tempérament.pdf"}
              target="_blank"
              rel="noopener"
              className="justify-start p-2 md:p-4 lg:p-5 bg-white text-[#333] border border-[#333]  hover:bg-[#333] hover:text-[#F2F2F2] transition-all flex items-center space-x-[18px]"
            >
              <span className="uppercase text-xs tracking-[2.4px]">
                Consulter l&apos;intégralité des statuts de l&apos;association
              </span>
              <IoIosArrowRoundForward className=" scale-110" />
            </Link>
          </div>
        </div>
        <div id="logiciels" className="my-8">
          <h1 className="text-title text-primary/50 font-light leading-none">
            Logiciels
          </h1>
          <h2 className="text-title text-[#333] font-bold leading-none">
            Utiles
          </h2>
          <hr className="my-8" />
          <h2 className="text-base md:text-lg lg:text-xl">
            Vous trouverez ici toutes sortes d&apos;aides virtuelles aussi bien
            pour écouter, consulter ou modifier de la musique ... mais aussi
            tout logiciel pratique dans la vie BT&apos;sienne !
          </h2>
          <div className="flex flex-col mt-8 gap-6">
            <h2 className="font-bold uppercase text-xl md:text-2xl lg:text-3xl text-[#333]">
              Écouter
            </h2>
            <hr className="border-b-2 border-b-primary/50" />
            <div className="flex flex-wrap justify-evenly gap-4">
              <Link
                href={
                  "https://www.01net.com/telecharger/multimedia/lecteurs_video_dvd/vlc-media-player.html"
                }
                target="_blank"
                rel="noopener"
                className="flex flex-col gap-2 items-center hover:opacity-60"
              >
                <FcVlc size={80} />
                <p className="text-primary font-semibold text-sm md:text-base lg:text-lg">
                  VLC
                </p>
              </Link>
              <Link
                href={"https://www.apple.com/fr/itunes/"}
                target="_blank"
                rel="noopener"
                className="flex flex-col gap-2 items-center hover:opacity-60"
              >
                <CloudinaryImage
                  src={"Site/membres/logos/itunes"}
                  alt="logo iTunes"
                  width={80}
                  height={80}
                  rounded={RoundedSize.NONE}
                />
                <p className="text-primary font-semibold text-sm md:text-base lg:text-lg">
                  iTunes (pour PC)
                </p>
              </Link>
              <Link
                href={
                  "https://www.01net.com/telecharger/multimedia/lecteurs_video_dvd/vlc-media-player.html"
                }
                target="_blank"
                rel="noopener"
                className="flex flex-col gap-2 items-center hover:opacity-60"
              >
                <CloudinaryImage
                  src={"Site/membres/logos/wmp"}
                  alt="logo Windows Media Player"
                  width={80}
                  height={80}
                  rounded={RoundedSize.NONE}
                />
                <p className="text-primary font-semibold text-sm md:text-base lg:text-lg">
                  Windows Media Player
                </p>
              </Link>
            </div>
          </div>
          <div className="flex flex-col mt-8 gap-6">
            <h2 className="font-bold uppercase text-xl md:text-2xl lg:text-3xl text-[#333]">
              Consulter
            </h2>
            <hr className="border-b-2 border-b-primary/50" />
            <div className="flex justify-evenly">
              <Link
                href={"https://www.openoffice.org/"}
                target="_blank"
                rel="noopener"
                className="flex flex-col gap-2 items-center hover:opacity-60"
              >
                <CloudinaryImage
                  src={"Site/membres/logos/openoffice"}
                  alt="logo OpenOffice"
                  width={80}
                  height={80}
                  rounded={RoundedSize.NONE}
                />
                <p className="text-primary font-semibold text-sm md:text-base lg:text-lg">
                  OpenOffice (pour PC)
                </p>
              </Link>
              <Link
                href={"https://get.adobe.com/fr/reader/"}
                target="_blank"
                rel="noopener"
                className="flex flex-col gap-2 items-center hover:opacity-60"
              >
                <FaRegFilePdf size={80} />
                <p className="text-primary font-semibold text-sm md:text-base lg:text-lg">
                  PDF (pour PC)
                </p>
              </Link>
            </div>
          </div>
          <div className="flex flex-col mt-8 gap-6">
            <h2 className="font-bold uppercase text-xl md:text-2xl lg:text-3xl text-[#333]">
              Modifier
            </h2>
            <hr className="border-b-2 border-b-primary/50" />
            <div className="flex justify-evenly">
              <Link
                href={"https://musescore.org/fr"}
                target="_blank"
                rel="noopener"
                className="flex flex-col gap-2 items-center hover:opacity-60"
              >
                <CloudinaryImage
                  src={"Site/membres/logos/musescore"}
                  alt="logo Musescore"
                  width={80}
                  height={80}
                  rounded={RoundedSize.NONE}
                />
                <p className="text-primary font-semibold text-sm md:text-base lg:text-lg">
                  Musescore
                </p>
              </Link>
              <Link
                href={"https://www.audacityteam.org/"}
                target="_blank"
                rel="noopener"
                className="flex flex-col gap-2 items-center hover:opacity-60"
              >
                <CloudinaryImage
                  src={"Site/membres/logos/audacity"}
                  alt="logo Audacity"
                  width={80}
                  height={80}
                  rounded={RoundedSize.NONE}
                />
                <p className="text-primary font-semibold text-sm md:text-base lg:text-lg">
                  Audacity
                </p>
              </Link>
            </div>
          </div>
          <hr className="my-8 border-b-2 border-b-primary/50" />
          <div className="flex flex-col gap-4">
            <h3 className="font-semibold text-base md:text-lg lg:text-xl text-center">
              Petits trucs et astuces
            </h3>
            <p className="text-xs md:text-sm lg:text-base">
              Comme vous le savez peut-être, Windows Media Player permet de
              modifier la vitesse de lecture d&apos;un enregistrement sans
              modifier la tessiture.
              <br />
              C&apos;est très utile si vous utilisez, par exemple pour
              l&apos;apprentissage d&apos;un nouveau morceau, un enregistrement
              interprété par des pro dans un tempo très rapide (Vents hardis...)
              <br />
              Si vous réécoutez l&apos;enregistrement avec Média Player, faire
              un clic de droite sur l&apos;écran et aller sur
              &quot;Améliorations&quot;, puis clic de gauche sur
              &quot;Paramètres de vitesse de lecture&quot;. Vous pouvez alors
              déplacer le curseur pour ralentir (ou accélérer) l&apos;écoute du
              morceau.
            </p>
          </div>
          <div className="h-16"></div>
        </div>
      </div>
    </>
  );
};
export default Administration;
