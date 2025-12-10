# Google Apps Script Setup Guide

This directory contains Google Apps Scripts for viewing Google Groups members.

## Script

### `Code.gs` - Read Group Members

This script allows you to:

- List all Google Groups
- Get members of a specific group

**Note:** This script is read-only and uses the `GroupsApp` API, which works with both Google Workspace and personal Gmail accounts (for groups you have access to).

## Deployment Steps

1. **Create a Google Apps Script Project:**
   - Go to [script.google.com](https://script.google.com)
   - Click "New Project"
   - Copy the contents of `Code.gs` into the editor

2. **Save and Authorize:**
   - Save the project
   - Run the script once to authorize it
   - Grant the necessary permissions when prompted

3. **Deploy as Web App:**
   - Click "Deploy" > "New deployment"
   - Click the gear icon next to "Select type" and choose "Web app"
   - Set:
     - **Execute as:** Me
     - **Who has access:** Anyone (or specific users if preferred)
   - Click "Deploy"
   - Copy the Web App URL

4. **Configure Environment Variable:**
   - Add `GOOGLE_APPS_SCRIPT_URL=<your-web-app-url>` to your `.env` file

## Usage

### List All Groups

```
GET /api/google-groups?action=list-groups
```

### Get Members of a Group

```
GET /api/google-groups?groupEmail=btnewsletter@googlegroups.com
```

## Response Format

**List Groups:**

```json
{
  "success": true,
  "message": "Groupes récupérés avec succès",
  "data": [
    {
      "email": "btnewsletter@googlegroups.com",
      "name": "btnewsletter@googlegroups.com",
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
  "data": ["[email protected]", "[email protected]"],
  "stats": {
    "total": 2,
    "groupEmail": "btnewsletter@googlegroups.com",
    "groupName": "btnewsletter@googlegroups.com",
    "description": null,
    "retrievedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

## Important Notes

- **Permissions:** The account running the script must have access to the groups you want to view
- **Logging:** Check the execution logs in Apps Script editor (View > Logs) for debugging
- **Read-Only:** This script only reads group information. It cannot add or remove members
