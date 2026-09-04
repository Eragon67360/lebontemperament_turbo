"use client";

import { motion, useInView, useReducedMotion } from "motion/react";
import { useRef } from "react";
import { FaArchive, FaArrowRight } from "react-icons/fa";
import AnniversaryCTA from "./AnniversaryCTA";

const ArchivesSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.1 });
  const shouldReduceMotion = useReducedMotion();

  return (
    <section
      id="archives"
      ref={sectionRef}
      className="relative overflow-hidden bg-slate-50 py-16 text-slate-800 sm:py-24 dark:bg-slate-900 dark:text-slate-200"
    >
      <div className="absolute inset-0 z-0">
        <div className="bg-primary/5 absolute top-1/4 right-0 h-112 w-md rounded-full blur-[100px]" />
        <div className="bg-primary/5 absolute bottom-1/4 left-0 h-75 w-75 rounded-full blur-[80px]" />
      </div>
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <div className="bg-primary/5 text-primary dark:bg-primary/10 mb-6 inline-flex rounded-full p-4">
            <FaArchive className="text-3xl sm:text-4xl" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-5xl dark:text-white">
            Archives
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg font-light text-slate-500 dark:text-slate-400">
            Explorez nos archives historiques : rapports d'Assemblée Générale,
            documents officiels, programmes de concerts et bien plus encore.
          </p>

          <motion.div
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mt-8"
          >
            <AnniversaryCTA href="/40-ans/archives">
              Consulter les archives
              <FaArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
            </AnniversaryCTA>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default ArchivesSection;
