import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@elevenlabs/elevenlabs-js", "ws"],
};

export default nextConfig;
