/** Captures screenshots for a quick visual review. */
import { chromium } from "playwright"

const BASE_URL = process.env.SMOKE_URL ?? "http://localhost:3000"

async function main(): Promise<void> {
    const browser = await chromium.launch()
    const page = await browser.newPage({
        viewport: { width: 1440, height: 900 },
    })
    await page.goto(BASE_URL, { waitUntil: "networkidle" })

    const tree = page.getByRole("tree")
    const row = (name: string) =>
        tree.getByRole("treeitem").filter({ hasText: name })
    await tree.waitFor({ timeout: 15_000 })

    // Expand only when collapsed (roots start expanded on first run).
    if (!(await row("Phonology").isVisible())) {
        await row("Portuguese Language")
            .getByRole("button", { name: /Collapse|Expand/ })
            .click()
    }
    if (!(await row("Diphthong").isVisible())) {
        await row("Phonology")
            .getByRole("button", { name: /Collapse|Expand/ })
            .click()
    }

    // Home with the overview card.
    await page.waitForTimeout(200)
    await page.screenshot({
        path: "/home/user/tracktree/docs/screenshot-home.png",
    })

    // Hover a row to reveal the mouse actions, then screenshot the tree.
    await row("Diphthong").hover()
    await page.waitForTimeout(200)
    await page.screenshot({
        path: "/home/user/tracktree/docs/screenshot-hover.png",
    })

    await row("Diphthong").click()
    await page.waitForTimeout(400)
    await page.screenshot({
        path: "/home/user/tracktree/docs/screenshot-topic.png",
    })

    await page.getByRole("button", { name: "Practice" }).click()
    await page.getByRole("button", { name: "Hit answer" }).click()
    await page.getByRole("button", { name: "Hit answer" }).click()
    await page.getByRole("button", { name: "Miss answer" }).click()
    await page.waitForTimeout(300)
    await page.screenshot({
        path: "/home/user/tracktree/docs/screenshot-practice.png",
    })
    await page.getByRole("button", { name: "Finish" }).click()

    await page.getByRole("button", { name: "Dashboard" }).click()
    await page.waitForTimeout(400)
    await page.screenshot({
        path: "/home/user/tracktree/docs/screenshot-dashboard.png",
        fullPage: true,
    })

    await browser.close()
    console.log("screenshots saved")
}

main().catch((error) => {
    console.error(error)
    process.exit(1)
})
