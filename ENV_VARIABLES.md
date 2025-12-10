# Environment Variables Documentation

This document lists all environment variables required for both the **admin** and **website** projects.

## Admin Project (`apps/admin`)

### Required Variables

#### Supabase Configuration

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous/public key (safe to expose)
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (⚠️ SECRET - for admin operations)

#### Cloudinary Configuration

- `CLOUDINARY_CLOUD_NAME` - Your Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_API_SECRET` - Cloudinary API secret (⚠️ SECRET)

#### Application URLs

- `NEXT_PUBLIC_WEBSITE_URL` - Public URL of the website project (for preview and migration)
  - Development: `http://localhost:3000`
  - Production: `https://www.lebontemperament.com`
- `NEXT_PUBLIC_SITE_URL` - Public URL of the admin application (for redirects)
  - Development: `http://localhost:3002`
  - Production: `https://admin.lebontemperament.com` (or your admin domain)

### Optional Variables

#### Excel/CSV Integration

- `NEXT_EXCEL_CSV_URL` - URL to Google Sheets CSV export or CSV endpoint (for member sync)
- `EXCEL_CSV_URL` - Alternative CSV URL (fallback)

#### Deployment

- `VERCEL_ENV` - Vercel environment (automatically set by Vercel: `production`, `preview`, `development`)

---

## Website Project (`apps/website`)

### Required Variables

#### Supabase Configuration

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous/public key (safe to expose)
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (⚠️ SECRET - for admin operations)

#### Cloudinary Configuration

- `CLOUDINARY_CLOUD_NAME` - Your Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_API_SECRET` - Cloudinary API secret (⚠️ SECRET)

#### Application URLs

- `NEXT_PUBLIC_BASE_URL` - Base URL of the website (for SEO, sitemap, canonical URLs)
  - Development: `http://localhost:3000`
  - Production: `https://www.lebontemperament.com`
- `NEXT_PUBLIC_ADMIN_URL` - Admin application URL (for CSP frame-ancestors)
  - Development: `http://localhost:3002`
  - Production: `https://admin.lebontemperament.com` (or your admin domain)

#### Google Services (Required for Google Drive/Calendar features)

- `GOOGLE_CLIENT_ID` - Google OAuth Client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth Client Secret (⚠️ SECRET)
- `GOOGLE_REDIRECT_URI` - Google OAuth Redirect URI
- `GOOGLE_REFRESH_TOKEN` - Google OAuth Refresh Token (⚠️ SECRET)
- `GOOGLE_GROUP_EMAIL` - Google Group email for newsletter subscriptions

### Optional Variables

#### Google Services (Optional)

- `NEXT_PUBLIC_GOOGLE_CALENDAR_API_KEY` - Google Calendar API key (for calendar display)
- `NEXT_PUBLIC_GOOGLE_CALENDAR_ID` - Google Calendar ID (format: `calendar-id@group.calendar.google.com`)
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Google Maps API key (for maps display)
- `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID` - Google Maps Map ID (optional, required for AdvancedMarkerElement. If not provided, falls back to regular markers)
- `GOOGLE_SITE_VERIFICATION` - Google Search Console verification code

#### Google Drive Folder IDs (Optional - for FileExplorer)

- `NEXT_PUBLIC_GDRIVE_ADULTES_FOLDER` - Google Drive folder ID for adultes group
- `NEXT_PUBLIC_GDRIVE_JEUNES_FOLDER` - Google Drive folder ID for jeunes group
- `NEXT_PUBLIC_GDRIVE_ENFANTS_FOLDER` - Google Drive folder ID for enfants group
- `NEXT_PUBLIC_GDRIVE_ORCHESTRE_FOLDER` - Google Drive folder ID for orchestre group

#### Stripe Configuration (Optional - for payments)

- `STRIPE_SECRET_KEY` - Stripe secret key (⚠️ SECRET)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key (safe to expose)

#### reCAPTCHA Configuration (Optional - for contact form)

- `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` - reCAPTCHA site key
- `RECAPTCHA_SECRET_KEY` - reCAPTCHA secret key (⚠️ SECRET)

#### Email Configuration (Optional - for contact form)

- `NEXT_PUBLIC_BURNER_USERNAME` - Burner email service username
- `NEXT_PUBLIC_BURNER_PASSWORD` - Burner email service password

#### Node Environment

- `NODE_ENV` - Automatically set by Next.js (`development`, `production`, `test`)

---

## Quick Setup

### For Admin Project:

1. Copy the template below to `apps/admin/.env.local`
2. Fill in your Supabase and Cloudinary credentials
3. Set the website URL for preview functionality

### For Website Project:

1. Copy the template below to `apps/website/.env.local`
2. Fill in your Supabase and Cloudinary credentials
3. Configure Google services if using Drive/Calendar features
4. Add optional services (Stripe, reCAPTCHA, etc.) as needed

---

## Security Notes

⚠️ **Never commit `.env.local` files to version control**

Variables marked with `NEXT_PUBLIC_` are exposed to the browser and should not contain secrets.

Variables marked with ⚠️ SECRET should never be exposed in client-side code or committed to version control.
