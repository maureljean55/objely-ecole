import type { NextConfig } from "next";
import pkg from "./package.json" with { type: "json" };

// The version shown on the borne's footer: package.json's version.
const nextConfig: NextConfig = {
  env: { NEXT_PUBLIC_APP_VERSION: pkg.version },
  // A stray lockfile in the home directory would otherwise be picked as the workspace root.
  turbopack: { root: process.cwd() },
  // In development, lets a phone on the same Wi-Fi open the photo page (/depot/…) through the Mac's LAN address.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.*.*.*", "*.local"],
};

export default nextConfig;
