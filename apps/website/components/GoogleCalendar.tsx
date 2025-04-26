"use client";
import React from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import googleCalendarPlugin from "@fullcalendar/google-calendar";

// Update CSS imports
// import '@fullcalendar/core/main.css';
// import '@fullcalendar/daygrid/main.css';

interface GoogleCalendarProps {
  embedId: string;
}

const GoogleCalendar: React.FC<GoogleCalendarProps> = () => {
  return (
    <div className="bg-white p-4 rounded shadow">
      <FullCalendar
        plugins={[dayGridPlugin, googleCalendarPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth",
        }}
        locale="fr" // If you want French localization
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
