import type { NextConfig } from "next"

const nextConfig: NextConfig = {
    output: "export",
    basePath: "/topic-tracker",
    images: {
        unoptimized: true,
    },
}

export default nextConfig
