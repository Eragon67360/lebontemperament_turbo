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

// --- Events reserved for member groups ---------------------------------------
//
// An event can be reserved for groups (public.event_audiences, migration
// 20261123185221). Such an event never goes to a topic: anyone's app can
// subscribe to a topic, so a « ca » topic would let any phone hear the CA's
// meetings. It goes device by device (push_devices) to the members of its
// groups, read when the push is sent, so someone removed from a group stops
// hearing about it at once.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The group ids the trigger sent (`audience`), keeping only well-formed ids. */
export function audienceFromBody(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (v): v is string => typeof v === "string" && UUID.test(v),
  );
}

/**
 * The groups an event's push goes to: those the trigger saw and those the
 * event has now (`current`, null on DELETE: the rows went with the event).
 * Either one is enough to keep the push off the topics, so a push never
 * reaches every member because one of the two reads came back empty.
 */
export function eventGroupIds(
  fromTrigger: readonly string[],
  current: readonly string[] | null,
): string[] {
  return [...new Set([...fromTrigger, ...(current ?? [])])].sort();
}

/** « Conseil d'administration · Nouvel événement ». */
export function groupPushTitle(
  groupNames: readonly string[],
  title: string,
): string {
  const names = [...groupNames]
    .filter((n) => n.trim().length > 0)
    .sort((a, b) => a.localeCompare(b, "fr"));
  return names.length > 0 ? `${names.join(", ")} · ${title}` : title;
}

export interface GroupPush {
  token: string;
  title: string;
}

/**
 * One push per device of a member of the event's groups, titled with the
 * groups of the audience that member is in. A device appears once even when
 * its member is in several of the groups.
 */
export function planGroupPushes(input: {
  groupIds: readonly string[];
  groupNames: Readonly<Record<string, string>>;
  memberships: readonly { group_id: string; profile_id: string }[];
  devices: readonly { token: string; user_id: string }[];
  title: string;
}): GroupPush[] {
  const audience = new Set(input.groupIds);
  const groupsOf = new Map<string, Set<string>>();
  for (const m of input.memberships) {
    if (!audience.has(m.group_id)) continue;
    const set = groupsOf.get(m.profile_id) ?? new Set<string>();
    set.add(m.group_id);
    groupsOf.set(m.profile_id, set);
  }
  const seen = new Set<string>();
  const pushes: GroupPush[] = [];
  for (const d of input.devices) {
    const groups = groupsOf.get(d.user_id);
    if (!groups || seen.has(d.token)) continue;
    seen.add(d.token);
    pushes.push({
      token: d.token,
      title: groupPushTitle(
        [...groups].map((g) => input.groupNames[g] ?? ""),
        input.title,
      ),
    });
  }
  return pushes;
}
