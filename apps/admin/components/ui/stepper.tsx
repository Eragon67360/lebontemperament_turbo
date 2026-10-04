import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import * as React from "react";

export type StepState = "todo" | "current" | "done";

export type Step = {
  /** Plain verb, e.g. « Vérifier ». */
  label: string;
  /** One line on what happens in this step. */
  description?: string;
  /** Explicit state; otherwise derived from `current`. */
  state?: StepState;
};

export interface StepperProps extends React.HTMLAttributes<HTMLOListElement> {
  steps: Step[];
  /** Index of the current step (0-based) when steps carry no `state`. */
  current?: number;
  /** Accessible name of the list, e.g. « Les trois étapes de la synchronisation ». */
  "aria-label": string;
}

function stateOf(step: Step, index: number, current: number): StepState {
  if (step.state) return step.state;
  if (index < current) return "done";
  if (index === current) return "current";
  return "todo";
}

/**
 * The three-step reading of a risky job (Vérifier · Choisir · Appliquer):
 * numbered cards, the current one tinted teal, done ones ticked. Stacks on
 * phones.
 */
export const Stepper = React.forwardRef<HTMLOListElement, StepperProps>(
  ({ steps, current = 0, className, ...props }, ref) => (
    <ol
      ref={ref}
      className={cn(
        "grid gap-3 md:grid-flow-col md:auto-cols-fr",
        className,
      )}
      {...props}
    >
      {steps.map((step, index) => {
        const state = stateOf(step, index, current);
        return (
          <li
            key={`${step.label}-${index}`}
            aria-current={state === "current" ? "step" : undefined}
            data-state={state}
            className={cn(
              "flex items-start gap-3 rounded-md border border-border bg-card px-3.5 py-3",
              state === "current" && "border-primary-soft-border bg-primary-soft",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "grid size-7 shrink-0 place-items-center rounded-full text-sm font-semibold",
                state === "todo" && "bg-muted text-muted-foreground",
                state === "current" && "bg-primary-strong text-primary-foreground",
                state === "done" && "bg-success-soft text-success-foreground",
              )}
            >
              {state === "done" ? (
                <Check className="size-4" strokeWidth={3} />
              ) : (
                index + 1
              )}
            </span>
            <div className="min-w-0">
              <p className="text-[15px] leading-5 font-medium text-foreground">
                <span className="sr-only">
                  {state === "done"
                    ? "Étape terminée : "
                    : state === "current"
                      ? "Étape en cours : "
                      : "Étape à venir : "}
                </span>
                {step.label}
              </p>
              {step.description && (
                <p className="mt-1 text-note text-muted-foreground">
                  {step.description}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  ),
);
Stepper.displayName = "Stepper";
