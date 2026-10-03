"use client";

import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { FormConfig, Memory } from "@/types/anniversary";
import { Input, Label, TextArea, TextField } from "@heroui/react";
import { FILL_TIME_FIELD, HONEYPOT_FIELD } from "@repo/domain/utils/formAbuse";
import { motion, useInView } from "motion/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { FaHeart, FaPaperPlane, FaQuoteLeft, FaUser } from "react-icons/fa";
import { toast } from "sonner";
import AnniversaryCTA from "./AnniversaryCTA";

interface MemorySharingProps {
  config: FormConfig;
  featuredMemories: Memory[];
}

const MemorySharing = ({ config, featuredMemories }: MemorySharingProps) => {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.1 });
  const shouldReduceMotion = useReducedMotion();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
    year: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Spam checks without a third party: a field people never see, and the
  // time they needed to fill the form (measured from the first render).
  const [honeypot, setHoneypot] = useState("");
  const openedAt = useRef(0);
  useEffect(() => {
    openedAt.current = performance.now();
  }, []);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isSubmitDisabled =
    formData.name.trim() === "" ||
    formData.email.trim() === "" ||
    !emailRegex.test(formData.email) ||
    formData.message.trim() === "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitDisabled) return;

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/anniversary/submit-memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          [HONEYPOT_FIELD]: honeypot,
          [FILL_TIME_FIELD]: Math.round(performance.now() - openedAt.current),
        }),
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

  const handleFieldChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <section
      id="memories"
      ref={sectionRef}
      className="bg-background text-foreground relative overflow-hidden py-16 sm:py-24"
    >
      <div className="absolute inset-0 z-0">
        <div className="bg-primary/5 absolute top-1/3 left-1/3 h-125 w-125 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <div className="bg-primary/5 text-primary dark:bg-primary/10 mb-6 inline-flex rounded-full p-4">
            <FaHeart className="text-3xl sm:text-4xl" />
          </div>
          <h2 className="text-foreground text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            {config.section_title}
          </h2>
          <p className="text-muted mx-auto mt-4 max-w-2xl text-lg font-light">
            {config.section_description}
          </p>
        </motion.div>

        {featuredMemories.length > 0 && (
          <div className="mb-16 grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
            {featuredMemories.map((memory, index) => (
              <motion.div
                key={memory.id}
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                className="border-separator bg-surface-secondary/30 relative flex flex-col rounded-xl border p-6 backdrop-blur-md"
              >
                <div className="text-foreground/10 absolute top-6 right-6 z-0">
                  <FaQuoteLeft className="text-4xl" />
                </div>
                <div className="relative z-10 flex grow flex-col">
                  <p className="text-muted grow leading-relaxed font-light italic">
                    “{memory.message}”
                  </p>
                  <div className="border-separator mt-6 flex items-center gap-4 border-t pt-4">
                    <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                      <FaUser />
                    </div>
                    <div>
                      <p className="text-foreground font-medium">
                        {memory.name}
                      </p>
                      {memory.year && (
                        <p className="text-muted text-xs">{memory.year}</p>
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
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="border-separator bg-surface-secondary/30 mx-auto max-w-2xl rounded-xl border p-6 backdrop-blur-md sm:p-8"
          >
            <h3 className="text-foreground mb-6 text-center text-2xl font-medium">
              Partagez Votre Témoignage
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextField
                  name="name"
                  isRequired
                  isDisabled={isSubmitting}
                  value={formData.name}
                  onChange={(value) => handleFieldChange("name", value)}
                >
                  <Label>{config.name_label}</Label>
                  <Input type="text" autoComplete="name" />
                </TextField>
                <TextField
                  name="email"
                  type="email"
                  isRequired
                  isDisabled={isSubmitting}
                  value={formData.email}
                  onChange={(value) => handleFieldChange("email", value)}
                >
                  <Label>{config.email_label}</Label>
                  <Input autoComplete="email" />
                </TextField>
              </div>
              <TextField
                name="year"
                type="number"
                isDisabled={isSubmitting}
                value={formData.year}
                onChange={(value) => handleFieldChange("year", value)}
              >
                <Label>{config.year_label}</Label>
                <Input min={1984} max={new Date().getFullYear()} />
              </TextField>
              <TextField
                name="message"
                isRequired
                isDisabled={isSubmitting}
                value={formData.message}
                onChange={(value) => handleFieldChange("message", value)}
              >
                <Label>{config.message_label}</Label>
                <TextArea rows={5} />
              </TextField>
              {/* Honeypot, off-screen and hidden from assistive technologies */}
              <div
                aria-hidden="true"
                className="absolute -left-[10000px] h-px w-px overflow-hidden"
              >
                <label htmlFor="memory-website">Site web</label>
                <input
                  id="memory-website"
                  type="text"
                  name={HONEYPOT_FIELD}
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>
              <div className="pt-2 text-center">
                <AnniversaryCTA
                  type="submit"
                  disabled={isSubmitDisabled || isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? "Envoi..." : config.submit_button_text}
                  {!isSubmitting && <FaPaperPlane />}
                </AnniversaryCTA>
              </div>

              <p className="text-muted pt-2 text-center text-xs font-light">
                Les témoignages sont modérés avant publication. Votre nom et
                votre témoignage peuvent être publiés sur cette page ; votre
                adresse e-mail n’est jamais publiée et est effacée après la
                modération. En savoir plus dans notre{" "}
                <Link
                  href="/politique-de-confidentialite"
                  className="text-primary-text underline hover:no-underline"
                >
                  politique de confidentialité
                </Link>
                .
              </p>
            </form>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default MemorySharing;
