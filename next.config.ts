import type { NextConfig } from "next";
import pkg from "./package.json" with { type: "json" };

// NEXT_PUBLIC_APP_VERSION: the version shown on the borne's footer (package.json).
// NEXT_PUBLIC_BUILD_ID: identifies this build, so an open borne can tell a newer one is online (see /api/version).
// Without a commit id (local builds) it stays the package version: no auto-reload locally, never a reload loop.
const BUILD_ID = process.env.VERCEL_GIT_COMMIT_SHA || pkg.version;

const nextConfig: NextConfig = {
  env: { NEXT_PUBLIC_APP_VERSION: pkg.version, NEXT_PUBLIC_BUILD_ID: BUILD_ID },
  // A stray lockfile in the home directory would otherwise be picked as the workspace root.
  turbopack: { root: process.cwd() },
  // In development, lets a phone on the same Wi-Fi open the photo page (/depot/…) through the Mac's LAN address.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.*.*.*", "*.local"],
};

export default nextConfig;
