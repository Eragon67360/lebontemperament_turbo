/**
 * The association's public mailbox: shown on the site, receives the contact
 * forms and invitation requests.
 */
export const CONTACT_EMAIL = "lebontemperament@gmail.com";

/**
 * Where people send personal-data requests (access, rectification, erasure,
 * objection, account deletion), as named in the privacy policy and the legal
 * notice.
 *
 * TODO(owner): owner decision 11 (#369) is still open — confirm which mailbox
 * handles privacy and deletion requests. Until then it is the public contact
 * address above.
 */
export const PRIVACY_CONTACT_EMAIL = CONTACT_EMAIL;
