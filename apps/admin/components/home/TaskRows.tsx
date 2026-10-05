"use client";

import { useShellDialogs } from "@/components/shell/ShellDialogs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { HomeTask, HomeTaskKey, HomeTaskTone } from "@/utils/home/tasks";
import {
  Cake,
  FolderSync,
  type LucideIcon,
  Mail,
  MessageSquareHeart,
} from "lucide-react";
import Link from "next/link";

const ICON: Record<HomeTaskKey, LucideIcon> = {
  "drive-sync": FolderSync,
  memories: MessageSquareHeart,
  messages: Mail,
  "campaign-sections": Cake,
};

const TONE: Record<HomeTaskTone, string> = {
  accent: "bg-primary-soft text-primary-text",
  warning: "bg-warning-soft text-warning",
  neutral: "bg-muted text-muted-foreground",
};

/**
 * The rows of « À faire »: icon, one-line title with the count, one-line
 * explanation, one action. Only the first row's button is the filled teal
 * one: it is the thing to do now.
 */
export function TaskRows({ tasks }: { tasks: HomeTask[] }) {
  const { openMessages } = useShellDialogs();

  return (
    <ol className="divide-border border-border -mx-4 divide-y border-t sm:-mx-6">
      {tasks.map((task, index) => {
        const Icon = ICON[task.key];
        const variant = index === 0 ? "default" : "outline";
        return (
          <li
            key={task.key}
            className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:gap-4 sm:px-6"
          >
            <span
              aria-hidden
              className={cn(
                "grid size-10 shrink-0 place-items-center rounded-md",
                TONE[task.tone],
              )}
            >
              <Icon className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-[15px] leading-5 font-medium">
                {task.title}
              </h3>
              <p className="text-detail text-muted-foreground mt-0.5">
                {task.explanation}
              </p>
            </div>
            {task.action.kind === "link" ? (
              <Button
                variant={variant}
                asChild
                className="w-full sm:w-auto sm:shrink-0"
              >
                <Link href={task.action.href}>
                  {task.action.label}
                  <span className="sr-only"> : {task.title}</span>
                </Link>
              </Button>
            ) : (
              <Button
                variant={variant}
                className="w-full sm:w-auto sm:shrink-0"
                onClick={openMessages}
              >
                {task.action.label}
                <span className="sr-only"> : {task.title}</span>
              </Button>
            )}
          </li>
        );
      })}
    </ol>
  );
}
