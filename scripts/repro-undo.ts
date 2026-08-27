/**
 * Fuzzes the practice screen with random hit/miss/undo sequences and asserts
 * the score DOM never accumulates stale spans.
 */
import { chromium } from "playwright"

const BASE_URL = process.env.SMOKE_URL ?? "http://localhost:3000"

async function main(): Promise<void> {
    const browser = await chromium.launch()
    const page = await browser.newPage()
    await page.goto(BASE_URL, { waitUntil: "networkidle" })

    const tree = page.getByRole("tree")
    const row = (name: string) =>
        tree.getByRole("treeitem").filter({ hasText: name })
    await tree.waitFor({ timeout: 15_000 })
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
    await page.getByText("This session").waitFor()

    // Deterministic pseudo-random sequence with plenty of undos.
    let seed = 42
    const random = (): number => {
        seed = (seed * 1103515245 + 12345) % 2147483648
        return seed / 2147483648
    }

    const actions: Array<"hit" | "miss" | "undo"> = []
    for (let i = 0; i < 120; i++) {
        const roll = random()
        actions.push(roll < 0.45 ? "hit" : roll < 0.8 ? "miss" : "undo")
    }

    // Simulated expected values.
    let hits = 0
    let total = 0
    const stack: Array<boolean> = []

    let failures = 0
    for (let i = 0; i < actions.length; i++) {
        const action = actions[i]
        if (action === "hit") {
            await page.getByRole("button", { name: "Hit answer" }).click()
            hits += 1
            total += 1
            stack.push(true)
        } else if (action === "miss") {
            await page.getByRole("button", { name: "Miss answer" }).click()
            total += 1
            stack.push(false)
        } else {
            const enabled = await page
                .getByRole("button", { name: "Undo last" })
                .isEnabled()
            await page.getByRole("button", { name: "Undo last" }).click()
            if (enabled && stack.length > 0) {
                if (stack.pop()) hits -= 1
                total -= 1
            }
            if (total === 0) {
                // Session disappears; simulate fresh stack.
                stack.length = 0
            }
        }

        const hitsCount = await page
            .locator('[data-testid="practice-hits"]')
            .count()
        const totalCount = await page
            .locator('[data-testid="practice-total"]')
            .count()
        const hitsText =
            (await page.getByTestId("practice-hits").textContent()) ?? ""
        const totalText =
            (await page.getByTestId("practice-total").textContent()) ?? ""
        if (
            hitsCount !== 1 ||
            totalCount !== 1 ||
            hitsText !== String(hits) ||
            totalText !== String(total)
        ) {
            failures += 1
            if (failures <= 5) {
                console.log(
                    `BUG at step ${i} (${action}): spans(hits=${hitsCount}, total=${totalCount}) text=(${hitsText}/${totalText}) expected=(${hits}/${total})`,
                )
            }
        }
    }

    console.log(`sequence length: ${actions.length}, failures: ${failures}`)

    // Dedicated regression: undo at 0/0 must be disabled and must never regress
    // below zero, no matter how many extra undos are clicked.
    let undoFails = 0
    const assertZero = async (label: string) => {
        const hitsText =
            (await page.getByTestId("practice-hits").textContent()) ?? ""
        const totalText =
            (await page.getByTestId("practice-total").textContent()) ?? ""
        const undoEnabled = await page
            .getByRole("button", { name: "Undo last" })
            .isEnabled()
        const spanCount = await page
            .locator('[data-testid="practice-hits"]')
            .count()
        if (
            hitsText !== "0" ||
            totalText !== "0" ||
            undoEnabled ||
            spanCount !== 1
        ) {
            undoFails += 1
            console.log(
                `BUG (${label}): hits=${hitsText} total=${totalText} undoEnabled=${undoEnabled} spans=${spanCount}`,
            )
        }
    }

    // Reset to a clean 0/0 through undos (until the counter really hits zero).
    for (let i = 0; i < 300; i++) {
        const totalText =
            (await page.getByTestId("practice-total").textContent()) ?? ""
        if (totalText === "0") break
        const enabled = await page
            .getByRole("button", { name: "Undo last" })
            .isEnabled()
        if (!enabled) break
        await page.getByRole("button", { name: "Undo last" }).click()
    }
    await assertZero("after reset")
    await page.getByRole("button", { name: "Undo last" }).click({ force: true })
    await assertZero("extra undo at zero")
    await page.getByRole("button", { name: "Hit answer" }).click()
    await page.getByRole("button", { name: "Undo last" }).click()
    await assertZero("hit then undo")
    await page.getByRole("button", { name: "Undo last" }).click({ force: true })
    await page.getByRole("button", { name: "Undo last" }).click({ force: true })
    await assertZero("double extra undo at zero")
    console.log(`zero-guard failures: ${undoFails}`)
    if (undoFails > 0) failures += undoFails
    await browser.close()
    if (failures > 0) process.exit(1)
    console.log("NO ACCUMULATION - clean")
}

main().catch((error) => {
    console.error(error)
    process.exit(1)
})
