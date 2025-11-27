import { CreateEventDTO, Event, UpdateEventDTO } from "@/types/events";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Fetch events
export function useEvents() {
  return useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const response = await fetch("/api/events");
      if (!response.ok) throw new Error("Failed to fetch events");
      return response.json() as Promise<Event[]>;
    },
  });
}

// Create event mutation
export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateEventDTO) => {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create event");
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch events
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

// Update event mutation
export function useUpdateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateEventDTO) => {
      const response = await fetch("/api/events", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update event");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

// Delete event mutation
export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch("/api/events", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete event");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}
