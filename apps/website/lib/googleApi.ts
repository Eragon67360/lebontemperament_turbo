import { google } from "googleapis";

import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI,
);

oauth2Client.setCredentials({
  refresh_token: REFRESH_TOKEN,
});

const admin = google.admin({ version: "directory_v1", auth: oauth2Client });
const cloudidentity = google.cloudidentity("v1");

export async function getGroupInfo(groupEmail: string): Promise<unknown> {
  try {
    const res = await cloudidentity.groups.lookup({
      auth: oauth2Client,
      "groupKey.id": groupEmail,
    });
    return res.data;
  } catch (error) {
    console.error("Error retrieving group info:", error);
    throw error;
  }
}

/**
 * Retrieve all members of a Google Group.
 * @param groupEmail The email address of the Google Group.
 * @returns A list of group members.
 */
export async function getGroupMembers(groupEmail: string): Promise<unknown[]> {
  try {
    // First, look up the group by its email to get the group's unique ID.
    const groupLookupResponse = await cloudidentity.groups.lookup({
      auth: oauth2Client,
      "groupKey.id": groupEmail,
    });
    const groupId = groupLookupResponse.data.name;

    if (!groupId) {
      throw new Error("Group ID not found");
    }

    // List all members of the group.
    const membersResponse = await cloudidentity.groups.memberships.list({
      auth: oauth2Client,
      parent: groupId,
    });

    return membersResponse.data.memberships || [];
  } catch (error) {
    console.error("Error retrieving group members:", error);
    throw error;
  }
}

// export const getGroupMembers = async (groupEmail: string) => {
//     try {
//         const res = await cloudidentity.groups.lookup({
//           auth: oauth2Client,
//           groupKey: {
//             id: groupEmail,
//           },
//         });

//         return res.data.members;
//       } catch (error) {
//         console.error('Error retrieving group info:', error);
//         throw error;
//       }

// };

export const addGroupMember = async (groupEmail: string, email: string) => {
  try {
    const res = await admin.members.insert({
      groupKey: groupEmail,
      requestBody: {
        email: email,
        role: "MEMBER",
      },
    });
    return res.data;
  } catch (error) {
    console.error("Error adding member:", error);
    throw error;
  }
};
