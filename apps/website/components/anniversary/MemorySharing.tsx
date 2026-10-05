"use client";

import { useReducedMotion } from "@/hooks/useReducedMotion";
import { PROGRAMME_FIRST_YEAR } from "@/lib/anniversaryProgramme";
import type { FormConfig, Memory } from "@/types/anniversary";
import { FILL_TIME_FIELD, HONEYPOT_FIELD } from "@repo/domain/utils/formAbuse";
import { motion, useInView } from "motion/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import ProgrammeHeading from "./programme/ProgrammeHeading";
import { PROGRAMME_PARTS } from "./programme/sections";
import { BUTTON_TEAL, CAPS, PAPER, TEXT } from "./programme/theme";

interface MemorySharingProps {
  config: FormConfig;
  featuredMemories: Memory[];
  /** A year chosen on a season (« Signez le livre d’or »), to prefill. */
  prefillYear?: number | null;
}

const MemorySharing = ({
  config,
  featuredMemories,
  prefillYear = null,
}: MemorySharingProps) => {
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

  // A season picked in « Quarante saisons » fills the year (state adjusted while
  // rendering, the React way to follow a prop without an effect).
  const [lastPrefill, setLastPrefill] = useState(prefillYear);
  if (prefillYear !== lastPrefill) {
    setLastPrefill(prefillYear);
    if (prefillYear !== null) {
      setFormData((prev) => ({ ...prev, year: String(prefillYear) }));
    }
  }

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

  const fieldLabel = `${CAPS} text-(--p-muted)`;
  const fieldInput = `${TEXT} w-full min-w-0 rounded-none border-0 border-b border-(--p-ink) bg-transparent py-2.5 text-xl text-(--p-ink) focus:border-b-2 focus:border-(--p-teal) focus:outline-none disabled:opacity-60`;

  return (
    <section
      id="memories"
      ref={sectionRef}
      className="scroll-mt-20 px-4 py-16 sm:px-6 sm:py-24 lg:px-8"
    >
      <div className="mx-auto max-w-[1180px]">
        {featuredMemories.length > 0 && (
          <div className="mb-16">
            <ProgrammeHeading
              part={PROGRAMME_PARTS.memories!.part}
              title="Ils ont signé"
              className="mb-10"
            />
            <ul className="grid gap-x-12 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
              {featuredMemories.map((memory, index) => (
                <motion.li
                  key={memory.id}
                  initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 24 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                  className="border-t border-(--p-rule) pt-6"
                >
                  <figure>
                    <blockquote
                      className={`${TEXT} text-xl leading-snug italic`}
                    >
                      « {memory.message} »
                    </blockquote>
                    <figcaption className={`${CAPS} mt-4 text-(--p-muted)`}>
                      {memory.name}
                      {memory.year && ` · ${memory.year}`}
                    </figcaption>
                  </figure>
                </motion.li>
              ))}
            </ul>
          </div>
        )}

        {config.is_enabled && (
          <div
            className={`${PAPER} grid gap-12 px-6 py-12 sm:px-12 sm:py-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-16 lg:px-20 lg:py-[72px]`}
          >
            <ProgrammeHeading
              part="Votre mot"
              size="sm"
              title={config.section_title}
              intro={config.section_description}
            />
            <form
              onSubmit={handleSubmit}
              className="relative flex flex-col gap-6"
            >
              <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_120px]">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="memory-name" className={fieldLabel}>
                    {config.name_label}
                  </label>
                  <input
                    id="memory-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    disabled={isSubmitting}
                    value={formData.name}
                    onChange={(e) => handleFieldChange("name", e.target.value)}
                    className={fieldInput}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="memory-email" className={fieldLabel}>
                    {config.email_label}
                  </label>
                  <input
                    id="memory-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    disabled={isSubmitting}
                    value={formData.email}
                    onChange={(e) => handleFieldChange("email", e.target.value)}
                    className={fieldInput}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="memory-year" className={fieldLabel}>
                    {config.year_label}
                  </label>
                  <input
                    id="memory-year"
                    name="year"
                    type="number"
                    inputMode="numeric"
                    min={PROGRAMME_FIRST_YEAR}
                    max={new Date().getFullYear()}
                    disabled={isSubmitting}
                    value={formData.year}
                    onChange={(e) => handleFieldChange("year", e.target.value)}
                    className={fieldInput}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="memory-message" className={fieldLabel}>
                  {config.message_label}
                </label>
                <textarea
                  id="memory-message"
                  name="message"
                  rows={4}
                  required
                  disabled={isSubmitting}
                  value={formData.message}
                  onChange={(e) => handleFieldChange("message", e.target.value)}
                  className={`${fieldInput} resize-y`}
                />
              </div>
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
              <div>
                <button
                  type="submit"
                  disabled={isSubmitDisabled || isSubmitting}
                  className={`${BUTTON_TEAL} disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  {isSubmitting ? "Envoi..." : config.submit_button_text}
                </button>
              </div>

              <p className="text-xs leading-relaxed text-(--p-muted)">
                Les témoignages sont modérés avant publication. Votre nom et
                votre témoignage peuvent être publiés sur cette page ; votre
                adresse e-mail n’est jamais publiée et est effacée après la
                modération. En savoir plus dans notre{" "}
                <Link
                  href="/politique-de-confidentialite"
                  className="text-(--p-teal) underline hover:no-underline"
                >
                  politique de confidentialité
                </Link>
                .
              </p>
            </form>
          </div>
        )}
      </div>
    </section>
  );
};

export default MemorySharing;
