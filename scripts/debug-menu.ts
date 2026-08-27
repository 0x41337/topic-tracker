import { chromium } from "playwright"

const BASE_URL = process.env.SMOKE_URL ?? "http://localhost:3000"

async function main(): Promise<void> {
    const browser = await chromium.launch()
    const page = await browser.newPage({
        viewport: { width: 1440, height: 900 },
    })
    page.on("console", (m) => {
        if (m.type() === "error" || m.type() === "warning")
            console.log(`[${m.type()}]`, m.text().slice(0, 300))
    })
    await page.goto(BASE_URL, { waitUntil: "networkidle" })
    await page.getByRole("button", { name: "Settings" }).click()
    await page.getByRole("menuitem", { name: "Theme" }).waitFor()

    for (const key of ["ArrowDown", "ArrowDown", "ArrowDown"]) {
        await page.keyboard.press(key)
        await page.waitForTimeout(100)
        const active = await page.evaluate(() => {
            const el = document.activeElement as HTMLElement | null
            return el ? `${el.tagName}:${el.textContent?.slice(0, 30)}` : "none"
        })
        console.log(`after ${key}: focused = ${active}`)
    }

    await page.keyboard.press("ArrowRight")
    await page.waitForTimeout(300)
    const active = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null
        return el ? `${el.tagName}:${el.textContent?.slice(0, 30)}` : "none"
    })
    console.log(`after ArrowRight: focused = ${active}`)
    const subItems = await page.getByRole("menuitem", { name: "Light" }).count()
    console.log("Light menuitem count:", subItems)
    await page.screenshot({ path: "/tmp/menu-debug.png" })
    await browser.close()
}

main().catch((error) => {
    console.error(error)
    process.exit(1)
})
