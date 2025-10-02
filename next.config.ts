import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable static export for Azure Static Web Apps
  output: "export",
  // Azure Static Web Apps expects output in 'out' directory
  distDir: "out",
  // Disable image optimization for static export
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
