const { google } = require('googleapis');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;

const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
);

oauth2Client.setCredentials({
    refresh_token: REFRESH_TOKEN,
});

async function getAccessToken() {
    try {
        const { token } = await oauth2Client.getAccessToken();
    } catch (error) {
        console.error('Error getting access token:', error.message);
    }
}

const groupssettings = google.groupssettings({
    version: 'v1',
    auth: oauth2Client,
});


async function getGroupSettings(groupEmail) {
    try {
        const res = await groupssettings.groups.get({
            groupUniqueId: groupEmail,
        });
    } catch (error) {
        console.error('Error fetching group settings:', error);
    }
}

getGroupSettings('CllgCKCGDcnWBJfwdVLGKMKwbnTxwGFJNZTXdLjPVQRxBDgXwbkddpPptgPdrJcJMWdqbfRxmQV');

getAccessToken();
