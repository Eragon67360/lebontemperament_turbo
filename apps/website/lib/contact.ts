import { DEFAULT_SITE_SETTINGS } from "@repo/domain/utils/siteSettings";

/**
 * The association's public contact details (#329). The admin manages them
 * (public.site_settings, read by lib/siteSettings.ts); the constants below
 * are what the site showed before, now the fallback while the table can't be
 * read, plus the parts the admin doesn't manage. There is deliberately no
 * phone number outside the legal notice: people reach the association
 * through the mailbox or the contact form. Server code only: a client
 * component importing this module bundles the settings' defaults.
 */

/** The public mailbox by default (see getContactEmail for the live one). */
export const CONTACT_EMAIL = DEFAULT_SITE_SETTINGS.contact.email;

/** The page with the contact form. */
export const CONTACT_FORM_PATH = "/contact";

/**
 * The parts of the address the admin doesn't manage: the street, postal code
 * and city are the `contact` setting.
 */
export const CONTACT_ADDRESS = {
  region: "Alsace",
  country: "France",
  countryCode: "FR",
} as const;
