import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable static export for Azure Static Web Apps
  output: "export",
  // Disable image optimization for static export
  images: {
    unoptimized: true,
  },
  // Ensure trailing slashes for proper routing
  trailingSlash: true,
};

export default nextConfig;
