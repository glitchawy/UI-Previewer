import assert from "node:assert/strict";
import type { Server } from "node:http";
import { db, usersTable } from "@workspace/db";
import { runMigrations } from "@workspace/db/migrate";
import app from "./app";
import { issueSession } from "./lib/session";

await runMigrations();
const [user] = await db.insert(usersTable).values({
  phone: `010${String(Date.now()).slice(-8)}`,
  role: "customer",
}).returning();
const session = await issueSession(user);
let server: Server | undefined;
try {
  server = await new Promise<Server>((resolve, reject) => {
    const listening = app.listen(0, "127.0.0.1", () => resolve(listening));
    listening.once("error", reject);
  });
  const address = server.address();
  assert.ok(address && typeof address === "object");
  const removedRoute = `/api/auth/${["dev", "login"].join("-")}`;
  const response = await fetch(`http://127.0.0.1:${address.port}${removedRoute}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ role: "customer" }),
  });
  assert.equal(response.status, 404, "development login route must not exist");
  const me = await fetch(`http://127.0.0.1:${address.port}/api/auth/me`, {
    headers: { authorization: `Bearer ${session.token}` },
  });
  assert.equal(me.status, 200, "real persisted sessions must authorize /me");
} finally {
  server?.close();
}