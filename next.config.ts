import type { NextConfig } from "next"

const nextConfig: NextConfig = {
    // Never let browsers or proxies cache the HTML: a stale document would
    // reference old hashed chunks (previous builds) after every deploy.
    async headers() {
        return [
            {
                source: "/:path*",
                headers: [
                    {
                        key: "Cache-Control",
                        value: "no-store, must-revalidate",
                    },
                ],
            },
        ]
    },
    /**
     * The live preview proxies the dev server through `https://{port}-{id}.e2b.app`.
     * Next.js blocks cross-origin access to dev resources (JS chunks, HMR) by
     * default, which would leave the preview stuck on the loading skeleton.
     * Allow the preview host with a wildcard so it works across sandbox ids.
     */
    allowedDevOrigins: ["*.e2b.app"],
}

export default nextConfig
