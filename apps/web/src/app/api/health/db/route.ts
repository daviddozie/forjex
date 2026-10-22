import { NextResponse } from "next/server";
import { isDbConfigured, getDb } from "@/db";
import { sql } from "drizzle-orm";
import { projects, users, deployments } from "@/db/schema";

export async function GET() {
  const configured = isDbConfigured();

  if (!configured) {
    return NextResponse.json({
      status: "unconfigured",
      connected: false,
      driver: "Neon Serverless PostgreSQL (Drizzle ORM)",
      message:
        "DATABASE_URL is not set. The platform is running in local preview/demo mode. Provide your Neon PostgreSQL connection string to enable full cloud persistence.",
    });
  }

  const { db } = getDb();
  if (!db) {
    return NextResponse.json(
      {
        status: "error",
        connected: false,
        driver: "Neon Serverless PostgreSQL",
        message: "Database client failed to initialize with provided DATABASE_URL.",
      },
      { status: 500 }
    );
  }

  try {
    const startTime = Date.now();
    // Run quick ping query
    await db.execute(sql`SELECT 1 as ping`);
    const latencyMs = Date.now() - startTime;

    // Fetch table stats (safely catch if tables not migrated yet)
    let projectCount = 0;
    let deploymentCount = 0;
    let tablesReady = true;

    try {
      const pCountResult = await db.select({ count: sql<number>`count(*)` }).from(projects);
      projectCount = Number(pCountResult[0]?.count || 0);

      const dCountResult = await db.select({ count: sql<number>`count(*)` }).from(deployments);
      deploymentCount = Number(dCountResult[0]?.count || 0);
    } catch (tblErr) {
      tablesReady = false;
    }

    return NextResponse.json({
      status: "healthy",
      connected: true,
      driver: "Neon Serverless PostgreSQL (HTTP)",
      latencyMs: `${latencyMs}ms`,
      tablesReady,
      stats: {
        projects: projectCount,
        deployments: deploymentCount,
      },
      message: tablesReady
        ? "Neon PostgreSQL database is online, migrated, and operational."
        : "Neon PostgreSQL connected! Run 'pnpm db:push' or 'pnpm db:generate' to apply schema tables.",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "error",
        connected: false,
        driver: "Neon Serverless PostgreSQL",
        error: error.message || "Failed to query Neon database",
      },
      { status: 502 }
    );
  }
}
