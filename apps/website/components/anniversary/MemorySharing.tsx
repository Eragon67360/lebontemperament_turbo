"use client";

import type { FormConfig, Memory } from "@/types/anniversary";
import { Button } from "@heroui/react";
import { motion, useInView, useScroll, useTransform } from "motion/react";
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
  const [emailError, setEmailError] = useState<string>("");

  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 1000], [30, -30]);

  // Email validation function
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Check if form is valid
  const isFormValid = (): boolean => {
    return (
      formData.name.trim() !== "" &&
      formData.email.trim() !== "" &&
      validateEmail(formData.email) &&
      formData.message.trim() !== "" &&
      emailError === ""
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/anniversary/submit-memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          message: formData.message,
          year: formData.year || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit");
      }

      toast.success(config.success_message);
      setFormData({ name: "", email: "", message: "", year: "" });
      setEmailError("");
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
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
              {config.section_title}
            </h2>
          </div>
          <p className="text-foreground mx-auto max-w-2xl text-lg font-light">
            {config.section_description}
          </p>
        </motion.div>

        {/* Featured Memories Grid */}
        {featuredMemories.length > 0 && (
          <div className="mb-16 grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
            {featuredMemories.map((memory, index) => {
              return (
                <motion.div
                  key={memory.id}
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
                      &ldquo;{memory.message}&rdquo;
                    </p>

                    {/* Author */}
                    <div className="flex items-center gap-4">
                      <div className="bg-primary flex h-12 w-12 items-center justify-center overflow-hidden rounded-full text-white">
                        <FaUser />
                      </div>
                      <div>
                        <div className="text-foreground font-semibold">
                          {memory.name}
                        </div>
                        {memory.year && (
                          <div className="text-primary text-xs font-semibold">
                            {memory.year}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Share Your Memory Form */}
        {config.is_enabled && (
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
                  {config.name_label}
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
                  placeholder={config.name_label}
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="text-foreground mb-2 block text-sm font-semibold"
                >
                  {config.email_label}
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
                  placeholder={config.email_label}
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label
                  htmlFor="year"
                  className="text-foreground mb-2 block text-sm font-semibold"
                >
                  {config.year_label}
                </label>
                <input
                  type="number"
                  id="year"
                  min="1984"
                  max="2100"
                  value={formData.year}
                  onChange={(e) =>
                    setFormData({ ...formData, year: e.target.value })
                  }
                  className="border-divider bg-background text-foreground focus:border-primary focus:ring-primary/20 w-full rounded-lg border px-4 py-2 focus:ring-2 focus:outline-none"
                  placeholder={config.year_label}
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="text-foreground mb-2 block text-sm font-semibold"
                >
                  {config.message_label}
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
                  placeholder={config.message_label}
                  disabled={isSubmitting}
                />
              </div>

              <Button
                type="submit"
                size="lg"
                color="primary"
                radius="sm"
                className="w-full"
                endContent={<FaPaperPlane />}
                isLoading={isSubmitting}
                isDisabled={!isFormValid() || isSubmitting}
              >
                {config.submit_button_text}
              </Button>

              <p className="text-foreground/70 mt-4 text-center text-xs font-light">
                Les témoignages sont modérés avant publication. Merci de votre
                contribution !
              </p>
            </form>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default MemorySharing;
