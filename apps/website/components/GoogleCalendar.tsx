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
  embedId: string;
}

const GoogleCalendar: React.FC<GoogleCalendarProps> = () => {
  return (
    <div className="bg-content1 rounded p-4 shadow">
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
            googleCalendarId: process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_ID,
            className: "gcal-event", // optional
          },
        ]}
      />
    </div>
  );
};

export default GoogleCalendar;
