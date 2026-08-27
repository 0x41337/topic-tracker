import { readFileSync, writeFileSync } from "node:fs"

/* ---------- practice-view.tsx: simple toast ---------- */
{
    const file = "src/components/explorer/practice-view.tsx"
    let code = readFileSync(file, "utf8")
    const old = [
        "      toast.success(",
        "        `Session saved \\u2014 ${hits}/${total} (${formatPercent(hits / total)})`,",
        "      );",
    ].join("\n")
    const rep = '      toast.success("Session saved");'
    if (!code.includes(old)) throw new Error("practice toast anchor not found")
    code = code.replace(old, rep)
    writeFileSync(file, code)
}

/* ---------- explorer.tsx: simple toasts ---------- */
{
    const file = "src/components/explorer/explorer.tsx"
    let code = readFileSync(file, "utf8")

    const oldDelete = [
        '    toast.success(count === 1 ? "Deleted 1 item" : `Deleted ${count} items`, {',
        '      action: { label: "Undo", onClick: () => store.undoDelete() },',
        "    });",
    ].join("\n")
    const newDelete = [
        '    toast.success("Deleted", {',
        '      action: { label: "Undo", onClick: () => store.undoDelete() },',
        "    });",
    ].join("\n")
    if (!code.includes(oldDelete))
        throw new Error("delete toast anchor not found")
    code = code.replace(oldDelete, newDelete)

    const oldImportErr =
        '      toast.error("Invalid export file. Expected a Tracktree JSON export.");'
    const newImportErr = '      toast.error("Invalid file");'
    if (!code.includes(oldImportErr))
        throw new Error("import error anchor not found")
    code = code.replace(oldImportErr, newImportErr)

    const oldMove = [
        '    toast.success(moved === 1 ? "Moved 1 item" : `Moved ${moved} items`, {',
        '      action: { label: "Undo", onClick: () => store.undoMove() },',
        "    });",
    ].join("\n")
    const newMove = [
        '    toast.success("Moved", {',
        '      action: { label: "Undo", onClick: () => store.undoMove() },',
        "    });",
    ].join("\n")
    if (!code.includes(oldMove)) throw new Error("move toast anchor not found")
    code = code.replace(oldMove, newMove)

    writeFileSync(file, code)
}

/* ---------- layout.tsx: rename app ---------- */
{
    const file = "src/app/layout.tsx"
    let code = readFileSync(file, "utf8")
    const old = [
        '  title: "Tracktree",',
        '  description: "A tree explorer for study topics with performance tracking.",',
    ].join("\n")
    const rep = [
        '  title: "Topic tracker",',
        '  description: "Track your performance across study topics.",',
    ].join("\n")
    if (!code.includes(old)) throw new Error("layout anchor not found")
    code = code.replace(old, rep)
    writeFileSync(file, code)
}

/* ---------- toolbar.tsx: brand + settings icon ---------- */
{
    const file = "src/components/explorer/toolbar.tsx"
    let code = readFileSync(file, "utf8")

    const brandOld = `<span className="text-sm font-medium tracking-tight">Tracktree</span>`
    const brandNew = `<span className="text-sm font-medium tracking-tight">Topic tracker</span>`
    if (!code.includes(brandOld)) throw new Error("brand anchor not found")
    code = code.replace(brandOld, brandNew)

    code = code.replace("  MoreHorizontal,", "  Settings,")
    const menuOld = [
        '            <Button variant="ghost" size="icon" className="size-8" aria-label="More options">',
        '              <MoreHorizontal className="size-4" />',
        "            </Button>",
    ].join("\n")
    const menuNew = [
        '            <Button variant="ghost" size="icon" className="size-8" aria-label="Settings">',
        '              <Settings className="size-4" />',
        "            </Button>",
    ].join("\n")
    if (!code.includes(menuOld)) throw new Error("menu button anchor not found")
    code = code.replace(menuOld, menuNew)

    const dlOld =
        "anchor.download = `tracktree-export-${new Date().toISOString().slice(0, 10)}.json`;"
    const dlNew =
        "anchor.download = `topic-tracker-export-${new Date().toISOString().slice(0, 10)}.json`;"
    if (!code.includes(dlOld)) throw new Error("download anchor not found")
    code = code.replace(dlOld, dlNew)

    writeFileSync(file, code)
}

console.log("rename + settings + toasts done")
