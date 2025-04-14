export type Event = {
  id: string;
  title: string;
  date_from: string;
  date_to?: string | null;
  time: string;
  location: string;
  responsible_name: string;
  responsible_email?: string | null;
  event_type: "concert" | "vente" | "repetition" | "autre";
  description?: string | null;
  created_at: string;
  updated_at: string;
  link?: string | null;
  is_public: boolean;
};

export type CreateEventDTO = Omit<Event, "id" | "created_at" | "updated_at">;
export type UpdateEventDTO = Partial<CreateEventDTO> & { id: string };
