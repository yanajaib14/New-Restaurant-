// Same-site check for Vercel functions: only accept requests coming from
// this app's own pages (or carrying DB_ROUTE_KEY), matching /api/db/*.

const normalizeHost = (value: string) => value.toLowerCase().split(":")[0];

const allowedHosts = new Set<string>(["localhost", "127.0.0.1"]);
for (const raw of [process.env.APP_URL, process.env.VERCEL_PROJECT_PRODUCTION_URL, process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL]) {
  const value = String(raw || "").trim();
  if (!value) continue;
  try {
    allowedHosts.add(normalizeHost(new URL(value.includes("://") ? value : `https://${value}`).host));
  } catch {
    // ignore invalid values
  }
}

const hostOf = (value: unknown) => {
  try {
    return normalizeHost(new URL(String(value || "")).host);
  } catch {
    return "";
  }
};

export function isTrustedRequest(req: any) {
  const routeKey = String(process.env.DB_ROUTE_KEY || "").trim();
  if (routeKey && String(req.headers?.["x-db-route-key"] || "").trim() === routeKey) return true;
  if (String(process.env.DB_ROUTE_REQUIRE_TRUSTED || "1").trim() === "0") return true;

  const secFetchSite = String(req.headers?.["sec-fetch-site"] || "").toLowerCase();
  if (secFetchSite && !["same-origin", "same-site", "none"].includes(secFetchSite)) return false;

  const origin = hostOf(req.headers?.origin);
  const referer = hostOf(req.headers?.referer);
  return Boolean((origin && allowedHosts.has(origin)) || (referer && allowedHosts.has(referer)));
}
