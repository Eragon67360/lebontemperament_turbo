// Code.gs

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

/**
 * Get all groups the user has access to
 */
function getAllGroups() {
  try {
    Logger.log("Fetching all groups...");
    const groups = GroupsApp.getGroups();
    Logger.log("Found " + groups.length + " groups");

    const groupsList = groups.map((group) => {
      const email = group.getEmail();
      Logger.log("Processing group: " + email);
      return {
        email: email,
        // getName() and getDescription() are not available in GroupsApp API
        // Using email as the name/identifier
        name: email,
        description: null,
      };
    });

    Logger.log("Successfully retrieved " + groupsList.length + " groups");
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
 * Main handler for GET requests
 */
function doGet(e) {
  try {
    Logger.log("doGet called with parameters: " + JSON.stringify(e.parameter));

    // Check if we want to list all groups
    const action = e.parameter.action;
    if (action === "list-groups") {
      Logger.log("Action: list-groups");
      return getAllGroups();
    }

    // Get groupEmail from query parameter or use default
    const groupEmail =
      e.parameter.groupEmail || "btnewsletter@googlegroups.com";
    Logger.log("Fetching members for group: " + groupEmail);

    // Get the group
    const group = GroupsApp.getGroupByEmail(groupEmail);

    if (!group) {
      Logger.log("Group not found: " + groupEmail);
      return jsonResponse(false, "Groupe non trouvé: " + groupEmail, []);
    }

    Logger.log("Group found, fetching users...");
    // Get all users
    const users = group.getUsers();
    Logger.log("Found " + users.length + " users in group");

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
