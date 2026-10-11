// Who receives a push sent by the database trigger.
//
// Apps up to 2.0.142 listen to the `all_users` topic and receive everything.
// Later apps leave it for `members` (events, concerts) plus one topic per
// rehearsal group concerning the member (`rehearsals_femmes`…), so a woman
// who picked « Femmes » no longer hears about the men's rehearsals. Every push
// goes out as ONE message with a condition naming both kinds of topics: FCM
// delivers it once to each device matching it, however many of its topics
// that device listens to, so no phone gets it twice.

export const ALL_USERS_TOPIC = "all_users";
export const MEMBERS_TOPIC = "members";

/** The rehearsal groups as the database stores them, and the topic suffix the
 * app uses for each (the Dart enum's name: GroupType in rehearsal.dart). */
const GROUP_TOPICS: Record<string, string> = {
  Orchestre: "rehearsals_orchestre",
  Hommes: "rehearsals_hommes",
  Femmes: "rehearsals_femmes",
  "Jeunes/Enfants": "rehearsals_jeunesEnfants",
  "Choeur complet": "rehearsals_choeurComplet",
  Tous: "rehearsals_tous",
};

export function rehearsalGroupTopic(group: unknown): string | null {
  return typeof group === "string" ? (GROUP_TOPICS[group] ?? null) : null;
}

function anyOf(topics: string[]): string {
  return topics.map((t) => `'${t}' in topics`).join(" || ");
}

/**
 * The FCM condition for a change on [table]. A rehearsal reaches the members
 * of its group, and on a change of group the members of the former one too
 * (their rehearsal moved away). A rehearsal whose group is unknown reaches
 * every member, as before.
 */
export function pushCondition(
  table: string,
  record: Record<string, unknown>,
  oldRecord?: Record<string, unknown> | null,
): string {
  if (table === "rehearsals") {
    const groups = [
      rehearsalGroupTopic(record.group_type),
      rehearsalGroupTopic(oldRecord?.group_type),
    ].filter((t): t is string => t !== null);
    if (groups.length > 0) {
      return anyOf([ALL_USERS_TOPIC, ...new Set(groups)]);
    }
  }
  return anyOf([ALL_USERS_TOPIC, MEMBERS_TOPIC]);
}
