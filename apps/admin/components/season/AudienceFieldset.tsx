"use client";

import { GroupTile } from "@/components/groups/GroupIcon";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField, FormItem, FormMessage } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import type { EventFormValues } from "@/utils/formSchemas";
import type { GroupSummary } from "@/utils/groups/types";
import {
  audiencePeopleCount,
  audienceSentence,
  groupMemberCountLabel,
} from "@repo/domain/utils/memberGroups";
import { Lock, Users } from "lucide-react";
import { useMemo } from "react";
import { useWatch, type UseFormReturn } from "react-hook-form";

export const AUDIENCE_IDS = {
  mode: "event-audience-mode",
  groups: "event-audience",
};

const MODES = [
  {
    value: "all",
    label: "Tous les membres",
    hint: "L'agenda de chacun, sur le site et dans l'application.",
    icon: Users,
  },
  {
    value: "groups",
    label: "Certains groupes",
    hint: "Le CA, une commission… : les autres membres ne le voient pas.",
    icon: Lock,
  },
] as const;

/**
 * « Pour qui ? » of the event dialog: every member, or only the members of
 * the groups ticked (and the admins). The sentence under it says who will
 * see the event and get the notification; a group event is never public.
 */
export function AudienceFieldset({
  form,
  groups,
}: {
  form: UseFormReturn<EventFormValues>;
  /** The groups offered: the live ones, and archived ones the event already has. */
  groups: readonly GroupSummary[];
}) {
  const mode =
    useWatch({ control: form.control, name: "audience_mode" }) ?? "all";
  const picked = useWatch({ control: form.control, name: "audience" });
  const selected = useMemo(() => picked ?? [], [picked]);

  const sentence = useMemo(() => {
    if (mode !== "groups" || selected.length === 0) {
      return mode === "groups" ? null : audienceSentence(0, []);
    }
    const byId = new Map(groups.map((g) => [g.id, g]));
    const names = selected
      .map((id) => byId.get(id)?.name)
      .filter((name): name is string => !!name);
    const memberIds = Object.fromEntries(
      groups.map((g) => [g.id, g.member_ids]),
    );
    return audienceSentence(audiencePeopleCount(selected, memberIds), names);
  }, [mode, selected, groups]);

  const setMode = (value: "all" | "groups") => {
    form.setValue("audience_mode", value, { shouldDirty: true });
    // A group event is never on the public site.
    if (value === "groups") {
      form.setValue("is_public", false, { shouldDirty: true });
    }
  };

  return (
    <fieldset className="space-y-3">
      <legend className="text-[17px] leading-6 font-semibold">
        Pour qui ?
      </legend>

      <div
        role="radiogroup"
        aria-label="Pour qui ?"
        id={AUDIENCE_IDS.mode}
        className="grid gap-2 sm:grid-cols-2"
      >
        {MODES.map((option) => {
          const checked = mode === option.value;
          const Icon = option.icon;
          const inputId = `${AUDIENCE_IDS.mode}-${option.value}`;
          return (
            <label
              key={option.value}
              htmlFor={inputId}
              className={cn(
                "border-border has-focus-visible:outline-ring flex cursor-pointer items-start gap-3 rounded-md border p-3 has-focus-visible:outline-2 has-focus-visible:outline-offset-2",
                checked
                  ? "border-primary-strong bg-primary-soft"
                  : "hover:bg-accent",
              )}
            >
              <input
                id={inputId}
                type="radio"
                name="event-audience-mode"
                value={option.value}
                checked={checked}
                onChange={() => setMode(option.value)}
                className="sr-only"
              />
              <Icon
                aria-hidden
                className={cn(
                  "mt-0.5 size-5 shrink-0",
                  checked ? "text-primary-text" : "text-muted-foreground",
                )}
              />
              <span className="min-w-0 space-y-0.5">
                <span className="block font-medium">{option.label}</span>
                <span className="text-note text-muted-foreground block">
                  {option.hint}
                </span>
              </span>
            </label>
          );
        })}
      </div>

      {mode === "groups" && (
        <FormField
          control={form.control}
          name="audience"
          render={({ field }) => {
            const value = field.value ?? [];
            const toggle = (id: string, on: boolean) =>
              field.onChange(
                on ? [...value, id] : value.filter((v) => v !== id),
              );
            return (
              <FormItem>
                <fieldset id={AUDIENCE_IDS.groups} tabIndex={-1}>
                  <legend className="sr-only">Groupes</legend>
                  {groups.length === 0 ? (
                    <p className="text-detail text-muted-foreground">
                      Aucun groupe n&apos;existe encore : un
                      super-administrateur les crée dans « Groupes ».
                    </p>
                  ) : (
                    <ul className="border-border divide-border divide-y rounded-md border">
                      {groups.map((group) => {
                        const checkboxId = `${AUDIENCE_IDS.groups}-${group.id}`;
                        return (
                          <li key={group.id}>
                            <label
                              htmlFor={checkboxId}
                              className="hover:bg-muted/60 flex min-h-12 cursor-pointer items-center gap-3 px-3 py-2"
                            >
                              <Checkbox
                                id={checkboxId}
                                checked={value.includes(group.id)}
                                onCheckedChange={(on) =>
                                  toggle(group.id, on === true)
                                }
                                ref={
                                  value[0] === group.id ? field.ref : undefined
                                }
                              />
                              <GroupTile
                                icon={group.icon}
                                color={group.color}
                                className="size-8 rounded-md [&>svg]:size-4"
                              />
                              <span className="min-w-0 flex-1">
                                <span className="block truncate font-medium">
                                  {group.name}
                                  {group.archived_at && (
                                    <span className="text-muted-foreground font-normal">
                                      {" "}
                                      (archivé)
                                    </span>
                                  )}
                                </span>
                              </span>
                              <span className="text-note text-muted-foreground shrink-0">
                                {groupMemberCountLabel(group.member_ids.length)}
                              </span>
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </fieldset>
                <FormMessage />
              </FormItem>
            );
          }}
        />
      )}

      {sentence && (
        <p
          aria-live="polite"
          className="text-detail bg-surface-sunken text-foreground rounded-md px-3 py-2.5"
        >
          {sentence}
        </p>
      )}
    </fieldset>
  );
}
