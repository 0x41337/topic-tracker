import { chromium } from "playwright"

const BASE_URL = process.env.SMOKE_URL ?? "http://localhost:3000"

interface Probe {
    name: string
    x: number
    y: number
}

async function main(): Promise<void> {
    const browser = await chromium.launch()
    const page = await browser.newPage({
        viewport: { width: 1280, height: 800 },
    })
    await page.goto(BASE_URL, { waitUntil: "networkidle" })

    const tree = page.getByRole("tree")
    await tree.waitFor({ timeout: 15_000 })

    const probes: Probe[] = [
        { name: "center", x: 640, y: 400 },
        { name: "top-left", x: 200, y: 150 },
        { name: "right edge", x: 1270, y: 400 },
        { name: "bottom edge", x: 640, y: 780 },
        { name: "right-bottom corner", x: 1270, y: 780 },
    ]

    let failures = 0
    for (const probe of probes) {
        // Close any open menu first.
        await page.mouse.click(10, 10)
        await page.waitForTimeout(80)

        await page.mouse.click(probe.x, probe.y, { button: "right" })
        // contextmenu has continuous priority in React: the menu renders on the
        // next frame. Wait a couple of frames, then read the final placement.
        await page.waitForTimeout(80)
        const box = await page.evaluate(() => {
            const menu = document.querySelector(
                '[role="menu"]',
            ) as HTMLElement | null
            if (!menu) return null
            const rect = menu.getBoundingClientRect()
            const style = window.getComputedStyle(menu)
            return {
                left: rect.left,
                top: rect.top,
                right: rect.right,
                bottom: rect.bottom,
                width: rect.width,
                height: rect.height,
                visibility: style.visibility,
            }
        })

        if (!box) {
            console.log(`FAIL ${probe.name}: menu not found`)
            failures += 1
            continue
        }

        const viewport = { w: 1280, h: 800 }
        const expectedLeft = Math.max(
            8,
            Math.min(probe.x, viewport.w - box.width - 8),
        )
        const expectedTop = Math.max(
            8,
            Math.min(probe.y, viewport.h - box.height - 8),
        )
        const ok =
            box.visibility === "visible" &&
            Math.abs(box.left - expectedLeft) < 2 &&
            Math.abs(box.top - expectedTop) < 2 &&
            box.right <= viewport.w &&
            box.bottom <= viewport.h
        if (!ok) {
            failures += 1
            console.log(
                `FAIL ${probe.name}: got (${box.left.toFixed(1)},${box.top.toFixed(1)}) expected (${expectedLeft},${expectedTop}) visibility=${box.visibility}`,
            )
        } else {
            console.log(
                `ok - ${probe.name}: menu at (${box.left.toFixed(0)},${box.top.toFixed(0)}) within viewport`,
            )
        }
    }

    await browser.close()
    if (failures > 0) process.exit(1)
    console.log("MENU POSITION OK")
}

main().catch((error) => {
    console.error(error)
    process.exit(1)
})
