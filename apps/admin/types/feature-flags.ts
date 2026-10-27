import type { Tables } from "@repo/domain/database.types";

export type FeatureFlag = Tables<"feature_flags">;

export type UpdateFeatureFlagDTO = {
  flag_key: string;
  is_enabled: boolean;
};
