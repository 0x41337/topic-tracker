/**
 * Browser smoke test for Topic tracker (mouse-only interactions).
 * Run with the dev server up:  bun scripts/smoke.ts
 */
import { chromium } from "playwright"

const BASE_URL = process.env.SMOKE_URL ?? "http://localhost:3000"

async function main(): Promise<void> {
    const browser = await chromium.launch()
    const page = await browser.newPage()
    const problems: string[] = []
    page.on("pageerror", (error) =>
        problems.push(`pageerror: ${error.message}`),
    )
    page.on("console", (message) => {
        if (message.type() === "error" || message.type() === "warning") {
            problems.push(`${message.type()}: ${message.text()}`)
        }
    })

    const check = async (name: string, condition: boolean) => {
        if (!condition) throw new Error(`FAILED: ${name}`)
        console.log(`ok - ${name}`)
    }

    await page.goto(BASE_URL, { waitUntil: "networkidle" })

    const tree = page.getByRole("tree")
    const row = (name: string) =>
        tree.getByRole("treeitem").filter({ hasText: name })

    // 1. Seed tree renders (root folders start expanded on first run).
    await tree.waitFor({ timeout: 15_000 })
    await check("tree visible", true)
    await check("root folder", await row("Portuguese Language").isVisible())
    await check("root folder 2", await row("Mathematics").isVisible())
    await check(
        "home overview chart",
        await page.getByRole("img", { name: "Daily activity" }).isVisible(),
    )

    // 2. Chevron toggles expansion.
    const chevron = (name: string) =>
        row(name).getByRole("button", { name: /Collapse|Expand/ })
    await chevron("Portuguese Language").click()
    await check(
        "collapse hides children",
        !(await row("Phonology").isVisible()),
    )
    await chevron("Portuguese Language").click()
    await check("expand shows children", await row("Phonology").isVisible())

    // 3. Open a nested topic.
    await chevron("Phonology").click()
    await check("nested children", await row("Diphthong").isVisible())
    await row("Diphthong").click()
    await check(
        "topic page shows stats",
        await page.getByText("Hits / Total").isVisible(),
    )
    await check(
        "topic sessions listed",
        await page.getByText("8 / 12 hits").isVisible(),
    )
    await check(
        "practice entry",
        await page.getByRole("button", { name: "Practice" }).isVisible(),
    )

    // 4. Rename via the row's context menu.
    await row("Syntax").click({ button: "right" })
    await page.getByRole("menuitem", { name: "Rename" }).click()
    // The inline input opens focused with its text selected; typing replaces it.
    await page.keyboard.type("Syntax & Grammar")
    await page.keyboard.press("Enter")
    await check("rename applied", await row("Syntax & Grammar").isVisible())

    // 5. Search filter, cleared with the mouse via the X button.
    await page.getByPlaceholder("Search").fill("diph")
    await check("filter keeps match", await row("Diphthong").isVisible())
    await check(
        "filter hides unrelated",
        !(await row("Mathematics").isVisible()),
    )
    await page.getByRole("button", { name: "Clear search" }).click()
    await check(
        "search cleared restores tree",
        await row("Mathematics").isVisible(),
    )

    // 6. Create a folder inside Phonology via context menu.
    await row("Phonology").click({ button: "right" })
    await page.getByRole("menuitem", { name: "New folder" }).click()
    await page.keyboard.type("Prosody")
    await page.keyboard.press("Enter")
    await check("created folder", await row("Prosody").isVisible())

    // 7. Drag & drop the new folder to the root (empty tree background).
    await row("Prosody").dragTo(tree, { targetPosition: { x: 200, y: 420 } })
    await page.waitForTimeout(300)
    const indentAfterRoot = await row("Prosody").evaluate(
        (element) => (element as HTMLElement).style.paddingLeft,
    )
    await check("drag to root reduced indent", indentAfterRoot === "4px")

    // 8. Drag it back into Phonology (depth 2: root > Portuguese > Phonology).
    await row("Prosody").dragTo(row("Phonology"))
    await page.waitForTimeout(300)
    const indentNested = await row("Prosody").evaluate(
        (element) => (element as HTMLElement).style.paddingLeft,
    )
    await check("drag into folder nests it", indentNested === "36px")

    // 9. Multi-select drag: two topics moved at once into Phonology.
    await row("History").click({ button: "right" })
    await page.getByRole("menuitem", { name: "New topic" }).click()
    await page.keyboard.type("Alpha")
    await page.keyboard.press("Enter")
    await check("created topic Alpha", await row("Alpha").isVisible())
    await row("History").click({ button: "right" })
    await page.getByRole("menuitem", { name: "New topic" }).click()
    await page.keyboard.type("Beta")
    await page.keyboard.press("Enter")
    await check("created topic Beta", await row("Beta").isVisible())

    await row("Alpha").click()
    await row("Beta").click({ modifiers: ["ControlOrMeta"] })
    const bothSelected = await page.evaluate(() => {
        return (
            document.querySelectorAll('[data-row][aria-selected="true"]')
                .length === 2
        )
    })
    await check("two rows selected", bothSelected)

    // Deterministic manual drag (dragTo can be flaky with short distances).
    const betaBox = await row("Beta").boundingBox()
    const phonologyBox = await row("Phonology").boundingBox()
    if (!betaBox || !phonologyBox) throw new Error("missing boxes for drag")
    await page.mouse.move(
        betaBox.x + betaBox.width / 2,
        betaBox.y + betaBox.height / 2,
    )
    await page.mouse.down()
    await page.mouse.move(betaBox.x + 20, betaBox.y, { steps: 3 })
    await page.mouse.move(
        phonologyBox.x + phonologyBox.width / 2,
        phonologyBox.y + phonologyBox.height / 2,
        { steps: 10 },
    )
    await page.mouse.up()
    await page.waitForTimeout(300)
    const alphaIndent = await row("Alpha").evaluate(
        (el) => (el as HTMLElement).style.paddingLeft,
    )
    const betaIndent = await row("Beta").evaluate(
        (el) => (el as HTMLElement).style.paddingLeft,
    )
    await check(
        "multi-drag moved both topics",
        alphaIndent === "36px" && betaIndent === "36px",
    )

    // 10. Bulk delete via mouse: click + shift+click selects the visible range,
    // then the context menu deletes everything, and Undo restores it.
    // Let the move toasts from the previous steps expire so exactly one toast
    // (the delete one) is on screen when we click Undo.
    await page.waitForTimeout(4_600)
    await row("History").click()
    await row("Syntax & Grammar").click({ modifiers: ["Shift"] })
    const rangeSelected = await page.evaluate(() => {
        return (
            document.querySelectorAll('[data-row][aria-selected="true"]')
                .length >= 8
        )
    })
    await check("range selection covers the tree", rangeSelected)
    await row("Syntax & Grammar").click({ button: "right" })
    await page.getByRole("menuitem", { name: "Delete" }).click()
    await page
        .getByRole("alertdialog")
        .getByRole("button", { name: "Delete" })
        .click()
    await page.waitForTimeout(300)
    await check(
        "tree empty after delete-all",
        !(await row("Diphthong").isVisible()),
    )
    await page.getByRole("button", { name: "Undo" }).last().click()
    await page.waitForTimeout(300)
    await check("undo restored tree", await row("Diphthong").isVisible())

    // 11. Hover row actions: delete a single item with the trash button.
    await row("Beta").hover()
    await page.getByRole("button", { name: "Delete Beta" }).click()
    await page
        .getByRole("alertdialog")
        .getByRole("button", { name: "Delete" })
        .click()
    await page.waitForTimeout(300)
    await check("hover action deleted topic", !(await row("Beta").isVisible()))

    // 12. Dashboard: tiles, charts, and navigation back into a topic.
    await page.getByRole("button", { name: "Dashboard" }).click()
    await check(
        "dashboard opens",
        await page.getByText("Daily activity").isVisible(),
    )
    await check(
        "daily activity chart rendered",
        await page.getByRole("img", { name: "Daily activity" }).isVisible(),
    )
    await page
        .getByTestId("dashboard")
        .getByRole("button", { name: "Diphthong" })
        .click()
    await check(
        "dashboard ranking opens topic",
        await page.getByText("Hits / Total").isVisible(),
    )
    await check(
        "topic score trend rendered",
        await page
            .getByRole("img", { name: "Cumulative score trend" })
            .isVisible(),
    )
    // Navigating from the ranking closes the dashboard automatically.
    await check(
        "dashboard auto-closes on navigation",
        !(await page.getByText("Daily activity").isVisible()),
    )

    // 12.5 Practice: miss/hit recording on today's session, with undo and finish.
    await page.getByRole("button", { name: "Practice" }).click()
    await check(
        "practice opens",
        await page.getByText("This session").isVisible(),
    )
    const hitsBefore = Number(
        (await page.getByTestId("practice-hits").textContent()) ?? "0",
    )
    const totalBefore = Number(
        (await page.getByTestId("practice-total").textContent()) ?? "0",
    )
    await page.getByRole("button", { name: "Miss answer" }).click()
    await check(
        "miss adds total only",
        (await page.getByTestId("practice-hits").textContent()) ===
            String(hitsBefore) &&
            (await page.getByTestId("practice-total").textContent()) ===
                String(totalBefore + 1),
    )
    await page.getByRole("button", { name: "Hit answer" }).click()
    await page.getByRole("button", { name: "Hit answer" }).click()
    await check(
        "hit adds hits and total",
        (await page.getByTestId("practice-hits").textContent()) ===
            String(hitsBefore + 2) &&
            (await page.getByTestId("practice-total").textContent()) ===
                String(totalBefore + 3),
    )
    await page.getByRole("button", { name: "Undo last" }).click()
    await check(
        "undo reverts last answer",
        (await page.getByTestId("practice-hits").textContent()) ===
            String(hitsBefore + 1) &&
            (await page.getByTestId("practice-total").textContent()) ===
                String(totalBefore + 2),
    )
    await page.getByRole("button", { name: "Hit answer" }).click()
    await page.getByRole("button", { name: "Finish" }).click()
    await check(
        "practice returns to topic",
        await page.getByRole("heading", { name: "Sessions" }).isVisible(),
    )
    await check(
        "practice session persisted",
        await page
            .getByText(`${hitsBefore + 2} / ${totalBefore + 3} hits`)
            .isVisible(),
    )

    // 13. Persistence: reload keeps the rename.
    await page.reload({ waitUntil: "networkidle" })
    await check("rename persisted", await row("Syntax & Grammar").isVisible())

    if (problems.length > 0) {
        console.error("Browser problems:\n" + problems.join("\n"))
        throw new Error("Browser reported console errors or warnings")
    }

    await browser.close()
    console.log("SMOKE TEST PASSED")
}

main().catch((error) => {
    console.error(error)
    process.exit(1)
})
