"use client";

import { Button } from "@heroui/react";
import { motion, useInView, useScroll, useTransform } from "motion/react";
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
    avatar: "https://placehold.co/100x100/1A878D/FFFFFF?text=MD",
  },
  {
    id: "2",
    author: "Jean Martin",
    role: "Ancien Membre, Violoncelle",
    year: 1995,
    content:
      "J'ai quitté l'ensemble en 2000 pour des raisons professionnelles, mais je reviens souvent aux concerts. Ce qui m'a marqué, c'est cette complicité qu'on avait. Les répétitions du jeudi soir, ces moments où on cherchait ensemble la bonne interprétation... C'est une famille, vraiment. Et même après 25 ans, quand je croise un ancien membre, on se reconnaît tout de suite.",
    avatar: "https://placehold.co/100x100/0D6B70/FFFFFF?text=JM",
  },
  {
    id: "3",
    author: "Sophie Laurent",
    role: "Membre Actuel, Flûte",
    year: 2020,
    content:
      "J'ai rejoint Le Bon Tempérament en 2020, juste avant le confinement. Ça a été dur de ne pas pouvoir répéter pendant des mois. Mais le premier concert après, en juin 2021, quelle émotion ! On avait tous les larmes aux yeux. C'est ça, Le Bon Tempérament : une passion qui résiste à tout, même aux épreuves.",
    avatar: "https://placehold.co/100x100/1A878D/FFFFFF?text=SL",
  },
  {
    id: "4",
    author: "Pierre Dubois",
    role: "Spectateur Fidèle",
    year: 2010,
    content:
      "Je suis venu à mon premier concert en 2010, par hasard. Depuis, je n'en ai manqué aucun. Ce qui me touche, c'est cette authenticité. Pas de tralala, juste de la musique, bien jouée, avec le cœur. Et cette convivialité après les concerts, où on discute avec les musiciens... C'est rare, ça.",
    avatar: "https://placehold.co/100x100/0D6B70/FFFFFF?text=PD",
  },
  {
    id: "5",
    author: "Claire Bernard",
    role: "Membre, Alto",
    year: 2005,
    content:
      "Mes meilleurs souvenirs ? La tournée en Allemagne en 2018, où on a dormi dans des auberges de jeunesse et mangé des saucisses à tous les repas. Les fous rires dans le minibus. Et puis ce concert à Marmoutier où l'acoustique était si belle qu'on avait l'impression de jouer dans une cathédrale. 40 ans, c'est long, mais ça passe si vite quand on aime ce qu'on fait.",
    avatar: "https://placehold.co/100x100/1A878D/FFFFFF?text=CB",
  },
  {
    id: "6",
    author: "Marc Lefebvre",
    role: "Directeur Musical",
    year: 2015,
    content:
      "Quand j'ai pris la direction en 2015, j'avais peur de ne pas être à la hauteur. Mais l'ensemble m'a accueilli avec bienveillance. Ce qui me frappe, c'est cette capacité à évoluer tout en gardant l'essence : la passion, la rigueur, et surtout cette joie de jouer ensemble. 40 ans, c'est un bel âge pour un ensemble. Et on n'a pas fini !",
    avatar: "https://placehold.co/100x100/0D6B70/FFFFFF?text=ML",
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

  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 1000], [30, -30]);

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
      className="bg-background relative overflow-hidden py-16"
    >
      {/* Parallax background orb */}
      <motion.div
        style={{ y }}
        className="bg-primary/8 absolute top-1/3 left-1/3 h-[500px] w-[500px] rounded-full blur-[100px]"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <motion.div
            className="mb-6 flex justify-center"
            whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
            transition={{ duration: 0.5 }}
          >
            <div className="relative">
              {/* Glow effect with heartbeat animation */}
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="bg-primary/30 absolute inset-0 scale-110 rounded-full blur-2xl"
              />

              {/* Glass icon */}
              <div className="from-primary to-primary/80 shadow-primary/20 relative rounded-full bg-gradient-to-br p-5 shadow-xl">
                <FaHeart className="text-5xl text-white" />
              </div>
            </div>
          </motion.div>

          {/* Glass morphism title */}
          <div className="relative mx-auto mb-6 inline-block">
            <div className="from-primary/10 to-primary/5 absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br backdrop-blur-xl" />
            <div
              className="absolute inset-0 -z-10 rounded-2xl opacity-50"
              style={{
                background:
                  "linear-gradient(135deg, rgba(26, 135, 141, 0.15) 0%, rgba(13, 107, 112, 0.05) 100%)",
                filter: "blur(15px)",
              }}
            />
            <h2 className="text-title text-primary/50 dark:text-primary px-8 py-4 leading-none font-light">
              Partagez Vos Souvenirs
            </h2>
          </div>
          <p className="text-foreground mx-auto max-w-2xl text-lg font-light">
            Vos témoignages font partie de notre histoire. Partagez vos moments
            mémorables avec Le Bon Tempérament !
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="mb-16 grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => {
            return (
              <motion.div
                key={testimonial.id}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{
                  delay: index * 0.1,
                  duration: 0.6,
                }}
                whileHover={{ y: -4 }}
                className="border-divider bg-background group relative overflow-hidden rounded-lg border p-6 shadow-sm transition-all duration-300 hover:shadow-md"
              >
                {/* Quote icon */}
                <div className="text-primary/20 absolute top-4 right-4">
                  <FaQuoteLeft className="text-4xl" />
                </div>

                {/* Content */}
                <div className="relative z-10">
                  <p className="text-foreground/70 mb-6 leading-relaxed font-light">
                    &ldquo;{testimonial.content}&rdquo;
                  </p>

                  {/* Author */}
                  <div className="flex items-center gap-4">
                    <div className="bg-primary h-12 w-12 overflow-hidden rounded-full">
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
                      <div className="text-foreground font-semibold">
                        {testimonial.author}
                      </div>
                      {testimonial.role && (
                        <div className="text-foreground/70 text-sm font-light">
                          {testimonial.role}
                        </div>
                      )}
                      {testimonial.year && (
                        <div className="text-primary text-xs font-semibold">
                          {testimonial.year}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Share Your Memory Form */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="group border-primary/10 bg-background/50 relative mx-auto max-w-2xl overflow-hidden rounded-xl border p-8 shadow-lg backdrop-blur-sm"
        >
          <h3 className="text-foreground mb-6 text-2xl font-semibold">
            Partagez Votre Témoignage
          </h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="name"
                className="text-foreground mb-2 block text-sm font-semibold"
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
                className="border-divider bg-background text-foreground focus:border-primary focus:ring-primary/20 w-full rounded-lg border px-4 py-2 focus:ring-2 focus:outline-none"
                placeholder="Votre nom"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="text-foreground mb-2 block text-sm font-semibold"
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
                className="border-divider bg-background text-foreground focus:border-primary focus:ring-primary/20 w-full rounded-lg border px-4 py-2 focus:ring-2 focus:outline-none"
                placeholder="votre@email.com"
              />
            </div>

            <div>
              <label
                htmlFor="year"
                className="text-foreground mb-2 block text-sm font-semibold"
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
                className="border-divider bg-background text-foreground focus:border-primary focus:ring-primary/20 w-full rounded-lg border px-4 py-2 focus:ring-2 focus:outline-none"
                placeholder="1984-2024"
              />
            </div>

            <div>
              <label
                htmlFor="message"
                className="text-foreground mb-2 block text-sm font-semibold"
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
                className="border-divider bg-background text-foreground focus:border-primary focus:ring-primary/20 w-full rounded-lg border px-4 py-2 focus:ring-2 focus:outline-none"
                placeholder="Partagez vos souvenirs, anecdotes, ou messages pour les 40 ans du Bon Tempérament..."
              />
            </div>

            <Button
              type="submit"
              size="lg"
              color="primary"
              radius="sm"
              className="w-full"
              endContent={<FaPaperPlane />}
            >
              Envoyer Mon Témoignage
            </Button>
          </form>

          <p className="text-foreground/70 mt-4 text-center text-xs font-light">
            Les témoignages sont modérés avant publication. Merci de votre
            contribution !
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default MemorySharing;
