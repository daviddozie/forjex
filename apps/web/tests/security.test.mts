import assert from "node:assert/strict";
import { test, before } from "node:test";

// Tests never use configured provider credentials or a real database.
delete process.env.DATABASE_URL;
process.env.GITHUB_TOKEN = "server-owner-token-must-not-be-used";
process.env.VERCEL_TOKEN = "server-owner-vercel-must-not-be-used";

const { ownsProject } = await import("../src/lib/project-policy");
const { validOAuthState, safeReturnTo } = await import("../src/lib/oauth-state");
const { deploymentState, getDeploymentState } = await import("../src/lib/vercel");
const { authorizeCliSession, consumeCliSession, validCliSession, encryptCliAuthorization, decryptCliAuthorization } = await import("../src/lib/cli-sessions");
const projects = await import("../src/app/api/projects/route");
const cli = await import("../src/app/api/auth/cli/route");
const forge = await import("../src/app/api/forge/route");
const { getGitHubToken, getVercelToken, authenticateRequest } = await import("../src/lib/auth");
const originalFetch = globalThis.fetch;
before(() => { globalThis.fetch = async () => { throw new Error("Unexpected network request"); }; });

test("project ownership cannot be overridden by matching repoOwner for another user's record", () => {
  const user = { id: "user-a", username: "alice" };
  assert.equal(ownsProject(user, { userId: "user-b", repoOwner: "alice" }), false);
  assert.equal(ownsProject(user, { userId: "user-a", repoOwner: "organization" }), true);
  assert.equal(ownsProject(user, { userId: null, repoOwner: "ALICE" }), true);
  assert.equal(ownsProject(user, { userId: null, repoOwner: "bob" }), false);
});

test("server tokens never authenticate anonymous web requests", async () => {
  assert.equal(await getGitHubToken(), null);
  assert.equal(await getVercelToken(), null);
  assert.equal(await authenticateRequest(new Request("https://forjex.test/api/projects")), null);
});

test("anonymous project reads, writes, deletion and pruning all reject before accessing storage", async () => {
  for (const [handler, method, query] of [[projects.GET, "GET", ""], [projects.POST, "POST", ""], [projects.DELETE, "DELETE", "?id=other-users-project"], [projects.DELETE, "DELETE", "?pruneDeleted=true"]] as const) {
    const response = await handler(new Request(`https://forjex.test/api/projects${query}`, { method }));
    assert.equal(response.status, 401);
  }
});

test("OAuth rejects missing, mismatched and malformed state and unsafe return paths", () => {
  const nonce = "a".repeat(64);
  assert.equal(validOAuthState(nonce, nonce), true);
  assert.equal(validOAuthState(null, nonce), false);
  assert.equal(validOAuthState("b".repeat(64), nonce), false);
  assert.equal(validOAuthState("é".repeat(64), nonce), false);
  for (const path of ["https://evil.test", "//evil.test", "/\\evil.test", "/other", "/dashboard\n"]) assert.equal(safeReturnTo(path), "/dashboard");
  assert.equal(safeReturnTo("/auth/cli#session=abc"), "/auth/cli#session=abc");
});

test("CLI session identifiers are unguessable format and delivered once", async () => {
  assert.equal(validCliSession("old-session"), false);
  const session = "a".repeat(64);
  const payload = { githubToken: "test-token", user: { username: "alice" } };
  await authorizeCliSession(session, payload);
  const [first, second] = await Promise.all([consumeCliSession(session), consumeCliSession(session)]);
  assert.deepEqual(first, payload);
  assert.equal(second, null);
});

test("CLI authorization requires verified user credentials rather than server environment", async () => {
  const response = await cli.POST(new Request("https://forjex.test/api/auth/cli", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ session: "b".repeat(64) }) }));
  assert.equal(response.status, 401);
  const poll = await cli.GET(new Request("https://forjex.test/api/auth/cli?session=old-public-url"));
  assert.equal(poll.status, 400);
});

test("demo forge returns no invented repository or deployment URLs and never persists", async () => {
  const response = await forge.POST(new Request("https://forjex.test/api/forge", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: "demo", template: "nextjs" }) }));
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.mode, "simulation");
  assert.equal(data.dbPersisted, false);
  assert.equal(data.repository.url, null);
  assert.equal(data.deployment.url, null);
  assert.equal(data.deployment.status, "demo");
});

test("deployment readiness is derived from provider state, never a guessed URL", () => {
  assert.deepEqual(deploymentState(), { status: "awaiting_deployment", linked: true, url: null });
  for (const [state, expected] of [["BUILDING", "building"], ["QUEUED", "queued"], ["ERROR", "failed"], ["CANCELED", "canceled"]]) {
    assert.equal(deploymentState({ state, url: "app.vercel.app" }).status, expected);
    assert.equal(deploymentState({ state, url: "app.vercel.app" }).url, null);
  }
  assert.equal(deploymentState({ state: "READY", url: "actual-assigned.vercel.app" }).url, "https://actual-assigned.vercel.app");
  assert.equal(deploymentState({ state: "READY", url: "evil.test/path" }).url, null);
});

test("existing Vercel project belonging to another repository is not treated as linked", async () => {
  let calls = 0;
  globalThis.fetch = async () => { calls++; return Response.json({ id: "prj", link: { type: "github", org: "bob", repo: "different" } }); };
  try {
    assert.deepEqual(await getDeploymentState("test", "app", "alice", "app"), { status: "awaiting_setup", url: null, linked: false });
    assert.equal(calls, 1);
  } finally { globalThis.fetch = originalFetch; }
});

test("production deployment query uses verified project and provider state", async () => {
  const urls: string[] = [];
  globalThis.fetch = async (url) => {
    urls.push(String(url));
    return Response.json(urls.length === 1 ? { id: "verified_project", link: { type: "github", org: "alice", repo: "app" } } : { deployments: [{ state: "BUILDING", url: "app.vercel.app" }] });
  };
  try {
    assert.deepEqual(await getDeploymentState("test", "app", "alice", "app"), { status: "building", linked: true, url: null });
    assert.match(urls[1], /projectId=verified_project&target=production/);
  } finally { globalThis.fetch = originalFetch; }
});


test("persistent CLI authorization encrypts tokens and rejects tampered records", () => {
  process.env.FORJEX_SESSION_SECRET = "test-only-session-key-that-is-at-least-32-characters";
  try {
    const payload = { githubToken: "private-provider-token", user: { username: "alice" } };
    const encoded = encryptCliAuthorization(payload);
    assert.equal(encoded.includes(payload.githubToken), false);
    assert.deepEqual(decryptCliAuthorization(encoded), payload);
    assert.notEqual(encryptCliAuthorization(payload), encoded);
    const bytes = Buffer.from(encoded, "base64");
    bytes[bytes.length - 1] ^= 1;
    assert.throws(() => decryptCliAuthorization(bytes.toString("base64")));
  } finally { delete process.env.FORJEX_SESSION_SECRET; }
});


test("expired CLI authorizations cannot be consumed", async () => {
  const session = "e".repeat(64);
  await authorizeCliSession(session, { githubToken: "expired-token", user: { username: "alice" } });
  const now = Date.now;
  Date.now = () => now() + 4 * 60 * 1000;
  try { assert.equal(await consumeCliSession(session), null); }
  finally { Date.now = now; }
});


test("existing-repository requests validate the destination before any provider calls", async () => {
  for (const existingRepoUrl of [undefined, "https://example.com/owner/repo", "https://github.com/owner/repo/tree/main"]) {
    const response = await forge.POST(new Request("https://forjex.test/api/forge", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ repoMode: "existing", existingRepoUrl }) }));
    assert.equal(response.status, 400);
  }
});

test("existing-repository demo takes its name from the supplied URL", async () => {
  const response = await forge.POST(new Request("https://forjex.test/api/forge", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ repoMode: "existing", name: "unused-new-name", existingRepoUrl: "https://github.com/example-team/existing-app" }) }));
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.repository.name, "existing-app");
  assert.equal(result.mode, "simulation");
  assert.equal(result.repository.url, null);
});
