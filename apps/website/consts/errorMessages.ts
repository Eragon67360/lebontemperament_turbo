export const ERROR_CODES = {
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  UNAUTHORIZED: "UNAUTHORIZED",
  PROFILE_NOT_FOUND: "PROFILE_NOT_FOUND",
  SIGNUP_DISABLED: "SIGNUP_DISABLED",
  ACCESS_DENIED: "ACCESS_DENIED",
  INACTIVE_ACCOUNT: "INACTIVE_ACCOUNT",
  AUTH_CALLBACK_ERROR: "AUTH_CALLBACK_ERROR",
  EMAIL_NOT_CONFIRMED: "EMAIL_NOT_CONFIRMED",
  GOOGLE_AUTH_ERROR: "GOOGLE_AUTH_ERROR",
  ACCOUNT_NOT_FOUND: "ACCOUNT_NOT_FOUND",
} as const;

export const ERROR_MESSAGES = {
  [ERROR_CODES.INVALID_CREDENTIALS]: "Email ou mot de passe éronné",
  [ERROR_CODES.UNAUTHORIZED]: "Accès non autorisé",
  [ERROR_CODES.PROFILE_NOT_FOUND]: "Profil non trouvé",
  [ERROR_CODES.SIGNUP_DISABLED]:
    "Les inscriptions sont désactivées pour le moment",
  [ERROR_CODES.ACCESS_DENIED]: "L'accès a été refusé",
  [ERROR_CODES.INACTIVE_ACCOUNT]:
    "Votre compte n'est pas actif ou n'existe pas",
  [ERROR_CODES.AUTH_CALLBACK_ERROR]:
    "Une erreur est survenue lors de l'authentification",
  [ERROR_CODES.EMAIL_NOT_CONFIRMED]: "Veuillez confirmer votre email",
  [ERROR_CODES.GOOGLE_AUTH_ERROR]: "Erreur lors de la connexion avec Google",
  [ERROR_CODES.ACCOUNT_NOT_FOUND]: "Aucun compte n'existe avec cet email",
} as const;

// Type pour les codes d'erreur
export type ErrorCode = keyof typeof ERROR_CODES;

// Fonction utilitaire pour obtenir le message d'erreur
export const getErrorMessage = (code: ErrorCode | string): string => {
  return (
    ERROR_MESSAGES[code as ErrorCode] || "Une erreur inattendue est survenue"
  );
};
