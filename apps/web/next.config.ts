import { resolve } from "node:path";
import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

export default function nextConfig(phase: string): NextConfig {
  return {
    outputFileTracingRoot: resolve(__dirname, "../.."),
    // Builds may run while the local dev server is open. Keep their files separate.
    distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next",
  };
}
