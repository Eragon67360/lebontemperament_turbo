export type FeatureFlag = {
  id: string;
  flag_key: string;
  flag_name: string;
  description: string | null;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
};

export type UpdateFeatureFlagDTO = {
  flag_key: string;
  is_enabled: boolean;
};
