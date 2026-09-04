import type { Tables } from "@repo/domain/database.types";

export type Notification = Tables<"notifications"> & {
  reference_id?: string; // For linking to specific bug reports
};
