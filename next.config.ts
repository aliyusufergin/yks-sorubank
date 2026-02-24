import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    output: "standalone",
    serverExternalPackages: ["sharp"],
    images: {
        remotePatterns: [],
    },
};

export default nextConfig;
