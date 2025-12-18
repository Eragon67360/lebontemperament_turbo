"use client";

import type { FormConfig, Memory } from "@/types/anniversary";
import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { FaHeart, FaPaperPlane, FaQuoteLeft, FaUser } from "react-icons/fa";
import { toast } from "sonner";

interface MemorySharingProps {
  config: FormConfig;
  featuredMemories: Memory[];
}

const MemorySharing = ({ config, featuredMemories }: MemorySharingProps) => {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.1 });
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
    year: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isFormValid = (): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return (
      formData.name.trim() !== "" &&
      formData.email.trim() !== "" &&
      emailRegex.test(formData.email) &&
      formData.message.trim() !== ""
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) return;
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/anniversary/submit-memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("API submission failed");

      toast.success(config.success_message);
      setFormData({ name: "", email: "", message: "", year: "" });
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  return (
    <section
      id="memories"
      ref={sectionRef}
      className="relative overflow-hidden bg-slate-50 py-16 text-slate-800 dark:bg-slate-900 dark:text-slate-200"
    >
      <div className="absolute inset-0 z-0">
        <div className="bg-primary/5 absolute top-1/3 left-1/3 h-125 w-125 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <div className="bg-primary/5 text-primary dark:bg-primary/10 mb-6 inline-flex rounded-full p-4">
            <FaHeart className="text-4xl" />
          </div>
          <h2 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl dark:text-white">
            {config.section_title}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg font-light text-slate-500 dark:text-slate-400">
            {config.section_description}
          </p>
        </motion.div>

        {/* Featured Memories Grid */}
        {featuredMemories.length > 0 && (
          <div className="mb-16 grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
            {featuredMemories.map((memory, index) => (
              <motion.div
                key={memory.id}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                className="relative flex flex-col rounded-xl border border-slate-200/80 bg-white/30 p-6 backdrop-blur-md dark:border-slate-800/50 dark:bg-slate-900/30"
              >
                <div className="absolute top-6 right-6 z-0 text-slate-200 dark:text-slate-700">
                  <FaQuoteLeft className="text-4xl" />
                </div>

                <div className="relative z-10 flex grow flex-col">
                  <p className="grow leading-relaxed font-light text-slate-500 italic dark:text-slate-400">
                    “{memory.message}”
                  </p>
                  <div className="mt-6 flex items-center gap-4 border-t border-slate-200 pt-4 dark:border-slate-800">
                    <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                      <FaUser />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {memory.name}
                      </p>
                      {memory.year && (
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          {memory.year}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {config.is_enabled && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mx-auto max-w-2xl rounded-xl border border-slate-200/80 bg-white/30 p-8 backdrop-blur-md dark:border-slate-800/50 dark:bg-slate-900/30"
          >
            <h3 className="mb-6 text-center text-2xl font-medium text-slate-900 dark:text-white">
              Partagez Votre Témoignage
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className="sr-only">
                    {config.name_label}
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    placeholder={config.name_label}
                    className="focus:border-primary focus:ring-primary w-full rounded-md border border-slate-300 bg-white/50 px-4 py-2 text-sm font-light text-slate-800 placeholder-slate-400 focus:ring-1 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-200 dark:placeholder-slate-500"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="sr-only">
                    {config.email_label}
                  </label>
                  <input
                    type="email"
                    id="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    placeholder={config.email_label}
                    className="focus:border-primary focus:ring-primary w-full rounded-md border border-slate-300 bg-white/50 px-4 py-2 text-sm font-light text-slate-800 placeholder-slate-400 focus:ring-1 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-200 dark:placeholder-slate-500"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="year" className="sr-only">
                  {config.year_label}
                </label>
                <input
                  type="number"
                  id="year"
                  min="1984"
                  max={new Date().getFullYear()}
                  value={formData.year}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  placeholder={config.year_label}
                  className="focus:border-primary focus:ring-primary w-full rounded-md border border-slate-300 bg-white/50 px-4 py-2 text-sm font-light text-slate-800 placeholder-slate-400 focus:ring-1 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-200 dark:placeholder-slate-500"
                />
              </div>
              <div>
                <label htmlFor="message" className="sr-only">
                  {config.message_label}
                </label>
                <textarea
                  id="message"
                  required
                  rows={5}
                  value={formData.message}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  placeholder={config.message_label}
                  className="focus:border-primary focus:ring-primary w-full rounded-md border border-slate-300 bg-white/50 px-4 py-2 text-sm font-light text-slate-800 placeholder-slate-400 focus:ring-1 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-200 dark:placeholder-slate-500"
                />
              </div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="mt-12 text-center"
              >
                <motion.button
                  type="submit"
                  variants={{
                    initial: { color: "var(--color-primary)" },
                    hover: { color: "#ffffff" },
                  }}
                  initial="initial"
                  whileHover="hover"
                  disabled={!isFormValid() || isSubmitting}
                  transition={{ duration: 0.3 }}
                  className="group/btn border-primary/40 text-primary enabled:hover:border-primary/80 dark:border-primary/50 dark:text-primary relative w-full overflow-hidden rounded-md border py-3 font-medium transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <motion.div
                    className="bg-primary absolute inset-0 -z-10"
                    variants={{
                      initial: { y: "100%" },
                    }}
                    whileHover={
                      isFormValid() && !isSubmitting ? { y: "0%" } : {}
                    }
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  />

                  <motion.span className="mx-auto flex w-fit items-center justify-center gap-2 transition-colors duration-300">
                    {isSubmitting ? "Envoi..." : config.submit_button_text}
                    {!isSubmitting && <FaPaperPlane />}
                    {/* <FaImages /> */}
                  </motion.span>
                </motion.button>
              </motion.div>

              <p className="pt-2 text-center text-xs font-light text-slate-400 dark:text-slate-500">
                Les témoignages sont modérés avant publication.
              </p>
            </form>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default MemorySharing;
