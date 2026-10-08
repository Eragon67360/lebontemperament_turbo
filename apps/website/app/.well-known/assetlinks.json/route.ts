import { ANDROID_SHA256_FINGERPRINTS, APP_BUNDLE_ID } from "@/lib/app-links";

/**
 * Android App Links (#593): Android verifies this statement at install time
 * and then opens `/l/<code>` in the app. JSON without a redirect, cached a
 * few hours. 404 until the signing fingerprints are filled in
 * (`lib/app-links.ts`).
 */
export async function GET() {
  if (ANDROID_SHA256_FINGERPRINTS.length === 0) {
    return new Response(null, { status: 404 });
  }
  const body = [
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: APP_BUNDLE_ID,
        sha256_cert_fingerprints: [...ANDROID_SHA256_FINGERPRINTS],
      },
    },
  ];
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600, s-maxage=14400",
    },
  });
}
