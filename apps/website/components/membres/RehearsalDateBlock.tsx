import { format } from "date-fns";
import { fr } from "date-fns/locale";

/**
 * The teal date block of a rehearsal: weekday, day number, month. `size`
 * « large » is the home page's next rehearsal (short words on a phone, full
 * words from 640 px), « small » the lists.
 */
export function RehearsalDateBlock({
  date,
  size = "large",
}: {
  date: Date;
  size?: "large" | "small";
}) {
  const large = size === "large";
  const label = format(date, "EEEE d MMMM", { locale: fr });
  const word = "text-sm font-medium uppercase sm:text-base";
  return (
    <div
      role="img"
      aria-label={label}
      className={`bg-primary-solid text-accent-foreground flex shrink-0 flex-col items-center text-center ${
        large
          ? "w-[84px] rounded-[14px] py-2.5 sm:w-32 sm:rounded-2xl sm:py-3.5"
          : "w-[72px] rounded-xl py-2"
      }`}
    >
      <span aria-hidden="true" className={word}>
        {large ? (
          <>
            <span className="sm:hidden">
              {format(date, "EEE", { locale: fr })}
            </span>
            <span className="hidden sm:inline">
              {format(date, "EEEE", { locale: fr })}
            </span>
          </>
        ) : (
          format(date, "EEE", { locale: fr })
        )}
      </span>
      <span
        aria-hidden="true"
        className={`leading-none font-semibold ${large ? "text-[38px] sm:text-5xl" : "text-[28px]"}`}
      >
        {format(date, "d", { locale: fr })}
      </span>
      <span aria-hidden="true" className={word}>
        {large ? (
          <>
            <span className="sm:hidden">
              {format(date, "MMM", { locale: fr })}
            </span>
            <span className="hidden sm:inline">
              {format(date, "MMMM", { locale: fr })}
            </span>
          </>
        ) : (
          format(date, "MMM", { locale: fr })
        )}
      </span>
    </div>
  );
}
