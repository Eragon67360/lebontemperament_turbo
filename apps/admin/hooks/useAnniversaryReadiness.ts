import type { Readiness, ReadinessFacts } from "@/utils/anniversary/readiness";
import { useQuery } from "@tanstack/react-query";

export type ReadinessResponse = Readiness & {
  facts: ReadinessFacts;
  generatedAt: string;
};

/** The publication checklist of the 40 ans page (read-only endpoint). */
export function useAnniversaryReadiness() {
  return useQuery({
    queryKey: ["anniversary", "readiness"],
    queryFn: async () => {
      const response = await fetch("/api/anniversary/readiness");
      if (!response.ok) throw new Error("Failed to fetch readiness");
      return response.json() as Promise<ReadinessResponse>;
    },
  });
}
