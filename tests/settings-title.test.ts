import assert from "node:assert/strict";
import test from "node:test";
import { createSettingsTitleHandlers, DEFAULT_APP_TITLE, MAX_APP_TITLE_LENGTH } from "../server/settings";

function responseRecorder() {
  return {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: unknown) {
      this.body = body;
      return this;
    },
  };
}

async function invoke(handler: (req: any, res: any, next: any) => unknown, body?: unknown) {
  const res = responseRecorder();
  await handler({ body }, res, () => undefined);
  return res;
}

test("GET returns the saved title, falling back to the default when unset", async () => {
  const saved = createSettingsTitleHandlers({ query: async () => ({ rows: [{ value: "Cafe" }] }) });
  assert.deepEqual((await invoke(saved.get)).body, { ok: true, title: "Cafe" });

  const unset = createSettingsTitleHandlers({ query: async () => ({ rows: [] }) });
  assert.deepEqual((await invoke(unset.get)).body, { ok: true, title: DEFAULT_APP_TITLE });
});

test("GET keeps the default title available in preview mode", async () => {
  const handlers = createSettingsTitleHandlers(null);
  assert.deepEqual((await invoke(handlers.get)).body, {
    ok: true,
    title: DEFAULT_APP_TITLE,
    preview: true,
  });
});

test("POST trims and persists a valid title", async () => {
  let query: { sql: string; values?: unknown[] } | undefined;
  const handlers = createSettingsTitleHandlers({
    query: async (sql, values) => {
      query = { sql, values };
      return { rows: [] };
    },
  });

  const res = await invoke(handlers.post, { title: "  New Cafe  " });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { ok: true, title: "New Cafe" });
  assert.match(query?.sql || "", /ON CONFLICT \(key\)/);
  assert.deepEqual(query?.values, ["New Cafe"]);
});

test("POST rejects blank, non-string, and overlong titles", async () => {
  let queryCount = 0;
  const handlers = createSettingsTitleHandlers({
    query: async () => {
      queryCount += 1;
      return { rows: [] };
    },
  });

  for (const body of [{ title: "  " }, { title: 12 }, { title: "x".repeat(MAX_APP_TITLE_LENGTH + 1) }]) {
    const res = await invoke(handlers.post, body);
    assert.equal(res.statusCode, 400);
  }
  assert.equal(queryCount, 0);
});

test("POST reports unavailable storage instead of claiming a preview save", async () => {
  const handlers = createSettingsTitleHandlers(null);
  const res = await invoke(handlers.post, { title: "New Cafe" });
  assert.equal(res.statusCode, 503);
  assert.deepEqual(res.body, { error: "Settings storage is unavailable" });
});

test("database errors return 500 for reads and writes", async () => {
  const handlers = createSettingsTitleHandlers({ query: async () => { throw new Error("database offline"); } });
  const originalError = console.error;
  console.error = () => undefined;
  try {
    assert.equal((await invoke(handlers.get)).statusCode, 500);
    assert.equal((await invoke(handlers.post, { title: "New Cafe" })).statusCode, 500);
  } finally {
    console.error = originalError;
  }
});
