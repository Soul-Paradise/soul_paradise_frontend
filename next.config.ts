import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Hero, trip and logo images are served from the GCS buckets (lib/assets.ts).
    remotePatterns: [{ protocol: "https", hostname: "storage.googleapis.com" }],
  },
};

export default nextConfig;
