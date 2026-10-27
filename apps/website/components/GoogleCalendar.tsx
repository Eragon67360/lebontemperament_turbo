"use client";
import googleCalendarPlugin from "@fullcalendar/google-calendar";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/react/daygrid";
import frLocale from "@fullcalendar/react/locales/fr";
import "@fullcalendar/react/skeleton.css";
import themePlugin from "@fullcalendar/react/themes/classic";
import "@fullcalendar/react/themes/classic/palette.css";
import "@fullcalendar/react/themes/classic/theme.css";
import React from "react";

interface GoogleCalendarProps {
  /** The public Google Calendar to show, by its id (usually an address). */
  embedId: string;
}

/**
 * A month of the association's Google Calendar. Inside the members area the
 * classic theme reads the « Les Pupitres » tokens (`.members-scope` in
 * globals.css), so the grid follows the page in both themes.
 */
const GoogleCalendar: React.FC<GoogleCalendarProps> = ({ embedId }) => {
  return (
    <div className="bg-members-card p-4">
      <FullCalendar
        plugins={[themePlugin, dayGridPlugin, googleCalendarPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth",
        }}
        locale={frLocale}
        googleCalendarApiKey={process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_API_KEY}
        eventSources={[
          {
            googleCalendarId: embedId,
            className: "gcal-event", // optional
          },
        ]}
      />
    </div>
  );
};

export default GoogleCalendar;
