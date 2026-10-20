import "server-only";

type TurnstileResult = {
  success?: boolean;
  action?: string;
};

export async function verifyTurnstileToken(token: string, expectedAction: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!secret) return;
  if (!token || token.length > 2048) {
    throw new Error("Complete the security check and submit again.");
  }

  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      cache: "no-store",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
    },
  );
  const result = (await response.json()) as TurnstileResult;

  if (!response.ok || !result.success || result.action !== expectedAction) {
    throw new Error("Security verification failed. Refresh and try again.");
  }
}
