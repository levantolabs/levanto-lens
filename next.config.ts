import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Let a cloudflared quick tunnel load dev assets (phone camera testing needs HTTPS).
  allowedDevOrigins: ["*.trycloudflare.com"],
};

export default nextConfig;
