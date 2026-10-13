import { NotInstalledError } from "@/hooks/useDocuments";
import type { SavedSetting } from "@/utils/siteSettings/server";
import type {
  SiteSettingKey,
  SiteSettings,
} from "@repo/domain/utils/siteSettings";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type { SavedSetting };

export type SiteSettingsData = {
  /** Every setting as the website shows it (the default for a key never saved). */
  settings: SiteSettings;
  saved: Partial<Record<SiteSettingKey, SavedSetting>>;
  /** Keys whose saved value no longer passes today's rules (the site shows the default). */
  invalid: SiteSettingKey[];
  /** Whether the signed-in admin may change each setting (the contact details: superadmins). */
  editable: Record<SiteSettingKey, boolean>;
};

/** A previous version of a setting, newest first; it was replaced at `changedAt`. */
export type SiteSettingRevision = {
  id: number | string;
  changedAt: string;
  changedBy: string | null;
  value: SiteSettings[SiteSettingKey];
};

/**
 * A refused request: the server's sentence, its HTTP status and, for a value
 * the rules refuse (400), the field it is about (`email`, `links.instagram`,
 * `tiers.2.amount`…).
 */
export class SiteSettingError extends Error {
  status: number;
  field?: string;

  constructor(message: string, status: number, field?: string) {
    super(message);
    this.name = "SiteSettingError";
    this.status = status;
    this.field = field;
  }
}

const KEY = ["site-settings"];
const BASE = "/api/site-settings";

async function send<T>(
  url: string,
  method: string,
  body?: unknown,
): Promise<T> {
  const response = await fetch(url, {
    method,
    headers:
      body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (json?.notInstalled) throw new NotInstalledError(json.error);
    throw new SiteSettingError(
      json?.error || `Erreur ${response.status}`,
      response.status,
      typeof json?.field === "string" ? json.field : undefined,
    );
  }
  return json as T;
}

const retryUnlessNotInstalled = (count: number, error: unknown) =>
  !(error instanceof NotInstalledError) && count < 2;

export function useSiteSettings() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => send<SiteSettingsData>(BASE, "GET"),
    retry: retryUnlessNotInstalled,
  });
}

/**
 * Saves one setting (PUT `{ value }`). A successful save refreshes the
 * settings and every history already loaded.
 */
export function useSaveSiteSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      key,
      value,
    }: {
      key: SiteSettingKey;
      value: SiteSettings[SiteSettingKey];
    }) => send<unknown>(`${BASE}/${key}`, "PUT", { value }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

/** The previous versions of one setting; nothing is fetched until `enabled`. */
export function useSiteSettingRevisions(key: SiteSettingKey, enabled: boolean) {
  return useQuery({
    queryKey: [...KEY, "revisions", key],
    queryFn: () =>
      send<SiteSettingRevision[]>(`${BASE}/${key}/revisions`, "GET"),
    enabled,
    retry: retryUnlessNotInstalled,
  });
}
