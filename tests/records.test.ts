import assert from "node:assert/strict";
import test from "node:test";
import { createRecordsHandler, type RecordsPool, type RecordsRequest } from "../server/records";

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

async function invoke(
  handler: ReturnType<typeof createRecordsHandler>,
  req: RecordsRequest
) {
  const res = responseRecorder();
  await handler(req as never, res as never, () => undefined);
  return res;
}

const trusted = { origin: "http://localhost:3000" };

test("GET reads rows from a whitelisted table", async () => {
  let query = "";
  const pool: RecordsPool = {
    query: async (sql) => {
      query = sql;
      return {
        rows: [{ id: "4", amount: "12.5", external_id: "9007199254740993" }],
        fields: [
          { name: "id", dataTypeID: 20 },
          { name: "amount", dataTypeID: 1700 },
          { name: "external_id", dataTypeID: 20 },
        ],
      };
    },
  };
  const handler = createRecordsHandler(() => pool);
  const res = await invoke(handler, { method: "GET", params: { table: "tasks" }, headers: trusted });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, [{ id: 4, amount: 12.5, external_id: "9007199254740993" }]);
  assert.equal(query, 'SELECT * FROM "tasks"');
});

test("POST inserts one record and serializes JSON values", async () => {
  let seen: { sql: string; values?: unknown[] } | undefined;
  const pool: RecordsPool = {
    query: async (sql, values) => { seen = { sql, values }; return { rows: [{ id: 4, title: "Soup" }] }; },
  };
  const handler = createRecordsHandler(() => pool);
  const res = await invoke(handler, {
    method: "POST",
    params: { table: "menu_items" },
    headers: trusted,
    body: { id: 4, title: "Soup", metadata: { spicy: true } },
  });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, [{ id: 4, title: "Soup" }]);
  assert.equal(seen?.sql, 'INSERT INTO "menu_items" ("id", "title", "metadata") VALUES ($1, $2, $3) RETURNING *');
  assert.deepEqual(seen?.values, [4, "Soup", '{"spicy":true}']);
});

test("PATCH updates by id and returns 404 when no row matched", async () => {
  let seen: { sql: string; values?: unknown[] } | undefined;
  const pool: RecordsPool = { query: async (sql, values) => { seen = { sql, values }; return { rows: [] }; } };
  const handler = createRecordsHandler(() => pool);
  const res = await invoke(handler, {
    method: "PATCH", params: { table: "tasks" }, query: { id: "eq.123" }, headers: trusted,
    body: { title: "Updated" },
  });
  assert.equal(res.statusCode, 404);
  assert.deepEqual(res.body, { error: "Record not found" });
  assert.equal(seen?.sql, 'UPDATE "tasks" SET "title" = $1 WHERE id = $2 RETURNING *');
  assert.deepEqual(seen?.values, ["Updated", "123"]);
});

test("DELETE is idempotent and returns an empty rows array when absent", async () => {
  let seen: { sql: string; values?: unknown[] } | undefined;
  const pool: RecordsPool = { query: async (sql, values) => { seen = { sql, values }; return { rows: [] }; } };
  const handler = createRecordsHandler(() => pool);
  const res = await invoke(handler, {
    method: "DELETE", params: { table: "notes" }, query: { id: "eq.note-1" }, headers: trusted,
  });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, []);
  assert.equal(seen?.sql, 'DELETE FROM "notes" WHERE id = $1 RETURNING *');
  assert.deepEqual(seen?.values, ["note-1"]);
});

test("rejects unsupported methods, missing database, and untrusted origins", async () => {
  const handler = createRecordsHandler(() => null);
  const base = { params: { table: "tasks" } };
  assert.equal((await invoke(handler, { ...base, method: "PUT", headers: trusted })).statusCode, 405);
  assert.equal((await invoke(handler, { ...base, method: "GET", headers: trusted })).statusCode, 503);
  assert.equal((await invoke(handler, { ...base, method: "GET", headers: { origin: "https://attacker.invalid" } })).statusCode, 403);
});

test("rejects unknown tables, unsafe identifiers, and malformed payloads", async () => {
  let queryCount = 0;
  const handler = createRecordsHandler(() => ({ query: async () => { queryCount += 1; return { rows: [] }; } }));
  assert.equal((await invoke(handler, { method: "GET", params: { table: "tasks;DROP TABLE tasks" }, headers: trusted })).statusCode, 400);
  assert.equal((await invoke(handler, { method: "POST", params: { table: "tasks" }, headers: trusted, body: { "bad-name": 1 } })).statusCode, 400);
  assert.equal((await invoke(handler, { method: "POST", params: { table: "tasks" }, headers: trusted, body: { constructor: { prototype: {} } } })).statusCode, 400);
  assert.equal((await invoke(handler, { method: "POST", params: { table: "tasks" }, headers: trusted, body: [] })).statusCode, 400);
  assert.equal((await invoke(handler, { method: "POST", params: { table: "tasks" }, headers: trusted, body: {} })).statusCode, 400);
  assert.equal(queryCount, 0);
});

test("database errors return a generic 500 without exposing details", async () => {
  const handler = createRecordsHandler(() => ({ query: async () => { throw new Error("secret connection string"); } }));
  const originalError = console.error;
  console.error = () => undefined;
  try {
    const res = await invoke(handler, { method: "GET", params: { table: "tasks" }, headers: trusted });
    assert.equal(res.statusCode, 500);
    assert.deepEqual(res.body, { error: "Database request failed" });
  } finally {
    console.error = originalError;
  }
});
