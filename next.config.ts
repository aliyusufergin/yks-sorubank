import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    output: "standalone",
    serverExternalPackages: ["sharp"],
    images: {
        remotePatterns: [],
    },
    experimental: {
        serverActions: {
            bodySizeLimit: "250mb",
        },
        proxyClientMaxBodySize: "250mb",
    } as NextConfig["experimental"],
};

export default nextConfig;
