/**
 * Explorer feature: the workspace shell.
 *
 * Public API is just <Explorer /> — everything else (hooks, tree, content,
 * dialogs) is internal and can be reorganized freely. It composes the other
 * features (topic, dashboard, practice) inside ContentPane.
 */

export { Explorer } from "./components/explorer"
