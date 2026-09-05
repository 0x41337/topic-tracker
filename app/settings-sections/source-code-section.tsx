import { CodeIcon } from "lucide-react"

export function SourceCodeSection() {
    return (
        <section className="space-y-3 rounded-lg border bg-card p-4">
            <div>
                <h2 className="text-sm font-semibold text-foreground">
                    Source code
                </h2>
                <p className="text-xs text-muted-foreground">
                    Topic Tracker is open source. Report issues or contribute on
                    GitHub.
                </p>
            </div>
            <a
                href="https://github.com/0x41337/topic-tracker"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center gap-1.5 rounded-md border bg-background px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
                <CodeIcon className="h-4 w-4" />
                View on GitHub
            </a>
        </section>
    )
}
