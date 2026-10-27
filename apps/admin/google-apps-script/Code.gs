// Code.gs
//
// Reads Google Groups for the website and the admin (README.md next to this
// file has the set-up). It answers only to requests whose `key` parameter is
// the Script Property LBT_SCRIPT_KEY (the sites send GOOGLE_APPS_SCRIPT_KEY),
// and only about the groups listed in the Script Property LBT_ALLOWED_GROUPS
// (comma-separated). Anything else gets the same short refusal.

/** A shorter LBT_SCRIPT_KEY counts as not set: every request is refused. */
const MIN_KEY_LENGTH = 32;

/**
 * Helper function to create a JSON response
 */
function jsonResponse(success, message, data, stats = null) {
  const response = {
    success: success,
    message: message,
    data: data || [],
    stats: stats,
  };

  return ContentService.createTextOutput(JSON.stringify(response)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

/** The one answer to a request without the right key or about another group. */
function refusal_() {
  return jsonResponse(false, "Accès refusé", []);
}

/** A Script Property without surrounding spaces; "" when it isn't set. */
function scriptProperty_(name) {
  const value = PropertiesService.getScriptProperties().getProperty(name);
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Whether `provided` is LBT_SCRIPT_KEY. The loop always runs over the whole
 * stored key, whatever the request holds, so the time it takes doesn't depend
 * on where the first difference is. (Past the end of `provided`, charCodeAt
 * gives NaN, which `^` treats as 0; the length check has already failed.)
 */
function hasScriptKey_(provided) {
  let expected;
  try {
    expected = scriptProperty_("LBT_SCRIPT_KEY");
  } catch (err) {
    Logger.log("LBT_SCRIPT_KEY could not be read: " + err);
    return false;
  }
  if (expected.length < MIN_KEY_LENGTH) {
    Logger.log(
      "LBT_SCRIPT_KEY is not set, or shorter than " +
        MIN_KEY_LENGTH +
        " characters: every request is refused.",
    );
    return false;
  }
  if (typeof provided !== "string") {
    return false;
  }

  let difference = provided.length ^ expected.length;
  for (let i = 0; i < expected.length; i++) {
    difference |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return difference === 0;
}

/** A group address as compared: trimmed and lower-case ("" if not a string). */
function normalizeEmail_(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

/** The groups this script may read, from LBT_ALLOWED_GROUPS. */
function allowedGroups_() {
  return scriptProperty_("LBT_ALLOWED_GROUPS")
    .split(",")
    .map(normalizeEmail_)
    .filter((email) => email !== "");
}

/**
 * The groups the account sees that LBT_ALLOWED_GROUPS lists
 */
function getAllGroups() {
  try {
    const allowed = allowedGroups_();
    const groupsList = GroupsApp.getGroups()
      .map((group) => group.getEmail())
      .filter((email) => allowed.includes(normalizeEmail_(email)))
      .map((email) => ({
        email: email,
        // getName() and getDescription() are not available in GroupsApp API
        // Using email as the name/identifier
        name: email,
        description: null,
      }));

    Logger.log("Listed " + groupsList.length + " allowed groups");
    return jsonResponse(true, "Groupes récupérés avec succès", groupsList, {
      total: groupsList.length,
      retrievedAt: new Date().toISOString(),
    });
  } catch (err) {
    Logger.log("Error in getAllGroups: " + err.toString());
    return jsonResponse(false, err.toString(), []);
  }
}

/**
 * Main handler for GET requests: `key`, then either `action=list-groups` or
 * `groupEmail` (a group from LBT_ALLOWED_GROUPS). The parameters are never
 * logged: they hold the key.
 */
function doGet(e) {
  const params = (e && e.parameter) || {};
  if (!hasScriptKey_(params.key)) {
    Logger.log("Refused: missing or wrong key");
    return refusal_();
  }

  try {
    if (params.action === "list-groups") {
      Logger.log("Action: list-groups");
      return getAllGroups();
    }

    const groupEmail = normalizeEmail_(params.groupEmail);
    if (!groupEmail || !allowedGroups_().includes(groupEmail)) {
      Logger.log(
        "Refused: group not in LBT_ALLOWED_GROUPS: " + (groupEmail || "(none)"),
      );
      return refusal_();
    }
    Logger.log("Fetching members for group: " + groupEmail);

    // Get the group
    const group = GroupsApp.getGroupByEmail(groupEmail);

    if (!group) {
      Logger.log("Group not found: " + groupEmail);
      return jsonResponse(false, "Groupe non trouvé: " + groupEmail, []);
    }

    // Get all users
    const users = group.getUsers();

    // Extract emails
    const members = users.map((user) => user.getEmail());

    // Additional statistics
    // Note: getName() and getDescription() are not available in GroupsApp API
    const stats = {
      total: members.length,
      groupEmail: groupEmail,
      groupName: groupEmail, // Using email as name since getName() doesn't exist
      description: null, // getDescription() is not available
      retrievedAt: new Date().toISOString(),
    };

    Logger.log("Successfully retrieved " + members.length + " members");
    return jsonResponse(true, "Membres récupérés avec succès", members, stats);
  } catch (err) {
    Logger.log("Error in doGet: " + err.toString());
    Logger.log("Stack trace: " + err.stack);
    return jsonResponse(false, err.toString(), []);
  }
}
