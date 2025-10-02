import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Align build output with Azure Static Web Apps expectation.
  distDir: "build",
};

export default nextConfig;
