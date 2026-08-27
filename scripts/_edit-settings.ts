import { readFileSync, writeFileSync } from "node:fs"

const file = "src/components/explorer/toolbar.tsx"
let code = readFileSync(file, "utf8")

const themeBlock = `            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <SunMoon className="size-4" /> Theme
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onSelect={() => setTheme("light")}>
                  <Sun className="size-4" /> Light
                  {theme === "light" ? <Check className="ml-auto size-4" /> : null}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setTheme("dark")}>
                  <Moon className="size-4" /> Dark
                  {theme === "dark" ? <Check className="ml-auto size-4" /> : null}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setTheme("system")}>
                  <Monitor className="size-4" /> System
                  {theme === "system" ? <Check className="ml-auto size-4" /> : null}
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
`

// 1. Remove the theme block from its current position (with its preceding separator).
const withSep = "            <DropdownMenuSeparator />\n" + themeBlock
if (!code.includes(withSep)) throw new Error("theme block not found")
code = code.replace(withSep, "")

// 2. Re-insert at the top, followed by a separator.
const menuOpen = `          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onSelect={ctx.expandAll}>`
const menuNew =
    `          <DropdownMenuContent align="end" className="w-52">
` +
    themeBlock +
    `            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={ctx.expandAll}>`
if (!code.includes(menuOpen)) throw new Error("menu open anchor not found")
code = code.replace(menuOpen, menuNew)

// 3. Simplify labels.
code = code.replace(
    `<Download className="size-4" /> Export data (JSON)`,
    `<Download className="size-4" /> Export data`,
)
code = code.replace(
    `<Upload className="size-4" /> Import data…`,
    `<Upload className="size-4" /> Import data`,
)

writeFileSync(file, code)
console.log("settings menu updated")
