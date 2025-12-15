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

// Placeholder testimonials - to be replaced with real content
const testimonials: Testimonial[] = [
  {
    id: "1",
    author: "Marie Dupont",
    role: "Membre Fondateur",
    year: 1984,
    content:
      "Je me souviens de ce premier concert comme si c'était hier. L'émotion était palpable, et nous ne savions pas encore que nous étions au début d'une aventure de 40 ans !",
    avatar: "https://placehold.co/100x100/FF6B6B/FFFFFF?text=MD",
  },
  {
    id: "2",
    author: "Jean Martin",
    role: "Ancien Membre",
    year: 1995,
    content:
      "Le Bon Tempérament a changé ma vie. La passion partagée, les amitiés forgées, les moments musicaux inoubliables... C'est une famille que je n'oublierai jamais.",
    avatar: "https://placehold.co/100x100/4ECDC4/FFFFFF?text=JM",
  },
  {
    id: "3",
    author: "Sophie Laurent",
    role: "Membre Actuel",
    year: 2020,
    content:
      "Rejoindre Le Bon Tempérament a été la meilleure décision de ma vie. Chaque répétition, chaque concert est un moment de bonheur pur. 40 ans du Bon Tempérament, c'est une histoire magnifique !",
    avatar: "https://placehold.co/100x100/45B7D1/FFFFFF?text=SL",
  },
  {
    id: "4",
    author: "Pierre Dubois",
    role: "Ami de l'Ensemble",
    year: 2010,
    content:
      "J'ai assisté à de nombreux concerts du Bon Tempérament. La qualité artistique et l'émotion transmise sont toujours au rendez-vous. Félicitations pour ces 40 ans du Bon Tempérament !",
    avatar: "https://placehold.co/100x100/FFA07A/FFFFFF?text=PD",
  },
  {
    id: "5",
    author: "Claire Bernard",
    role: "Membre",
    year: 2005,
    content:
      "Les souvenirs s'accumulent : les tournées, les enregistrements, les fous rires en répétition... Le Bon Tempérament, c'est bien plus qu'un ensemble, c'est une famille musicale.",
    avatar: "https://placehold.co/100x100/98D8C8/FFFFFF?text=CB",
  },
  {
    id: "6",
    author: "Marc Lefebvre",
    role: "Directeur Musical Adjoint",
    year: 2015,
    content:
      "Voir évoluer Le Bon Tempérament au fil des années est un privilège. La transmission, l'innovation, la passion constante... Voilà ce qui fait la force de cet ensemble.",
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
        <div className="mb-16 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              whileHover={{ scale: 1.02, y: -5 }}
              className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-2xl dark:bg-gray-800"
            >
              {/* Quote icon */}
              <div className="absolute top-4 right-4 text-rose-200 dark:text-rose-900">
                <FaQuoteLeft className="text-4xl" />
              </div>

              {/* Content */}
              <div className="relative z-10">
                <p className="mb-6 text-gray-700 dark:text-gray-300">
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
          ))}
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
