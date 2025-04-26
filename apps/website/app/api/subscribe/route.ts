import { addGroupMember } from "@/lib/googleApi";
import { NextResponse } from "next/server";
// const addEmailToGroupIfNotExists = async (email: string): Promise<void> => {

//     const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
//     const clientId = process.env.GOOGLE_CLIENT_ID;
//     const auth_uri = "https://accounts.google.com/o/oauth2/auth";
//     const redirectUri = "https://developers.google.com/oauthplayground";
//     const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
//     const authClient = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

//     authClient.setCredentials({ refresh_token: refreshToken });

//     // const authClient: OAuth2Client = await auth.getClient();
//     const admin = google.admin('directory_v1');
//     google.options({ auth: authClient });

//     const groupKey = 'btnewsletter@googlegroups.com';

//     try {

//         await admin.members.get({
//             groupKey: groupKey,
//             memberKey: email,
//         });
//         const res = await admin.members.list({
//             groupKey,
//         });
//         const members = res.data.members || [];

//     } catch (error) {
//         if (error instanceof Error && 'response' in error && error.response) {
//             // Email is not a member, so add it
//             const res = await admin.members.insert({
//                 groupKey: groupKey,
//                 requestBody: {
//                     email: email,
//                     role: 'MEMBER',
//                 },
//             });
//         } else {
//             // Handle other errors
//             console.error('Error checking or adding member:', error);
//             throw error;
//         }
//     }
// };

// async function parseRequestBody(request: NextRequest): Promise<string> {
//     const email = await request.json();
//     return email as string;
// }

export async function POST() {
  const groupEmail = process.env.GOOGLE_GROUP_EMAIL!;
  // const email = await parseRequestBody(req);
  const email = "thomas-moser@orange.fr";

  try {
    await addGroupMember(groupEmail, email);
    return NextResponse.json({ message: "Subscribed successfully!" });
  } catch (error) {
    return NextResponse.json({ message: "Failed to subscribe", error });
  }
}
