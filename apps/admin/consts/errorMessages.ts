export const ERROR_CODES = {
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  UNAUTHORIZED: "UNAUTHORIZED",
  PROFILE_NOT_FOUND: "PROFILE_NOT_FOUND",
} as const;

export const ERROR_MESSAGES = {
  [ERROR_CODES.INVALID_CREDENTIALS]: "Email ou mot de passe éronné",
  [ERROR_CODES.UNAUTHORIZED]: "Accès non autorisé",
  [ERROR_CODES.PROFILE_NOT_FOUND]: "Profil non trouvé",
} as const;
