import { randomBytes } from "node:crypto";
import { safeReturnTo } from "@/lib/oauth-state";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const clientId = process.env.GITHUB_CLIENT_ID || "Ov23liRqj5mMaAS6fFiP";
  const returnTo = safeReturnTo(searchParams.get("returnTo"));

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || origin;
  const redirectUri =
    process.env.GITHUB_OAUTH_REDIRECT_URI ||
    `${appUrl}/api/auth/github/callback`;

  const githubAuthUrl = new URL("https://github.com/login/oauth/authorize");
  githubAuthUrl.searchParams.set("client_id", clientId);
  githubAuthUrl.searchParams.set("scope", "repo,workflow,user:email");
  githubAuthUrl.searchParams.set("redirect_uri", redirectUri);
  const state = randomBytes(32).toString("hex");
  githubAuthUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(githubAuthUrl.toString());
  const options = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, maxAge: 600, path: "/" };
  response.cookies.set("forjex_oauth_state", state, options);
  response.cookies.set("forjex_oauth_return", returnTo, options);
  return response;
}
