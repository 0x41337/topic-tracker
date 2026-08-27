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

    // Light: tree search above the Dashboard item.
    await page.getByPlaceholder("Search").fill("pho")
    await page.waitForTimeout(200)
    await page.screenshot({
        path: "/home/user/tracktree/docs/screenshot-search.png",
    })
    await page.getByRole("button", { name: "Clear search" }).click()

    // Open the settings menu and inspect the Theme submenu items exist.
    await page.getByRole("button", { name: "Settings" }).click()
    await page.getByRole("menuitem", { name: "Theme" }).waitFor()
    await themeSubmenuContains(["Light", "Dark", "System"])

    async function themeSubmenuContains(expected: string[]) {
        // Keyboard: focus the Theme sub trigger, open the submenu, read items.
        await page.keyboard.press("ArrowDown") // Expand all
        await page.waitForTimeout(120)
        await page.keyboard.press("ArrowDown") // Collapse all
        await page.waitForTimeout(120)
        await page.keyboard.press("ArrowDown") // Theme
        await page.waitForTimeout(120)
        await page.keyboard.press("ArrowRight") // open submenu -> Light
        await page.waitForTimeout(120)
        for (const label of expected) {
            const item = page.getByRole("menuitem", { name: label })
            await item.waitFor({ timeout: 5_000 })
            console.log(`submenu item present: ${label}`)
        }
        await page.keyboard.press("Escape")
        await page.waitForTimeout(150)
        await page.keyboard.press("Escape") // close menu fully if needed
        await page.waitForTimeout(150)
    }

    // Switch to dark through the menu (keyboard-driven).
    await page.getByRole("button", { name: "Settings" }).click()
    await page.keyboard.press("ArrowDown") // Expand all
    await page.waitForTimeout(120)
    await page.keyboard.press("ArrowDown") // Collapse all
    await page.waitForTimeout(120)
    await page.keyboard.press("ArrowDown") // Theme
    await page.waitForTimeout(120)
    await page.keyboard.press("ArrowRight") // open submenu
    await page.waitForTimeout(150)
    const darkItem = page.getByRole("menuitem", { name: "Dark" })
    await darkItem.waitFor()
    await darkItem.click()
    await page.waitForTimeout(120)

    await page.waitForTimeout(300)
    const isDark = await page.evaluate(() =>
        document.documentElement.classList.contains("dark"),
    )
    console.log("dark class applied:", isDark)
    const stored = await page.evaluate(() => localStorage.getItem("theme"))
    console.log("stored theme:", stored)
    await page.screenshot({
        path: "/home/user/tracktree/docs/screenshot-dark.png",
    })

    // Practice screen in dark.
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
    await row("Diphthong").click()
    await page.getByRole("button", { name: "Practice" }).click()
    await page.waitForTimeout(300)
    await page.screenshot({
        path: "/home/user/tracktree/docs/screenshot-practice-dark.png",
    })

    // Reload: preference persists.
    await page.reload({ waitUntil: "networkidle" })
    const stillDark = await page.evaluate(() =>
        document.documentElement.classList.contains("dark"),
    )
    console.log("dark persists after reload:", stillDark)

    await browser.close()
    if (!isDark || !stillDark) process.exit(1)
    console.log("THEME SCREENSHOTS DONE")
}

main().catch((error) => {
    console.error(error)
    process.exit(1)
})
