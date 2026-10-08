import CookiePreferencesButton from "@/components/cookies/CookiePreferencesButton";
import { PRIVACY_CONTACT_EMAIL } from "@/lib/contact";
import { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Draft for the board's review (#348). Every statement describes what the
 * code does; the facts the board must confirm are listed in the PR.
 *
 * TODO(owner): set the date to the day the board approves the text, and bump
 * the version on every later change.
 */
const POLICY_VERSION = "2.4";
const POLICY_UPDATED_ON = "8 octobre 2026";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description:
    "Politique de confidentialité du site du Bon Tempérament : données collectées, cookies, durée de conservation et vos droits.",
  keywords:
    "Le Bon Tempérament,  Ensemble vocal et instrumental Alsace,  Concerts de musique classique,  Tournées musicales annuelles,  Répétitions musicales conviviales,  Communauté musicale engagée,  Passion pour la musique,  Histoire musicale depuis 1987",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/politique-de-confidentialite`,
    siteName: "Le Bon Tempérament",
    images: [
      {
        url: "https://res.cloudinary.com/dlt2j3dld/image/upload/v1716454520/Site/og/concerts-og.png",
        width: 1200,
        height: 630,
        alt: "Le Bon Tempérament",
      },
    ],
  },
  alternates: {
    canonical: "/politique-de-confidentialite",
  },
};

const h2Class = "text-primary-text mb-6 text-lg font-semibold xl:text-2xl";
const h3Class =
  "text-primary-text mt-6 mb-4 text-base font-semibold xl:text-xl";
const pClass = "text-foreground mb-4";
const ulClass = "text-foreground mb-4 list-disc pl-5";
const linkClass = "text-primary-text hover:text-primary-text/80 underline";

const SECTIONS = [
  { id: "responsable", title: "Qui est responsable de vos données ?" },
  { id: "visiteurs", title: "Visite du site et cookies" },
  { id: "formulaires", title: "Formulaires et lettre d’information" },
  { id: "membres", title: "Membres de l’association" },
  { id: "application-mobile", title: "Application mobile" },
  { id: "livraisons", title: "Tournées de livraison" },
  { id: "dons", title: "Dons" },
  { id: "images", title: "Photos, vidéos et enregistrements" },
  { id: "prestataires", title: "Destinataires et prestataires" },
  { id: "transferts", title: "Transferts hors de l’Union européenne" },
  { id: "conservation", title: "Durées de conservation" },
  { id: "droits", title: "Vos droits" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

function Section({
  id,
  last = false,
  children,
}: {
  id: SectionId;
  last?: boolean;
  children: ReactNode;
}) {
  const title = SECTIONS.find((section) => section.id === id)?.title;
  return (
    <section
      id={id}
      aria-labelledby={`${id}-titre`}
      className={
        last ? "scroll-mt-24" : "border-separator scroll-mt-24 border-b pb-8"
      }
    >
      <h2 id={`${id}-titre`} className={h2Class}>
        {title}
      </h2>
      {children}
    </section>
  );
}

/** One processing: what, why, on which legal basis, how long, who. */
function Processing({
  title,
  facts,
}: {
  title: string;
  facts: [label: string, value: ReactNode][];
}) {
  return (
    <>
      <h3 className={h3Class}>{title}</h3>
      <ul className={ulClass}>
        {facts.map(([label, value]) => (
          <li key={label} className="mb-2">
            <strong>{label}</strong> : {value}
          </li>
        ))}
      </ul>
    </>
  );
}

const PrivacyMail = () => (
  <a href={`mailto:${PRIVACY_CONTACT_EMAIL}`} className={linkClass}>
    {PRIVACY_CONTACT_EMAIL}
  </a>
);

const DPF_AND_SCC =
  "cadre de protection des données UE–États-Unis et clauses contractuelles types";

const PROCESSORS: { name: string; role: string; safeguard: string }[] = [
  {
    name: "Vercel Inc. (États-Unis)",
    role: "hébergement du site et de l’espace membres, journaux techniques, mesure d’audience Vercel Web Analytics et Speed Insights",
    safeguard: DPF_AND_SCC,
  },
  {
    name: "Supabase Pte. Ltd. (Singapour)",
    role: "base de données, comptes, photos de profil et fonctions serveur ; données stockées à Paris (France)",
    safeguard:
      "clauses contractuelles types pour les accès depuis l’extérieur de l’Union européenne",
  },
  {
    name: "Google (Google Ireland Limited, Irlande, et Google LLC, États-Unis)",
    role: "messagerie Gmail de l’association, Google Groupes (lettre d’information), Google Drive, Google Agenda, Google Sheets, connexion avec Google, Google Analytics, notifications Firebase Cloud Messaging, polices de l’application",
    safeguard: DPF_AND_SCC,
  },
  {
    name: "Cloudinary (Israël et États-Unis)",
    role: "hébergement et diffusion des images, vidéos, sons et documents du site",
    safeguard:
      "décision d’adéquation de la Commission européenne pour Israël et cadre de protection des données UE–États-Unis",
  },
  {
    name: "Twilio (Twilio Ireland Limited, Irlande, et Twilio Inc., États-Unis)",
    role: "envoi des SMS des tournées de livraison",
    safeguard:
      "cadre de protection des données UE–États-Unis, règles d’entreprise contraignantes et clauses contractuelles types",
  },
  {
    name: "Mapbox, Inc. (États-Unis)",
    role: "fond de carte de la page de suivi des livraisons",
    safeguard: DPF_AND_SCC,
  },
  {
    name: "FOSSGIS e.V. (Allemagne)",
    role: "calcul des itinéraires et des temps de trajet des tournées (serveur OSRM)",
    safeguard: "aucun transfert hors de l’Union européenne",
  },
  {
    name: "Apple (Apple Distribution International, Irlande) ou Google, selon le téléphone du conducteur",
    role: "conversion des adresses de livraison en positions sur la carte",
    safeguard:
      "clauses contractuelles types (Apple) ; " + DPF_AND_SCC + " (Google)",
  },
  {
    name: "OpenAI (États-Unis)",
    role: "lecture automatique des événements de l’agenda des répétitions",
    safeguard: DPF_AND_SCC,
  },
  {
    name: "Stripe (Stripe Payments Europe, Irlande, et Stripe, Inc., États-Unis)",
    role: "paiement des dons faits auparavant sur notre site",
    safeguard: DPF_AND_SCC,
  },
];

const RETENTION: [what: string, howLong: string][] = [
  [
    "Journaux techniques de l’hébergeur",
    "d’une heure à 30 jours selon l’offre de l’hébergeur",
  ],
  ["Choix sur les cookies (cookie cc_cookie)", "6 mois"],
  [
    "Statistiques Google Analytics",
    "14 mois au plus ; cookies _ga : 2 ans au plus",
  ],
  [
    "Messages des formulaires de contact et de l’application",
    "3 ans au plus après le dernier échange",
  ],
  ["Abonnement à la lettre d’information", "jusqu’à votre désinscription"],
  [
    "Souvenirs de l’anniversaire",
    "adresse e-mail effacée après la relecture ; souvenir publié conservé dans les archives de l’association jusqu’à votre demande de retrait",
  ],
  [
    "Compte et profil de membre",
    "pendant l’adhésion, puis 1 an au plus après sa fin",
  ],
  [
    "Signalements de problèmes (tableau de bord et application), captures d’écran comprises",
    "1 an au plus après leur résolution",
  ],
  ["Journaux des synchronisations (agenda, Google Drive)", "90 jours"],
  [
    "Données des destinataires d’une livraison",
    "supprimées 30 jours après la tournée",
  ],
  [
    "Identifiant de notification du téléphone qui suit une livraison dans l’application",
    "effacé le lendemain de la tournée, quand le lien de suivi expire",
  ],
  ["Empreinte de l’adresse IP des essais de code infructueux", "24 heures"],
  ["Position du conducteur", "effacée à la fin de la tournée"],
  [
    "Reçus fiscaux des dons payés par Stripe",
    "6 ans à compter de l’émission du reçu",
  ],
  [
    "Photos, vidéos et enregistrements",
    "archives de l’association, retirés sur demande",
  ],
];

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-primary/90 mb-4 text-2xl font-bold xl:text-4xl">
          Politique de confidentialité
        </h1>
        <p className="text-muted mb-12">
          Version {POLICY_VERSION} — dernière mise à jour : {POLICY_UPDATED_ON}
        </p>

        <div className="space-y-8">
          <div className="border-separator border-b pb-8">
            <p className={pClass}>
              Cette politique explique quelles données personnelles Le Bon
              Tempérament traite sur son site www.lebontemperament.com, dans
              l’espace membres, dans l’application mobile Le Bon Tempérament et
              lors de ses tournées de livraison : pourquoi, sur quelle base
              légale, pendant combien de temps, avec quels prestataires, et
              comment exercer vos droits.
            </p>
            <p className={pClass}>
              L’association ne vend ni ne loue aucune donnée, n’affiche aucune
              publicité et ne fait aucun profilage. Aucune décision vous
              concernant n’est prise sur le seul fondement d’un traitement
              automatisé.
            </p>
            <nav aria-label="Sommaire de la politique de confidentialité">
              <ol className="text-foreground list-decimal pl-5">
                {SECTIONS.map((section) => (
                  <li key={section.id} className="mb-1">
                    <a href={`#${section.id}`} className={linkClass}>
                      {section.title}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </div>

          <Section id="responsable">
            <p className={pClass}>
              Le responsable des traitements décrits ici est l’association Le
              Bon Tempérament, 3 Rue Clemenceau, 67700 Saverne, France (voir les{" "}
              <Link href="/mentions-legales" className={linkClass}>
                mentions légales
              </Link>
              ).
            </p>
            <p className={pClass}>
              Pour toute question sur vos données ou pour exercer vos droits,
              écrivez-nous à <PrivacyMail /> ou par courrier à l’adresse
              ci-dessus. L’association n’a pas désigné de délégué à la
              protection des données.
            </p>
          </Section>

          <Section id="visiteurs">
            <Processing
              title="Hébergement et journaux techniques"
              facts={[
                [
                  "Données",
                  "adresse IP, date et heure, page demandée, navigateur et système",
                ],
                [
                  "Finalité",
                  "afficher le site, en assurer la sécurité et corriger les erreurs",
                ],
                [
                  "Base légale",
                  "intérêt légitime de l’association à proposer un site fonctionnel et sûr (article 6.1.f du RGPD)",
                ],
                [
                  "Conservation",
                  "journaux conservés par l’hébergeur d’une heure à 30 jours selon son offre",
                ],
                ["Destinataire", "Vercel Inc., hébergeur du site"],
              ]}
            />

            <Processing
              title="Mesure d’audience (avec votre accord)"
              facts={[
                [
                  "Outils",
                  "Google Analytics 4, Vercel Web Analytics et Vercel Speed Insights",
                ],
                [
                  "Données",
                  "pages consultées, site de provenance, type d’appareil et de navigateur, ville ou pays approximatif, temps de chargement ; Google Analytics utilise un identifiant aléatoire enregistré dans les cookies _ga et _ga_* ; les outils de Vercel ne déposent pas de cookie",
                ],
                [
                  "Finalité",
                  "connaître la fréquentation du site et l’améliorer",
                ],
                [
                  "Base légale",
                  "votre consentement (article 6.1.a du RGPD et article 82 de la loi Informatique et Libertés) : ces outils ne sont chargés qu’après votre accord pour la mesure d’audience dans le bandeau cookies, et vous pouvez le retirer à tout moment",
                ],
                [
                  "Conservation",
                  "cookies _ga : 2 ans au plus ; statistiques dans Google Analytics : 14 mois au plus",
                ],
                [
                  "Destinataires",
                  "Google et Vercel, en tant que sous-traitants",
                ],
              ]}
            />

            <h3 className={h3Class}>
              Cookies et stockage dans votre navigateur
            </h3>
            <ul className={ulClass}>
              <li className="mb-2">
                <strong>cc_cookie</strong> (nécessaire) : mémorise vos choix sur
                les cookies, pendant 6&nbsp;mois.
              </li>
              <li className="mb-2">
                <strong>sb-…-auth-token</strong> (nécessaire, membres connectés
                uniquement) : maintient votre session dans l’espace membres tant
                que vous restez connecté.
              </li>
              <li className="mb-2">
                <strong>_ga, _ga_*</strong> (mesure d’audience, avec votre
                accord) : cookies de Google Analytics, 2&nbsp;ans au plus.
              </li>
              <li className="mb-2">
                <strong>Stockage local du navigateur</strong> (nécessaire) :
                thème clair ou sombre, bandeaux déjà fermés, introduction de la
                page anniversaire déjà vue. Ces informations restent sur votre
                appareil et ne nous sont pas transmises.
              </li>
            </ul>
            <p className={pClass}>
              Vous pouvez modifier vos choix à tout moment avec le bouton
              ci-dessous ou le lien « Gérer les cookies » en bas de chaque page.
            </p>
            <div className="mb-4">
              <CookiePreferencesButton className="text-primary hover:text-primary-text/80 cursor-pointer border-none bg-transparent p-0 font-medium text-inherit underline transition-colors">
                Gérer les préférences de cookies
              </CookiePreferencesButton>
            </div>

            <h3 className={h3Class}>Vidéos, carte et autres contenus tiers</h3>
            <p className={pClass}>
              Les vidéos YouTube (lues en mode de confidentialité renforcée,
              youtube-nocookie.com) et Vimeo, ainsi que la carte Google Maps de
              la page Contact, ne sont chargées que lorsque vous cliquez pour
              les afficher. Votre navigateur se connecte alors aux serveurs de
              Google ou de Vimeo, qui reçoivent votre adresse IP et peuvent
              déposer leurs propres cookies, sous leur propre responsabilité. La
              visionneuse de documents des archives de l’anniversaire charge un
              composant depuis unpkg.com, qui reçoit aussi votre adresse IP.
            </p>
            <p className={pClass}>
              Les images, sons et documents du site sont diffusés par
              Cloudinary. Les liens vers nos pages Facebook, Instagram, YouTube
              et TikTok et les boutons de partage n’envoient rien à ces réseaux
              tant que vous ne cliquez pas dessus.
            </p>
          </Section>

          <Section id="formulaires">
            <Processing
              title="Formulaire de contact"
              facts={[
                [
                  "Données",
                  "nom et prénom, adresse e-mail, objet et message ; l’adresse e-mail et le message sont nécessaires pour que nous puissions vous répondre",
                ],
                [
                  "Finalité",
                  "répondre à votre message ; un accusé de réception vous est envoyé par e-mail",
                ],
                [
                  "Base légale",
                  "intérêt légitime de l’association à répondre aux demandes qu’elle reçoit (article 6.1.f du RGPD)",
                ],
                [
                  "Conservation",
                  "le message n’est pas enregistré sur le site : il est envoyé par e-mail à la messagerie de l’association et y est conservé 3 ans au plus après le dernier échange",
                ],
                [
                  "Destinataires",
                  "les membres du bureau qui gèrent la messagerie ; Google (Gmail) et Vercel en tant que sous-traitants",
                ],
              ]}
            />
            <p className={pClass}>
              Les formulaires sont protégés contre les envois automatisés sans
              faire appel à un service tiers de vérification.
            </p>

            <Processing
              title="Contact depuis l’application"
              facts={[
                [
                  "Données",
                  "votre nom, votre adresse e-mail de membre, l’objet et le message",
                ],
                [
                  "Finalité, base légale et conservation",
                  "les mêmes que pour le formulaire de contact",
                ],
              ]}
            />

            <Processing
              title="Lettre d’information"
              facts={[
                ["Données", "adresse e-mail"],
                [
                  "Finalité",
                  "vous envoyer les nouvelles de l’association (concerts, événements) par sa liste de diffusion Google Groupes ; votre adresse nous est transmise par e-mail pour être ajoutée à la liste, et un message de bienvenue vous est envoyé",
                ],
                [
                  "Base légale",
                  "votre consentement (article 6.1.a du RGPD), que vous retirez en vous désinscrivant",
                ],
                [
                  "Conservation",
                  "jusqu’à votre désinscription, par le lien présent en bas de chaque message de la liste ou en nous écrivant",
                ],
                [
                  "Destinataires",
                  "les membres du bureau qui gèrent la liste ; Google (Google Groupes, Gmail) en tant que sous-traitant",
                ],
              ]}
            />

            <Processing
              title="Souvenirs du 40e anniversaire"
              facts={[
                ["Données", "nom, adresse e-mail, année et texte du souvenir"],
                [
                  "Finalité",
                  "recueillir vos souvenirs et, après relecture par l’association, publier le nom, l’année et le texte sur la page anniversaire ; l’adresse e-mail sert uniquement à vous confirmer la réception et n’est pas publiée",
                ],
                [
                  "Base légale",
                  "votre consentement (article 6.1.a du RGPD), que vous pouvez retirer à tout moment",
                ],
                [
                  "Conservation",
                  "l’adresse e-mail est effacée après la relecture ; un souvenir publié reste dans les archives de l’association jusqu’à ce que vous demandiez son retrait",
                ],
                [
                  "Destinataires",
                  "les membres de l’association chargés de la relecture ; Supabase, Google (Gmail) et Vercel en tant que sous-traitants",
                ],
              ]}
            />
          </Section>

          <Section id="membres">
            <Processing
              title="Compte et profil"
              facts={[
                [
                  "Données",
                  "adresse e-mail, nom, mot de passe (enregistré sous une forme protégée que personne ne peut relire), pupitre, rôle dans l’espace membres, photo de profil, adresse postale, téléphones fixe et mobile ; si vous vous connectez avec Google, le nom et la photo de votre compte Google",
                ],
                [
                  "Origine",
                  "vous-même, et le fichier des adhérents tenu par l’association (Google Sheets) lors de la création de votre compte",
                ],
                [
                  "Finalité",
                  "gérer votre adhésion, vous donner accès à l’espace membres et à l’application, organiser la vie de l’association",
                ],
                [
                  "Base légale",
                  "l’exécution de votre adhésion à l’association (article 6.1.b du RGPD)",
                ],
                [
                  "Conservation",
                  "pendant votre adhésion, puis 1 an au plus après sa fin",
                ],
                [
                  "Destinataires",
                  "les administrateurs de l’association ; Supabase, Google et Vercel en tant que sous-traitants",
                ],
              ]}
            />

            <Processing
              title="Annuaire des membres"
              facts={[
                [
                  "Visible par les autres membres connectés, sur le site et dans l’application",
                  "nom, pupitre, adresse e-mail et photo de profil ; jamais vos numéros de téléphone ni votre adresse postale, qui restent réservés aux administrateurs",
                ],
                [
                  "Finalité",
                  "permettre aux membres de se contacter pour les répétitions et la vie de l’ensemble",
                ],
                [
                  "Base légale",
                  "intérêt légitime de l’association (article 6.1.f du RGPD)",
                ],
              ]}
            />

            <Processing
              title="Répétitions, concerts et calendrier"
              facts={[
                [
                  "Fonctionnement",
                  "le calendrier des répétitions est repris de l’agenda Google de l’association ; le titre, la description et le lieu de chaque événement sont lus automatiquement par un service d’OpenAI pour en extraire la date, l’heure et le lieu ; ces événements ne doivent pas contenir de données personnelles",
                ],
                [
                  "Dans votre navigateur",
                  "la page Calendrier de l’espace membres affiche l’agenda Google : votre navigateur se connecte alors à Google",
                ],
                [
                  "Base légale",
                  "intérêt légitime de l’association à organiser ses activités (article 6.1.f du RGPD)",
                ],
              ]}
            />

            <Processing
              title="Documents de travail"
              facts={[
                [
                  "Données",
                  "partitions, enregistrements de travail et documents de l’association, dont les comptes rendus du conseil d’administration, conservés sur le Google Drive de l’association",
                ],
                [
                  "Finalité",
                  "mettre ces documents à la disposition des membres connectés, sur le site et dans l’application",
                ],
                [
                  "Base légale",
                  "l’exécution de votre adhésion (article 6.1.b du RGPD)",
                ],
                [
                  "Destinataire",
                  "Google (Google Drive) en tant que sous-traitant",
                ],
              ]}
            />

            <Processing
              title="Tableau de bord d’administration"
              facts={[
                [
                  "Données",
                  "actions des administrateurs, signalements de problèmes et messages échangés à leur sujet ; fréquentation du tableau de bord mesurée par Vercel Web Analytics, sans cookie",
                ],
                [
                  "Finalité",
                  "administrer l’association et corriger les problèmes signalés",
                ],
                [
                  "Base légale",
                  "intérêt légitime de l’association (article 6.1.f du RGPD)",
                ],
                [
                  "Conservation",
                  "signalements : 1 an au plus après la résolution du problème ; journaux des synchronisations de l’agenda et du Google Drive : 90 jours",
                ],
              ]}
            />
          </Section>

          <Section id="application-mobile">
            <p className={pClass}>
              L’application Le Bon Tempérament présente l’association à tous,
              sans compte : prochains concerts, façon de nous rejoindre, liens
              utiles. Les membres s’y connectent pour consulter les répétitions,
              annonces, documents de travail et l’annuaire, et recevoir des
              notifications, avec le même compte que l’espace membres : les
              traitements décrits plus haut s’y appliquent. Elle ne contient ni
              publicité, ni outil de mesure d’audience, ni outil de suivi des
              plantages.
            </p>
            <ul className={ulClass}>
              <li className="mb-2">
                <strong>Données sur votre appareil</strong> : copie des
                annonces, événements, concerts, répétitions et de votre profil
                pour un accès hors ligne, effacée à la déconnexion ; préférences
                (thème, réglages des notifications), effacées à la
                désinstallation.
              </li>
              <li className="mb-2">
                <strong>Notifications</strong> : les annonces de répétitions,
                d’événements et de concerts sont envoyées à tous les membres par
                Firebase Cloud Messaging (Google). Pour vous envoyer les
                réponses à vos signalements, l’application enregistre avec votre
                compte l’identifiant de notification de votre téléphone, effacé
                lorsque vous vous déconnectez ou qu’il n’est plus valide. Les
                rappels sont programmés sur votre appareil. Vous pouvez
                désactiver les notifications dans l’application ou dans les
                réglages du téléphone.
              </li>
              <li className="mb-2">
                <strong>Annonces de concerts sans compte</strong> : si le
                réglage « Prochains concerts » de la page « À propos » est
                activé (il l’est par défaut), votre téléphone s’abonne aux
                annonces de concerts de Firebase Cloud Messaging (Google) et
                reçoit l’annonce de chaque concert et un rappel deux jours
                avant. Nous n’enregistrons rien sur vous ni sur votre téléphone
                ; désactivez le réglage pour vous désabonner.
              </li>
              <li className="mb-2">
                <strong>Signalements</strong> : vous pouvez nous signaler un
                problème depuis l’application, avec jusqu’à trois captures
                d’écran. Le message, les captures et la version de l’application
                et du système de votre téléphone sont lus par les responsables
                de l’application, qui vous répondent dans l’application, et
                conservés 1&nbsp;an au plus après la résolution du problème.
              </li>
              <li className="mb-2">
                <strong>Localisation</strong> : demandée uniquement aux
                conducteurs pendant une tournée de livraison (voir plus bas), y
                compris lorsque l’application est en arrière-plan, avec une
                notification permanente sur Android.
              </li>
              <li className="mb-2">
                <strong>Polices de caractères</strong> : l’application peut les
                télécharger depuis les serveurs de Google, qui reçoivent alors
                l’adresse IP de votre appareil.
              </li>
              <li className="mb-2">
                <strong>Suppression du compte</strong> : le bouton « Supprimer
                le compte » de l’application nous envoie une demande par e-mail
                ; vous pouvez aussi écrire à <PrivacyMail />. Nous supprimons le
                compte et le profil dans un délai d’un mois.
              </li>
            </ul>
          </Section>

          <Section id="livraisons">
            <p className={pClass}>
              Lors de ses tournées de livraison, l’association prévient les
              destinataires par SMS et leur permet de suivre l’arrivée du
              livreur grâce à un lien personnel. Le SMS porte aussi un code
              personnel, qui permet de suivre la livraison dans l’application Le
              Bon Tempérament sans créer de compte.
            </p>
            <Processing
              title="Destinataires des livraisons"
              facts={[
                [
                  "Données",
                  "nom, adresse postale, numéro de téléphone, position de l’adresse sur la carte, créneau et heure de livraison, lien de suivi et code personnels",
                ],
                [
                  "Finalité",
                  "organiser la tournée (ordre de passage, itinéraire, heure d’arrivée estimée) et vous envoyer des SMS : départ de la tournée avec votre lien de suivi et votre code, arrivée imminente, livraison effectuée",
                ],
                [
                  "Base légale",
                  "l’exécution de la livraison convenue avec vous (article 6.1.b du RGPD)",
                ],
                [
                  "Conservation",
                  "vos données sont supprimées 30 jours après la tournée ; le lien de suivi expire de lui-même (24 heures par défaut)",
                ],
                [
                  "Destinataires",
                  "les conducteurs et administrateurs de l’association chargés de la tournée ; Supabase, Twilio (SMS), FOSSGIS (calcul des itinéraires), Mapbox (carte) et le service de localisation d’adresses du téléphone du conducteur (Apple ou Google) en tant que sous-traitants",
                ],
              ]}
            />
            <p className={pClass}>
              La page de suivi n’est pas indexée par les moteurs de recherche.
              Elle affiche votre nom, votre créneau, l’heure d’arrivée estimée
              et, uniquement quand c’est votre tour, la position du livreur.
              Lorsque vous l’ouvrez, Mapbox reçoit votre adresse IP pour
              afficher la carte, et les positions du livreur et de votre adresse
              sont envoyées au serveur d’itinéraires de FOSSGIS pour tracer le
              trajet.
            </p>

            <Processing
              title="Suivi de la livraison dans l’application"
              facts={[
                [
                  "Fonctionnement",
                  "le code personnel du SMS, saisi dans l’application (ou le lien du SMS touché avec l’application installée), relie votre téléphone à cette livraison, sans aucun compte",
                ],
                [
                  "Données",
                  "l’identifiant de notification de votre téléphone (Firebase Cloud Messaging), enregistré avec la livraison ; pour limiter les essais de codes au hasard, une empreinte (hachage) de l’adresse IP de chaque essai infructueux, dont l’adresse elle-même ne peut pas être retrouvée",
                ],
                [
                  "Finalité",
                  "vous envoyer les notifications du jour de la livraison : départ de la tournée, votre tour qui approche, arrivée dans quelques minutes, livraison effectuée ; protéger les livraisons contre la recherche de codes",
                ],
                [
                  "Base légale",
                  "l’exécution de la livraison convenue avec vous (article 6.1.b du RGPD) pour les notifications ; l’intérêt légitime de l’association à sécuriser le service (article 6.1.f du RGPD) pour l’empreinte des essais",
                ],
                [
                  "Conservation",
                  "l’identifiant de notification est effacé le lendemain de la tournée, quand le lien de suivi expire ; l’empreinte des essais infructueux est conservée 24 heures ; vous pouvez aussi retirer la livraison de l’application à tout moment, ce qui détache votre téléphone",
                ],
                [
                  "Destinataires",
                  "Supabase et Google (Firebase Cloud Messaging) en tant que sous-traitants",
                ],
              ]}
            />

            <Processing
              title="Position des conducteurs"
              facts={[
                [
                  "Données",
                  "position du téléphone du conducteur pendant la tournée, mise à jour environ toutes les 10 secondes ; seule la dernière position est enregistrée",
                ],
                [
                  "Finalité",
                  "montrer l’arrivée du livreur au destinataire en cours et calculer les heures d’arrivée",
                ],
                [
                  "Base légale",
                  "intérêt légitime de l’association à informer les destinataires (article 6.1.f du RGPD)",
                ],
                [
                  "Conservation",
                  "effacée à la fin de la tournée ; elle n’est montrée qu’au destinataire en cours de livraison",
                ],
              ]}
            />
          </Section>

          <Section id="dons">
            <Processing
              title="Dons par HelloAsso"
              facts={[
                [
                  "Fonctionnement",
                  "les dons en ligne se font sur la plateforme HelloAsso, qui collecte vos données (identité, coordonnées, paiement) en tant que responsable de traitement indépendant, selon sa propre politique de confidentialité, et vous délivre le reçu fiscal",
                ],
                [
                  "Ce que reçoit l’association",
                  "les informations des donateurs mises à disposition par HelloAsso, pour les remercier et tenir sa comptabilité",
                ],
              ]}
            />
            <p className={pClass}>
              <a
                href="https://www.helloasso.com/confidentialite"
                className={linkClass}
                rel="noopener noreferrer"
              >
                Politique de confidentialité de HelloAsso
              </a>
            </p>

            <Processing
              title="Dons faits auparavant sur notre site (paiement Stripe)"
              facts={[
                [
                  "Données",
                  "nom, prénom, adresse e-mail, adresse postale, montant et date du don, numéro et copie du reçu fiscal, références du paiement Stripe",
                ],
                [
                  "Finalité",
                  "justifier les reçus fiscaux délivrés et tenir la comptabilité",
                ],
                [
                  "Base légale",
                  "obligation légale de l’association (article 6.1.c du RGPD)",
                ],
                [
                  "Conservation",
                  "6 ans à compter de l’émission du reçu, puis suppression",
                ],
                [
                  "Destinataires",
                  "le trésorier et les administrateurs de l’association ; Supabase en tant que sous-traitant ; Stripe pour les paiements",
                ],
              ]}
            />
          </Section>

          <Section id="images">
            <p className={pClass}>
              Le site (galerie, page anniversaire) et nos réseaux sociaux
              présentent des photos, des vidéos et des enregistrements de nos
              concerts et de l’histoire de l’association, dont des témoignages
              enregistrés. Ils sont hébergés par Cloudinary et YouTube.
            </p>
            <ul className={ulClass}>
              <li className="mb-2">
                <strong>Finalité</strong> : faire connaître les activités et
                l’histoire de l’association.
              </li>
              <li className="mb-2">
                <strong>Base légale</strong> : intérêt légitime de l’association
                (article 6.1.f du RGPD).
              </li>
              <li className="mb-2">
                <strong>Vos droits</strong> : si vous apparaissez sur une image
                ou un enregistrement, vous pouvez demander son retrait à tout
                moment en écrivant à <PrivacyMail />.
              </li>
            </ul>
          </Section>

          <Section id="prestataires">
            <p className={pClass}>
              Vos données ne sont accessibles qu’aux membres de l’association
              qui en ont besoin pour leur mission (bureau, administrateurs,
              conducteurs des tournées) et aux prestataires suivants, qui les
              traitent pour notre compte et selon nos instructions :
            </p>
            <ul className={ulClass}>
              {PROCESSORS.map((processor) => (
                <li key={processor.name} className="mb-2">
                  <strong>{processor.name}</strong> : {processor.role}.
                  Garanties : {processor.safeguard}.
                </li>
              ))}
            </ul>
            <p className={pClass}>
              HelloAsso (France) traite les dons en tant que responsable de
              traitement indépendant. YouTube, Vimeo et Google Maps, lorsque
              vous choisissez de les afficher, agissent sous leur propre
              responsabilité.
            </p>
          </Section>

          <Section id="transferts">
            <p className={pClass}>
              Nos données sont stockées à Paris (France). Certains prestataires
              sont établis hors de l’Union européenne ou peuvent accéder aux
              données depuis l’étranger, notamment depuis les États-Unis. Ces
              transferts sont encadrés par les garanties prévues par le RGPD et
              publiées par chaque prestataire : la décision d’adéquation de la
              Commission européenne pour les entreprises américaines certifiées
              au cadre de protection des données UE–États-Unis (Data Privacy
              Framework), la décision d’adéquation pour Israël, et les clauses
              contractuelles types adoptées par la Commission européenne. Vous
              pouvez nous demander une copie de ces garanties.
            </p>
          </Section>

          <Section id="conservation">
            <ul className={ulClass}>
              {RETENTION.map(([what, howLong]) => (
                <li key={what} className="mb-2">
                  <strong>{what}</strong> : {howLong}.
                </li>
              ))}
            </ul>
            <p className={pClass}>
              À l’issue de ces durées, les données sont supprimées ou rendues
              anonymes.
            </p>
          </Section>

          <Section id="droits" last>
            <p className={pClass}>
              Conformément au Règlement général sur la protection des données
              (RGPD) et à la loi Informatique et Libertés, vous disposez des
              droits suivants :
            </p>
            <ul className={ulClass}>
              <li className="mb-2">
                <strong>Droit d’accès</strong> : savoir quelles données nous
                détenons sur vous et en obtenir une copie.
              </li>
              <li className="mb-2">
                <strong>Droit de rectification</strong> : faire corriger des
                données inexactes ou incomplètes.
              </li>
              <li className="mb-2">
                <strong>Droit à l’effacement</strong> : faire supprimer vos
                données, sauf si nous devons les conserver, par exemple pour une
                obligation légale.
              </li>
              <li className="mb-2">
                <strong>Droit à la limitation</strong> : faire suspendre
                l’utilisation de vos données pendant l’examen d’une
                contestation.
              </li>
              <li className="mb-2">
                <strong>Droit à la portabilité</strong> : recevoir les données
                que vous nous avez fournies dans un format structuré et lisible
                par une machine.
              </li>
              <li className="mb-2">
                <strong>Droit d’opposition</strong> : vous opposer à un
                traitement fondé sur notre intérêt légitime, pour des raisons
                tenant à votre situation particulière.
              </li>
              <li className="mb-2">
                <strong>Retrait du consentement</strong> : à tout moment, pour
                les traitements fondés sur votre consentement (cookies de mesure
                d’audience, lettre d’information, souvenirs), sans remettre en
                cause ce qui a été fait avant.
              </li>
              <li className="mb-2">
                <strong>Directives après le décès</strong> : indiquer ce que
                vous souhaitez que nous fassions de vos données après votre
                décès.
              </li>
            </ul>
            <p className={pClass}>
              Pour exercer ces droits, écrivez-nous à <PrivacyMail /> ou par
              courrier au 3 Rue Clemenceau, 67700 Saverne. Nous répondons dans
              un délai d’un mois, qui peut être prolongé de deux mois pour une
              demande complexe ; nous vous en informons alors. Nous pouvons vous
              demander de justifier de votre identité en cas de doute
              raisonnable.
            </p>
            <p className="text-foreground">
              Si vous estimez, après nous avoir contactés, que vos droits ne
              sont pas respectés, vous pouvez adresser une réclamation à la
              Commission nationale de l’informatique et des libertés (CNIL),
              Service des plaintes, 3 place de Fontenoy, 75007 Paris, ou en
              ligne sur{" "}
              <a
                href="https://www.cnil.fr/fr/plaintes"
                className={linkClass}
                rel="noopener noreferrer"
              >
                cnil.fr/fr/plaintes
              </a>
              .
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}
