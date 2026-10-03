import "server-only";

export type RecaptchaResult = "ok" | "failed" | "not-configured";

/** Verifies a reCAPTCHA token with Google (secret sent in the body, not the URL). */
export async function verifyRecaptcha(token: string): Promise<RecaptchaResult> {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) {
    console.error("RECAPTCHA_SECRET_KEY not found in environment variables");
    return "not-configured";
  }

  const response = await fetch(
    "https://www.google.com/recaptcha/api/siteverify",
    {
      method: "POST",
      body: new URLSearchParams({ secret, response: token }),
    },
  );
  const result = await response.json();

  if (!result?.success) {
    console.error("reCAPTCHA verification failed:", result?.["error-codes"]);
    return "failed";
  }
  return "ok";
}
