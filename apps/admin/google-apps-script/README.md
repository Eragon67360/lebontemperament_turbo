# Google Apps Script Setup Guide

This directory contains the Google Apps Script that reads Google Groups for the sites: the website's newsletter sign-up (is the address already in the group?) and the admin's « Liste de diffusion » page and weekly comparison with the member roster.

## Script

### `Code.gs` - Read Group Members

This script:

- Lists the groups of the account that `LBT_ALLOWED_GROUPS` names (`action=list-groups`)
- Returns the members of one of those groups (`groupEmail=`)
- Answers only to requests whose `key` parameter is `LBT_SCRIPT_KEY` (compared in constant time). Anything else gets the same short refusal, with no detail.

**Note:** This script is read-only and uses the `GroupsApp` API, which works with both Google Workspace and personal Gmail accounts (for groups you have access to).

### Script Properties

Set them in the Apps Script editor: **Project Settings** (gear icon) › **Script Properties** › **Add script property**.

| Property             | Value                                                                                                                                                                                                                        |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `LBT_SCRIPT_KEY`     | A random key of at least 32 characters, for example the output of `openssl rand -hex 32`. The sites send the same value as `GOOGLE_APPS_SCRIPT_KEY`. While it is missing or shorter, the script refuses every request.       |
| `LBT_ALLOWED_GROUPS` | The groups the script may read, comma-separated (`newsletter@example.com,choir@example.com`): the website's newsletter group and every list the admin compares with the roster. Other groups are refused and are not listed. |

The key is kept in Proton Pass and in this Script Property only. It travels as a query parameter, because a web app's `doGet` can't read request headers: never log, paste or share a request URL that holds it.

## Deployment Steps

1. **Create a Google Apps Script Project** (first time only):
   - Go to [script.google.com](https://script.google.com)
   - Click "New Project"

2. **Paste and save the code:**
   - Replace the editor's content with `Code.gs`, then save

3. **Set the Script Properties** above.

4. **Authorize** (first time, or when Google asks again):
   - Run `doGet` once from the editor: without a request, its log says "Refused: missing or wrong key", as expected
   - Grant the necessary permissions when prompted

5. **Deploy as a new Web App:**
   - Click "Deploy" > "New deployment"
   - Click the gear icon next to "Select type" and choose "Web app"
   - Set:
     - **Execute as:** Me
     - **Who has access:** Anyone. The sites call the script from their servers, without a Google sign-in: the key is what restricts it.
   - Click "Deploy"
   - Copy the Web App URL. Each new deployment has its own URL.

6. **Give the sites the URL and the key** (on the owner's Mac, see [env/README.md](../../../env/README.md)):
   - In Proton Pass, put the new URL in the field `GOOGLE_APPS_SCRIPT_URL` reads, and the key in the field `GOOGLE_APPS_SCRIPT_KEY` reads. Both names belong in the templates of the sites that read Groups (`env/website.production.env`, `env/admin.production.env`). Change both together, so that the key only ever goes to the new deployment.
   - Push them (`npm run env:push -- production --apply --prod`), then deploy production: Vercel uses new values from the next build only ([DEPLOYMENT.md](../../../DEPLOYMENT.md)).

7. **Archive the previous deployment:**
   - Once the sites use the new URL (the admin's « Liste de diffusion » page shows the members), click "Deploy" > "Manage deployments", select the previous deployment and archive it. Until then, its URL keeps serving the previous version of the script.

To change the key later: set the new value in Proton Pass and push it, then change `LBT_SCRIPT_KEY` and deploy production straight away. Script Properties apply at once, so Groups reads fail until the new build is live.

## Requests

The sites build the request on their servers (`apps/website/lib/appsScript.ts`, `apps/admin/utils/google-groups/appsScript.ts`), never in a browser:

```
GET <web app URL>?key=<LBT_SCRIPT_KEY>&action=list-groups
GET <web app URL>?key=<LBT_SCRIPT_KEY>&groupEmail=newsletter@example.com
```

In the admin, signed-in admins reach them through `GET /api/google-groups?action=list-groups` and `GET /api/google-groups?groupEmail=newsletter@example.com`, which add the key on the server.

## Response Format

**List Groups:**

```json
{
  "success": true,
  "message": "Groupes récupérés avec succès",
  "data": [
    {
      "email": "newsletter@example.com",
      "name": "newsletter@example.com",
      "description": null
    }
  ],
  "stats": {
    "total": 1,
    "retrievedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Get Members:**

```json
{
  "success": true,
  "message": "Membres récupérés avec succès",
  "data": ["member@example.com", "other.member@example.com"],
  "stats": {
    "total": 2,
    "groupEmail": "newsletter@example.com",
    "groupName": "newsletter@example.com",
    "description": null,
    "retrievedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Refused** (missing or wrong key, a group outside `LBT_ALLOWED_GROUPS`, or no group named):

```json
{
  "success": false,
  "message": "Accès refusé",
  "data": [],
  "stats": null
}
```

## Important Notes

- **Permissions:** The account running the script must have access to the groups you want to view
- **Logging:** The editor's "Executions" page shows each request's log: what was read, or why it was refused. The request's parameters are never logged, since they hold the key.
- **Read-Only:** This script only reads group information. It cannot add or remove members
