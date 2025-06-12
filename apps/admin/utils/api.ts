// utils/api.ts
import { Rehearsal, CreateRehearsalDTO } from "@/types/rehearsals";

export const rehearsalAPI = {
  async getAll(): Promise<Rehearsal[]> {
    const response = await fetch("/api/rehearsals");
    if (!response.ok) throw new Error("Failed to fetch rehearsals");
    return response.json();
  },

  async getById(id: string): Promise<Rehearsal> {
    const response = await fetch(`/api/rehearsals/${id}`);
    if (!response.ok) throw new Error("Failed to fetch rehearsal");
    return response.json();
  },

  async create(rehearsal: CreateRehearsalDTO): Promise<Rehearsal> {
    const response = await fetch("/api/rehearsals", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(rehearsal),
    });
    if (!response.ok) throw new Error("Failed to create rehearsal");
    return response.json();
  },

  async update(
    id: string,
    rehearsal: Partial<CreateRehearsalDTO>,
  ): Promise<Rehearsal> {
    const response = await fetch(`/api/rehearsals/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(rehearsal),
    });
    if (!response.ok) throw new Error("Failed to update rehearsal");
    return response.json();
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`/api/rehearsals/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete rehearsal");
  },
};
