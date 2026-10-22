import { NextResponse } from "next/server";
import { getGitHubToken, getVercelToken, verifyGitHubToken, verifyVercelToken } from "@/lib/auth";
import { authorizeCliSession, consumeCliSession, validCliSession } from "@/lib/cli-sessions";

export async function GET(request: Request) {
  // Keep the session secret out of URLs, browser history, and access logs.
  const session = request.headers.get("x-forjex-cli-session");
  if (!validCliSession(session)) return NextResponse.json({ error: "Invalid CLI session" }, { status: 400 });
  try {
    const payload = await consumeCliSession(session);
    return NextResponse.json(payload ? { authorized: true, ...payload } : { authorized: false, status: "pending" }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "CLI authorization storage unavailable" }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const { session, githubToken: manualGitHub, vercelToken: manualVercel } = await request.json();
    if (!validCliSession(session)) return NextResponse.json({ error: "Invalid CLI session" }, { status: 400 });
    const githubToken = manualGitHub || await getGitHubToken();
    if (typeof githubToken !== "string") return NextResponse.json({ error: "Connect GitHub before authorizing the CLI" }, { status: 401 });
    const verified = await verifyGitHubToken(githubToken);
    if (!verified.valid || !verified.username) return NextResponse.json({ error: "Invalid GitHub credentials" }, { status: 401 });
    const vercelToken = manualVercel || await getVercelToken();
    if (vercelToken && (typeof vercelToken !== "string" || !(await verifyVercelToken(vercelToken)).valid)) {
      return NextResponse.json({ error: "Invalid Vercel credentials" }, { status: 401 });
    }
    const user = { username: verified.username, name: verified.name, avatarUrl: verified.avatarUrl };
    await authorizeCliSession(session, { githubToken, vercelToken: vercelToken || undefined, user });
    return NextResponse.json({ success: true, user }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Unable to authorize CLI session. Check authorization storage configuration." }, { status: 503 });
  }
}
