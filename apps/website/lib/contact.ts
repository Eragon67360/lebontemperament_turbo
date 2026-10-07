/**
 * The association's public contact details, the one source for every page,
 * the structured data and llms.txt (#329). There is deliberately no phone
 * number: people reach the association through this mailbox or the contact
 * form.
 */

/**
 * The association's public mailbox: shown on the site, receives the contact
 * forms and invitation requests. The sending-only address of the automatic
 * emails is never shown as a contact.
 */
export const CONTACT_EMAIL = "lebontemperament@gmail.com";

/** The page with the contact form. */
export const CONTACT_FORM_PATH = "/contact";

/** The association's registered office. */
export const CONTACT_ADDRESS = {
  street: "3 Rue Clemenceau",
  postalCode: "67700",
  city: "Saverne",
  region: "Alsace",
  country: "France",
  countryCode: "FR",
} as const;

/** The registered office on one line. */
export const CONTACT_ADDRESS_LINE = `${CONTACT_ADDRESS.street}, ${CONTACT_ADDRESS.postalCode} ${CONTACT_ADDRESS.city}, ${CONTACT_ADDRESS.country}`;

/**
 * Where people send personal-data requests (access, rectification, erasure,
 * objection, account deletion), as named in the privacy policy and the legal
 * notice: the main mailbox (owner decision, 2026-10-06, #329).
 */
export const PRIVACY_CONTACT_EMAIL = CONTACT_EMAIL;
