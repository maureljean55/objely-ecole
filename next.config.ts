import { execSync } from "node:child_process";
import type { NextConfig } from "next";
import pkg from "./package.json" with { type: "json" };

// The version shown on the borne: package.json's version, plus the commit it was built from (Vercel gives it; locally
// it is read from git) so two builds of the same version can be told apart.
function buildCommit() {
  if (process.env.VERCEL_GIT_COMMIT_SHA) return process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7);
  try {
    return execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    return "";
  }
}

const nextConfig: NextConfig = {
  env: { NEXT_PUBLIC_APP_VERSION: pkg.version, NEXT_PUBLIC_APP_COMMIT: buildCommit() },
  // A stray lockfile in the home directory would otherwise be picked as the workspace root.
  turbopack: { root: process.cwd() },
  // In development, lets a phone on the same Wi-Fi open the photo page (/depot/…) through the Mac's LAN address.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.*.*.*", "*.local"],
};

export default nextConfig;
