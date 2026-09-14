import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produces a self-contained .next/standalone build (server + only the
  // node_modules it actually needs) — this is what makes the Docker
  // runtime stage small instead of shipping the full node_modules tree.
  output: "standalone",
};

export default nextConfig;
