/**
 * Static file server for the exported site (out/), honoring the GitHub Pages
 * basePath ("/topic-tracker") so the preview matches production exactly.
 *
 *   bun run serve            # PORT=3000 by default
 */
import { createHash } from "node:crypto"

const PORT = Number(process.env.PORT ?? 3000)
const BASE_PATH = "/topic-tracker"
const OUT_DIR = new URL("../out", import.meta.url).pathname

const MIME: Record<string, string> = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".txt": "text/plain; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".ico": "image/x-icon",
    ".webp": "image/webp",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".webmanifest": "application/manifest+json",
}

const etagFor = (content: Uint8Array): string =>
    `"${createHash("sha1").update(content).digest("base64")}"`

async function readStatic(relativePath: string): Promise<Response | null> {
    const file = Bun.file(`${OUT_DIR}${relativePath}`)
    if (!(await file.exists())) return null
    const content = new Uint8Array(await file.arrayBuffer())
    const ext = relativePath.slice(relativePath.lastIndexOf(".")).toLowerCase()
    const type = MIME[ext] ?? "application/octet-stream"
    const headers: Record<string, string> = {
        "Content-Type": type,
        ETag: etagFor(content),
        // Hashed assets are immutable; HTML must always revalidate.
        "Cache-Control": relativePath.startsWith("/_next/static")
            ? "public, max-age=31536000, immutable"
            : "no-store, must-revalidate",
    }
    return new Response(content, { headers })
}

function with304(request: Request, response: Response): Response {
    const etag = response.headers.get("ETag")
    const noneMatch = request.headers.get("If-None-Match")
    if (etag && noneMatch === etag) {
        return new Response(null, { status: 304, headers: { ETag: etag } })
    }
    return response
}

Bun.serve({
    port: PORT,
    async fetch(request) {
        const url = new URL(request.url)
        const path = url.pathname

        // Root -> app under basePath.
        if (path === "/" || path === "") {
            return Response.redirect(new URL(`${BASE_PATH}/`, url), 302)
        }

        if (path === BASE_PATH || path === `${BASE_PATH}/`) {
            const page =
                (await readStatic("/index.html")) ??
                new Response("Not found", { status: 404 })
            return with304(request, page)
        }

        if (path.startsWith(`${BASE_PATH}/`)) {
            const relative = path.slice(BASE_PATH.length)
            const candidates = relative.endsWith("/")
                ? [`${relative}index.html`]
                : [relative, `${relative}.html`, `${relative}/index.html`]
            for (const candidate of candidates) {
                const response = await readStatic(candidate)
                if (response) return with304(request, response)
            }
            const notFound = await readStatic("/404.html")
            return notFound ?? new Response("Not found", { status: 404 })
        }

        return new Response("Not found", { status: 404 })
    },
})

console.log(`Serving out/ at http://localhost:${PORT}${BASE_PATH}/`)
