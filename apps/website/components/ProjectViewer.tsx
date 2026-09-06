"use client";

import { LinkButton } from "@/components/LinkButton";
import { ConcertProject } from "@/types/projects";
import { Skeleton } from "@heroui/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { IoIosArrowRoundForward } from "react-icons/io";
import { IoImageOutline } from "react-icons/io5";

const ProjectViewer = () => {
  const [stories, setStories] = useState<ConcertProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const response = await fetch("/api/projects");
        if (!response.ok) throw new Error("Failed to fetch concert stories");
        const data = await response.json();
        setStories(Array.isArray(data) ? data.slice(0, 4) : []);
      } catch (error) {
        console.error("Error fetching concert stories:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStories();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {[0, 1, 2, 3].map((item) => (
          <Skeleton key={item} className="h-72 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {stories.map((story) => (
        <article
          key={story.slug}
          className="border-separator bg-background group grid overflow-hidden rounded-xl border sm:grid-cols-[180px_1fr]"
        >
          <Link
            href={`/concerts/${story.slug}`}
            className="bg-surface-secondary relative min-h-44 overflow-hidden"
            aria-label={`Lire l’histoire de ${story.name}`}
          >
            {story.image ? (
              <Image
                src={story.image}
                alt={`Image de ${story.name}`}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                sizes="(max-width: 640px) 100vw, 180px"
              />
            ) : (
              <span className="text-muted flex h-full items-center justify-center">
                <IoImageOutline className="size-10" aria-hidden="true" />
              </span>
            )}
          </Link>
          <div className="flex flex-col p-5">
            <span className="text-primary text-xs font-semibold tracking-[0.16em] uppercase">
              {new Date(story.date).getFullYear()}
            </span>
            <h3 className="text-foreground mt-2 line-clamp-2 text-lg font-bold">
              {story.name} {story.subName || ""}
            </h3>
            {story.explanation && (
              <p className="text-muted mt-3 line-clamp-3 grow text-sm">
                {story.explanation}
              </p>
            )}
            <LinkButton
              variant="ghost"
              size="sm"
              className="text-primary data-[hovered=true]:bg-primary/20 mt-4 w-fit"
              href={`/concerts/${story.slug}`}
            >
              Lire l’histoire
              <IoIosArrowRoundForward aria-hidden="true" />
            </LinkButton>
          </div>
        </article>
      ))}
    </div>
  );
};

export default ProjectViewer;
