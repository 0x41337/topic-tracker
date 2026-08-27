/** Captures every console message and page error during a full usage session. */
import { chromium } from "playwright"

const BASE_URL = process.env.SMOKE_URL ?? "http://localhost:3000"

async function main(): Promise<void> {
    const browser = await chromium.launch()
    const page = await browser.newPage()
    page.on("console", (message) => {
        const type = message.type()
        if (type === "error" || type === "warning") {
            console.log(`[${type}] ${message.text().slice(0, 600)}`)
        }
    })
    page.on("pageerror", (error) =>
        console.log(`[pageerror] ${error.message.slice(0, 600)}`),
    )

    await page.goto(BASE_URL, { waitUntil: "networkidle" })
    const tree = page.getByRole("tree")
    const row = (name: string) =>
        tree.getByRole("treeitem").filter({ hasText: name })
    await tree.waitFor({ timeout: 15_000 })

    // Exercise the main interactions to surface runtime warnings.
    if (!(await row("Phonology").isVisible())) {
        await row("Portuguese Language").getByRole("button").click()
    }
    if (!(await row("Diphthong").isVisible())) {
        await row("Phonology").getByRole("button").click()
    }
    await row("Diphthong").click()
    await page.waitForTimeout(300)

    // Context menu.
    await row("Syntax").click({ button: "right" })
    await page.keyboard.press("Escape")
    await page.waitForTimeout(200)

    // Delete dialog open/cancel.
    await row("Syntax").click({ button: "right" })
    await page.getByRole("menuitem", { name: "Delete" }).click()
    await page
        .getByRole("alertdialog")
        .getByRole("button", { name: "Cancel" })
        .click()
    await page.waitForTimeout(300)

    // Create + rename inline inputs.
    await row("Syntax").click({ button: "right" })
    await page.getByRole("menuitem", { name: "New topic" }).click()
    await page.keyboard.type("Probe")
    await page.keyboard.press("Enter")
    await row("Probe").click({ button: "right" })
    await page.getByRole("menuitem", { name: "Rename" }).click()
    await page.keyboard.type("Probe2")
    await page.keyboard.press("Enter")
    await row("Probe2").click({ button: "right" })
    await page.getByRole("menuitem", { name: "Delete" }).click()
    await page
        .getByRole("alertdialog")
        .getByRole("button", { name: "Delete" })
        .click()
    await page.waitForTimeout(500)

    // Data menu open/close.
    await page.getByRole("button", { name: "More options" }).click()
    await page.getByRole("menuitem", { name: "Expand all" }).click()
    await page.waitForTimeout(300)

    await browser.close()
    console.log("DIAGNOSTIC DONE")
}

main().catch((error) => {
    console.error(error)
    process.exit(1)
})
