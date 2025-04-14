export const handleSupabaseError = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    return error.message as string;
  }
  if (typeof error === "string") return error;
  return "Une erreur inattendue s'est produite";
};
