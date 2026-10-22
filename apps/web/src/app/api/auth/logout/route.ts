import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const response = NextResponse.json({ success: true, message: "Logged out successfully" });
  clearAuthCookies(response);
  return response;
}

export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  const response = NextResponse.redirect(`${origin}/?logged_out=true`);
  clearAuthCookies(response);
  return response;
}

function clearAuthCookies(response: NextResponse) {
  const cookiesToClear = [
    "forjex_github_token",
    "forjex_github_username",
    "forjex_github_avatar",
    "forjex_github_name",
    "forjex_user_id",
    "forjex_vercel_token",
  ];

  for (const name of cookiesToClear) {
    response.cookies.set(name, "", {
      httpOnly: true,
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });
  }
}
