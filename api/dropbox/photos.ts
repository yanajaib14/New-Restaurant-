// Returns the latest photos from the shared Dropbox inspiration folder as
// base64 thumbnails. Requires DROPBOX_ACCESS_TOKEN; responds with an empty
// list (200) when not configured so the dashboard strip simply hides itself.

const DEFAULT_SHARED_LINK =
  "https://www.dropbox.com/scl/fo/2bqe785ejhqtovanktrb7/AMn-iAg9rAWSmq7yXP7uQyE?rlkey=fm5kpcuktza3p1y2l35kz7huq&st=gjgw1few&dl=0";

const IMAGE_RE = /\.(png|jpe?g|gif|webp|heic)$/i;
const MAX_PHOTOS = 8;

let cache: { at: number; photos: Array<{ name: string; url: string }> } | null = null;
const CACHE_TTL = 5 * 60 * 1000;

export async function fetchDropboxPhotos(): Promise<Array<{ name: string; url: string }>> {
  const token = String(process.env.DROPBOX_ACCESS_TOKEN || "").trim();
  if (!token) return [];

  if (cache && Date.now() - cache.at < CACHE_TTL) return cache.photos;

  const sharedLink = String(process.env.DROPBOX_SHARED_LINK || DEFAULT_SHARED_LINK).trim();

  const listRes = await fetch("https://api.dropboxapi.com/2/files/list_folder", {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ shared_link: { url: sharedLink }, path: "" }),
  });
  if (!listRes.ok) {
    console.warn("Dropbox list_folder failed:", listRes.status, await listRes.text().catch(() => ""));
    return [];
  }
  const listBody = await listRes.json();
  const entries = (listBody?.entries || [])
    .filter((e: any) => e[".tag"] === "file" && IMAGE_RE.test(e.name))
    .sort((a: any, b: any) => String(b.server_modified || "").localeCompare(String(a.server_modified || "")))
    .slice(0, MAX_PHOTOS);

  const photos: Array<{ name: string; url: string }> = [];
  await Promise.all(entries.map(async (e: any) => {
    try {
      const thumbRes = await fetch("https://content.dropboxapi.com/2/files/get_thumbnail_v2", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Dropbox-API-Arg": JSON.stringify({
            resource: { ".tag": "link", url: sharedLink, path: `/${e.name}` },
            format: "jpeg",
            size: "w480h320",
          }),
        },
      });
      if (!thumbRes.ok) return;
      const buf = Buffer.from(await thumbRes.arrayBuffer());
      photos.push({ name: e.name, url: `data:image/jpeg;base64,${buf.toString("base64")}` });
    } catch { /* skip this photo */ }
  }));

  // Preserve newest-first order from the listing
  const order = new Map<string, number>(entries.map((e: any, i: number) => [String(e.name), i]));
  photos.sort((a, b) => (order.get(a.name) ?? 99) - (order.get(b.name) ?? 99));

  cache = { at: Date.now(), photos };
  return photos;
}

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const photos = await fetchDropboxPhotos();
    return res.status(200).json({ photos, configured: Boolean(process.env.DROPBOX_ACCESS_TOKEN) });
  } catch (error: any) {
    console.error("Dropbox photos error:", error?.message || error);
    return res.status(200).json({ photos: [], configured: false });
  }
}
