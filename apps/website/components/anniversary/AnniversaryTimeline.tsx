"use client";

import type { TimelineEvent } from "@/types/anniversary";
import {
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import { useRef } from "react";
import {
  FaCalendarAlt,
  FaHeadphones,
  FaHeart,
  FaHistory,
  FaImages,
  FaMusic,
  FaTrophy,
  FaUsers,
  FaVideo,
} from "react-icons/fa";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  FaMusic,
  FaTrophy,
  FaUsers,
  FaCalendarAlt,
  FaHistory,
  FaVideo,
  FaHeadphones,
  FaImages,
  FaHeart,
};

interface AnniversaryTimelineProps {
  events: TimelineEvent[];
}

const AnniversaryTimeline = ({ events }: AnniversaryTimelineProps) => {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.1 });
  const shouldReduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end end"],
  });

  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  const yRaw = useTransform(scrollYProgress, [0, 1], [50, -50]);
  const y = shouldReduceMotion ? 0 : yRaw;

  return (
    <section
      id="timeline"
      ref={sectionRef}
      className="relative overflow-hidden bg-slate-50 py-16 text-slate-800 sm:py-24 dark:bg-slate-900 dark:text-slate-200"
    >
      <motion.div
        style={{ y }}
        className="bg-primary/5 absolute top-1/4 left-0 h-125 w-125 rounded-full blur-[100px]"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center md:mb-16"
        >
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-5xl dark:text-white">
            Notre Parcours : 40 Ans
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg font-light text-slate-500 dark:text-slate-400">
            Découvrez les moments clés qui ont marqué notre histoire.
          </p>
        </motion.div>

        <div className="relative">
          <div className="absolute top-0 left-4 h-full w-0.5 -translate-x-1/2 bg-slate-200 md:left-1/2 dark:bg-slate-800">
            <motion.div
              style={{ height: lineHeight }}
              className="bg-primary w-full"
            />
          </div>

          <div className="space-y-12">
            {events.map((event, index) => {
              const isEven = index % 2 === 0;
              const IconComponent = iconMap[event.icon_name] || FaMusic;

              return (
                <div key={event.id} className="relative">
                  <motion.div
                    initial={{
                      opacity: 0,
                      scale: shouldReduceMotion ? 1 : 0.5,
                    }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, amount: 0.5 }}
                    transition={{ duration: 0.5 }}
                    className="border-primary absolute top-0 left-4 z-10 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full border bg-slate-50 md:left-1/2 md:h-12 md:w-12 dark:bg-slate-900"
                  >
                    <IconComponent className="text-md text-primary md:text-xl" />
                  </motion.div>

                  <motion.div
                    initial={{
                      opacity: 0,
                      x: shouldReduceMotion ? 0 : isEven ? 20 : -20,
                    }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.5 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className={`w-full pl-10 md:w-1/2 md:pl-0 ${
                      isEven
                        ? "md:ml-auto md:pl-14"
                        : "md:mr-auto md:pr-14 md:text-right"
                    }`}
                  >
                    <div className="rounded-xl border border-slate-200/80 bg-white/30 p-4 backdrop-blur-md transition-shadow duration-300 hover:shadow-lg sm:p-6 md:text-left dark:border-slate-800/50 dark:bg-slate-900/30">
                      <p className="text-primary mb-2 text-sm font-semibold">
                        {event.year}
                      </p>
                      <h3 className="mb-3 text-lg font-medium text-slate-900 sm:text-xl dark:text-white">
                        {event.title}
                      </h3>
                      <p className="text-sm leading-relaxed font-light text-slate-500 dark:text-slate-400">
                        {event.description}
                      </p>
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AnniversaryTimeline;
