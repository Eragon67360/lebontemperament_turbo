/**
 * « Télécharger mes données » (#354): everything the association's database
 * holds about the signed-in member, as one JSON document (RGPD articles 15
 * and 20).
 *
 * The only input is the member's own auth user, verified by the route from
 * their session: there is no parameter a caller could change to read someone
 * else. Every query below is filtered on that user's id (or on the ids of
 * their own bug reports), and memberData.test.ts fails if one is not.
 *
 * Left out on purpose: other people's data that sits next to the member's
 * (delivery recipients, the names and ids of the administrators who answered
 * a report, who changed their profile), and records matched only by an e-mail
 * address (donations, anniversary memories), which may belong to someone who
 * shares that address. Those are answered by e-mail on request.
 */
import type { SupabaseClient, User } from "@supabase/supabase-js";

/** Version of the export's shape, bumped whenever a section changes. */
export const MEMBER_DATA_EXPORT_VERSION = 1;

type Row = Record<string, unknown>;

/** One section of the export: its rows, or why they could not be read. */
export type ExportSection = Row[] | { erreur: string };

export type MemberDataExport = {
  export: {
    version: number;
    genere_le: string;
    association: string;
    contact: string;
    note: string;
  };
  compte: Row;
  profil: Row | null;
  appareils_notifications: ExportSection;
  notifications: ExportSection;
  signalements: ExportSection;
  messages_des_signalements: ExportSection;
  messages_envoyes_dans_d_autres_signalements: ExportSection;
  activite_dans_l_administration: ExportSection;
  activite_concernant_votre_profil: ExportSection;
  tournees_de_livraison_conduites: ExportSection;
  contenus_publies: {
    concerts: ExportSection;
    tournees: ExportSection;
    videos: ExportSection;
    comptes_rendus_du_ca: ExportSection;
    fichiers: ExportSection;
    synchronisations_drive: ExportSection;
  };
};

/** The auth user's own fields, never the tokens or internal flags. */
export function accountSection(user: User): Row {
  const metadata = user.user_metadata ?? {};
  return {
    id: user.id,
    email: user.email ?? null,
    telephone: user.phone || null,
    cree_le: user.created_at ?? null,
    email_confirme_le: user.email_confirmed_at ?? null,
    derniere_connexion: user.last_sign_in_at ?? null,
    modes_de_connexion: user.app_metadata?.providers ?? [],
    informations_du_fournisseur_de_connexion: {
      nom: metadata.full_name ?? metadata.name ?? null,
      nom_affiche: metadata.display_name ?? null,
      photo: metadata.avatar_url ?? metadata.picture ?? null,
    },
  };
}

type Query = PromiseLike<{ data: unknown; error: { message: string } | null }>;

async function rows(query: Query): Promise<ExportSection> {
  try {
    const { data, error } = await query;
    if (error) return { erreur: "Lecture impossible" };
    return Array.isArray(data) ? (data as Row[]) : [];
  } catch {
    return { erreur: "Lecture impossible" };
  }
}

const idsOf = (section: ExportSection): string[] =>
  Array.isArray(section)
    ? section.map((row) => String(row.id)).filter(Boolean)
    : [];

/**
 * Collects the member's data. `db` must be able to read every table (the
 * service role): several of them have no policy for members, and the
 * filtering is done here, on `user.id` only.
 */
export async function collectMemberData(
  db: SupabaseClient,
  user: User,
  contact: string,
  now: Date = new Date(),
): Promise<MemberDataExport> {
  const userId = user.id;

  const profileQuery = db
    .from("profiles")
    .select(
      "id, email, display_name, voice, role, address, home_phone, mobile_phone, profile_picture_url, created_at, updated_at",
    )
    .eq("id", userId)
    .maybeSingle();

  const [
    profile,
    devices,
    notifications,
    reports,
    sentElsewhere,
    activities,
    aboutMe,
    deliveries,
    concerts,
    tours,
    videos,
    cas,
    files,
    driveSyncs,
  ] = await Promise.all([
    (async () => {
      try {
        const { data, error } = await profileQuery;
        return error ? null : ((data as Row | null) ?? null);
      } catch {
        return null;
      }
    })(),
    // The phone's notification token itself is a technical secret of the
    // phone: the export says which phones, not the token.
    rows(
      db
        .from("push_devices")
        .select("platform, created_at, last_seen_at")
        .eq("user_id", userId)
        .order("created_at"),
    ),
    rows(
      db
        .from("notifications")
        .select("id, type, title, message, read, created_at")
        .eq("user_id", userId)
        .order("created_at"),
    ),
    rows(
      db
        .from("bug_reports")
        .select(
          "id, title, description, status, source, app_info, screenshot_paths, created_at, resolved_at",
        )
        .eq("reported_by", userId)
        .order("created_at"),
    ),
    rows(
      db
        .from("bug_messages")
        .select("bug_report_id, message, created_at")
        .eq("sender_id", userId)
        .order("created_at"),
    ),
    rows(
      db
        .from("activities")
        .select("type, title, description, target_id, created_at")
        .eq("user_id", userId)
        .order("created_at"),
    ),
    // Who made the change stays out: that is the administrator's data.
    rows(
      db
        .from("activities")
        .select("type, title, description, created_at")
        .eq("target_id", userId)
        .order("created_at"),
    ),
    rows(
      db
        .from("deliveries")
        .select(
          "id, scheduled_at, scheduled_end_at, is_tracking_active, latitude, longitude, is_delayed, delay_minutes, problem_message, created_at, updated_at",
        )
        .eq("driver_id", userId)
        .order("created_at"),
    ),
    rows(
      db
        .from("concerts")
        .select("id, name, date, created_at")
        .eq("created_by", userId)
        .order("created_at"),
    ),
    rows(
      db
        .from("tours")
        .select("id, name, start_date, created_at")
        .eq("created_by", userId)
        .order("created_at"),
    ),
    rows(
      db
        .from("youtube_links")
        .select("id, title, created_at")
        .eq("created_by", userId)
        .order("created_at"),
    ),
    rows(
      db
        .from("cas")
        .select("id, title, date_from, created_at")
        .eq("created_by", userId)
        .order("created_at"),
    ),
    rows(
      db
        .from("files")
        .select("id, original_name, created_at")
        .eq("uploaded_by", userId)
        .order("created_at"),
    ),
    rows(
      db
        .from("drive_sync_runs")
        .select("id, mode, status, started_at, finished_at")
        .eq("triggered_by", userId)
        .order("started_at"),
    ),
  ]);

  // The conversations of the member's own reports: what they wrote and what
  // the association answered, without the administrators' ids.
  const reportIds = idsOf(reports);
  const conversation: ExportSection =
    reportIds.length === 0
      ? []
      : await rows(
          db
            .from("bug_messages")
            .select("bug_report_id, sender_id, message, created_at")
            .in("bug_report_id", reportIds)
            .order("created_at"),
        );

  const messages: ExportSection = Array.isArray(conversation)
    ? conversation.map(({ sender_id, ...message }) => ({
        ...message,
        auteur: sender_id === userId ? "vous" : "l’association",
      }))
    : conversation;

  const reportIdSet = new Set(reportIds);
  const elsewhere: ExportSection = Array.isArray(sentElsewhere)
    ? sentElsewhere.filter(
        (message) => !reportIdSet.has(String(message.bug_report_id)),
      )
    : sentElsewhere;

  return {
    export: {
      version: MEMBER_DATA_EXPORT_VERSION,
      genere_le: now.toISOString(),
      association: "Le Bon Tempérament",
      contact,
      note: "Copie des données que la base de l’association contient sur votre compte. Les documents partagés (partitions, agenda) et le fichier des adhérents tenu par l’association n’y figurent pas : pour en obtenir une copie, ou pour faire corriger ou supprimer vos données, écrivez à l’adresse de contact.",
    },
    compte: accountSection(user),
    profil: profile,
    appareils_notifications: devices,
    notifications,
    signalements: reports,
    messages_des_signalements: messages,
    messages_envoyes_dans_d_autres_signalements: elsewhere,
    activite_dans_l_administration: activities,
    activite_concernant_votre_profil: aboutMe,
    tournees_de_livraison_conduites: deliveries,
    contenus_publies: {
      concerts,
      tournees: tours,
      videos,
      comptes_rendus_du_ca: cas,
      fichiers: files,
      synchronisations_drive: driveSyncs,
    },
  };
}

/** « mes-donnees-le-bon-temperament-2026-10-09.json » */
export function exportFileName(now: Date = new Date()): string {
  return `mes-donnees-le-bon-temperament-${now.toISOString().slice(0, 10)}.json`;
}
