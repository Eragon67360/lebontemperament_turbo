"use client";

import { Button } from "@heroui/react";
import { motion, useInView } from "motion/react";
import { useRef, useState } from "react";
import { FaHeart, FaPaperPlane, FaQuoteLeft, FaUser } from "react-icons/fa";

interface Testimonial {
  id: string;
  author: string;
  role?: string;
  year?: number;
  content: string;
  avatar?: string;
}

// Testimonials with authentic voices and specific details
const testimonials: Testimonial[] = [
  {
    id: "1",
    author: "Marie Dupont",
    role: "Membre Fondateur, Violon",
    year: 1984,
    content:
      "Ce premier concert, le 18 novembre 1984... Je revois encore la salle, les visages du public, nos mains qui tremblaient un peu. On avait répété pendant 3 mois, et là, c'était le grand saut. Quand on a fini, il y a eu ce silence, puis les applaudissements. On s'est regardés, et on a su qu'on allait continuer. 40 ans plus tard, je suis toujours là !",
    avatar: "https://placehold.co/100x100/FF6B6B/FFFFFF?text=MD",
  },
  {
    id: "2",
    author: "Jean Martin",
    role: "Ancien Membre, Violoncelle",
    year: 1995,
    content:
      "J'ai quitté l'ensemble en 2000 pour des raisons professionnelles, mais je reviens souvent aux concerts. Ce qui m'a marqué, c'est cette complicité qu'on avait. Les répétitions du jeudi soir, ces moments où on cherchait ensemble la bonne interprétation... C'est une famille, vraiment. Et même après 25 ans, quand je croise un ancien membre, on se reconnaît tout de suite.",
    avatar: "https://placehold.co/100x100/4ECDC4/FFFFFF?text=JM",
  },
  {
    id: "3",
    author: "Sophie Laurent",
    role: "Membre Actuel, Flûte",
    year: 2020,
    content:
      "J'ai rejoint Le Bon Tempérament en 2020, juste avant le confinement. Ça a été dur de ne pas pouvoir répéter pendant des mois. Mais le premier concert après, en juin 2021, quelle émotion ! On avait tous les larmes aux yeux. C'est ça, Le Bon Tempérament : une passion qui résiste à tout, même aux épreuves.",
    avatar: "https://placehold.co/100x100/45B7D1/FFFFFF?text=SL",
  },
  {
    id: "4",
    author: "Pierre Dubois",
    role: "Spectateur Fidèle",
    year: 2010,
    content:
      "Je suis venu à mon premier concert en 2010, par hasard. Depuis, je n'en ai manqué aucun. Ce qui me touche, c'est cette authenticité. Pas de tralala, juste de la musique, bien jouée, avec le cœur. Et cette convivialité après les concerts, où on discute avec les musiciens... C'est rare, ça.",
    avatar: "https://placehold.co/100x100/FFA07A/FFFFFF?text=PD",
  },
  {
    id: "5",
    author: "Claire Bernard",
    role: "Membre, Alto",
    year: 2005,
    content:
      "Mes meilleurs souvenirs ? La tournée en Allemagne en 2018, où on a dormi dans des auberges de jeunesse et mangé des saucisses à tous les repas. Les fous rires dans le minibus. Et puis ce concert à Marmoutier où l'acoustique était si belle qu'on avait l'impression de jouer dans une cathédrale. 40 ans, c'est long, mais ça passe si vite quand on aime ce qu'on fait.",
    avatar: "https://placehold.co/100x100/98D8C8/FFFFFF?text=CB",
  },
  {
    id: "6",
    author: "Marc Lefebvre",
    role: "Directeur Musical",
    year: 2015,
    content:
      "Quand j'ai pris la direction en 2015, j'avais peur de ne pas être à la hauteur. Mais l'ensemble m'a accueilli avec bienveillance. Ce qui me frappe, c'est cette capacité à évoluer tout en gardant l'essence : la passion, la rigueur, et surtout cette joie de jouer ensemble. 40 ans, c'est un bel âge pour un ensemble. Et on n'a pas fini !",
    avatar: "https://placehold.co/100x100/F7DC6F/FFFFFF?text=ML",
  },
];

const MemorySharing = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.1 });
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
    year: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Placeholder: In real implementation, this would submit to an API
    console.log("Submitting memory:", formData);
    alert("Merci pour votre témoignage ! Il sera publié après modération.");
    setFormData({ name: "", email: "", message: "", year: "" });
  };

  return (
    <section
      id="memories"
      ref={sectionRef}
      className="relative bg-gradient-to-b from-rose-50 to-red-50 py-20 dark:from-gray-900 dark:to-gray-800"
    >
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="mb-12 text-center"
        >
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-gradient-to-br from-rose-500 to-red-500 p-4">
              <FaHeart className="text-4xl text-white" />
            </div>
          </div>
          <h2 className="mb-4 text-4xl font-black text-gray-900 md:text-5xl dark:text-white">
            Partagez Vos Souvenirs
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-700 dark:text-gray-300">
            Vos témoignages font partie de notre histoire. Partagez vos moments
            mémorables avec Le Bon Tempérament !
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="mb-16 grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => {
            const randomRotation = (index % 4) * 0.3 - 0.45; // Variations subtiles
            const randomDelay = index * 0.11 + (index % 3) * 0.03;

            return (
              <motion.div
                key={testimonial.id}
                initial={{ opacity: 0, y: 50, rotate: randomRotation }}
                animate={isInView ? { opacity: 1, y: 0, rotate: 0 } : {}}
                transition={{
                  delay: randomDelay,
                  duration: 0.6 + (index % 3) * 0.1,
                  type: "spring",
                  stiffness: 100 + index * 5,
                }}
                whileHover={{
                  scale: 1.03,
                  y: -8,
                  rotate: randomRotation * 0.3,
                }}
                className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-lg transition-all duration-300 hover:shadow-2xl md:p-6 dark:bg-gray-800"
              >
                {/* Quote icon */}
                <div className="absolute top-4 right-4 text-rose-200 dark:text-rose-900">
                  <FaQuoteLeft className="text-4xl" />
                </div>

                {/* Content */}
                <div className="relative z-10">
                  <p className="mb-6 leading-relaxed text-gray-700 dark:text-gray-300">
                    &ldquo;{testimonial.content}&rdquo;
                  </p>

                  {/* Author */}
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 overflow-hidden rounded-full bg-gradient-to-br from-rose-400 to-red-500">
                      {testimonial.avatar ? (
                        <img
                          src={testimonial.avatar}
                          alt={testimonial.author}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-white">
                          <FaUser />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 dark:text-white">
                        {testimonial.author}
                      </div>
                      {testimonial.role && (
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {testimonial.role}
                        </div>
                      )}
                      {testimonial.year && (
                        <div className="text-xs text-rose-500">
                          {testimonial.year}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Decorative gradient */}
                <div className="absolute inset-0 -z-10 bg-gradient-to-br from-rose-50 to-red-50 opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:from-rose-900/10 dark:to-red-900/10" />
              </motion.div>
            );
          })}
        </div>

        {/* Share Your Memory Form */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="mx-auto max-w-2xl rounded-2xl bg-white p-8 shadow-xl dark:bg-gray-800"
        >
          <h3 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
            Partagez Votre Témoignage
          </h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300"
              >
                Votre Nom
              </label>
              <input
                type="text"
                id="name"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="Votre nom"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300"
              >
                Votre Email
              </label>
              <input
                type="email"
                id="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="votre@email.com"
              />
            </div>

            <div>
              <label
                htmlFor="year"
                className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300"
              >
                Année (optionnel)
              </label>
              <input
                type="number"
                id="year"
                min="1984"
                max="2024"
                value={formData.year}
                onChange={(e) =>
                  setFormData({ ...formData, year: e.target.value })
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="1984-2024"
              />
            </div>

            <div>
              <label
                htmlFor="message"
                className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300"
              >
                Votre Témoignage
              </label>
              <textarea
                id="message"
                required
                rows={6}
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="Partagez vos souvenirs, anecdotes, ou messages pour les 40 ans du Bon Tempérament..."
              />
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full bg-gradient-to-r from-rose-500 to-red-500 text-white"
              endContent={<FaPaperPlane />}
            >
              Envoyer Mon Témoignage
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-gray-600 dark:text-gray-400">
            Les témoignages sont modérés avant publication. Merci de votre
            contribution !
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default MemorySharing;
