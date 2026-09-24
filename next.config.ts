import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A stray lockfile in the home directory would otherwise be picked as the workspace root.
  turbopack: { root: process.cwd() },
  // In development, lets a phone on the same Wi-Fi open the photo page (/depot/…) through the Mac's LAN address.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.*.*.*", "*.local"],
};

export default nextConfig;
