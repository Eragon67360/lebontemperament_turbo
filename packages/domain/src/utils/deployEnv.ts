/**
 * Which deployment this server is: "production" (www and admin), "preview"
 * (staging and test deployments), "development", or undefined for a local
 * `next dev` or `next build` with neither variable set.
 *
 * `APP_ENV` is set by the self-hosted deployments (Coolify, DEPLOYMENT.md);
 * `VERCEL_ENV` by Vercel. `APP_ENV` wins when both are set, so a self-hosted
 * build never depends on a Vercel variable. Values are compared exactly:
 * "Production" or " production" is not production.
 *
 * Server code only: neither name is `NEXT_PUBLIC_`, so a browser bundle sees
 * undefined.
 */
export function deployEnv(
  env: NodeJS.ProcessEnv = process.env,
): string | undefined {
  return env.APP_ENV || env.VERCEL_ENV || undefined;
}

/** Whether this deployment is production (see `deployEnv`). */
export function isProductionDeploy(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return deployEnv(env) === "production";
}
