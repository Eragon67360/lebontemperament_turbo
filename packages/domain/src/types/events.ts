export type Event = {
  id: string;
  title: string;
  date_from: string;
  date_to?: string | null;
  time: string;
  location: string;
  responsible_name: string;
  responsible_email?: string | null;
  event_type: "concert" | "vente" | "repetition" | "sejour" | "autre";
  description?: string | null;
  created_at: string;
  updated_at: string;
  link?: string | null;
  is_public: boolean;
};

export type CreateEventDTO = Omit<Event, "id" | "created_at" | "updated_at">;
export type UpdateEventDTO = Partial<CreateEventDTO> & { id: string };

/** A file attached to an event (public.event_documents): PDF, Word or Excel. */
export type EventDocument = {
  id: string;
  event_id: string;
  /** What members read on the button: « Bulletin de réservation ». */
  label: string;
  file_name: string;
  storage_key: string;
  mime_type: string;
  size_bytes: number | null;
  sort_order: number;
  created_at: string;
};

/** An event file as the website and the app show it. */
export type EventDocumentLink = {
  id: string;
  label: string;
  /** « PDF », « Word » or « Excel ». */
  kind: "PDF" | "Word" | "Excel";
  /** « 120 ko », or null when unknown. */
  size: string | null;
  url: string;
};

/** An event with its files, as the website's agenda and /api/events give it. */
export type EventWithDocuments = Event & { documents: EventDocumentLink[] };
