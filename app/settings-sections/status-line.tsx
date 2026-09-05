import { CheckCircle2Icon, XCircleIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export function StatusLine({
    tone,
    children,
    onDismiss,
}: {
    tone: "success" | "error"
    children: React.ReactNode
    onDismiss?: () => void
}) {
    const Icon = tone === "success" ? CheckCircle2Icon : XCircleIcon
    return (
        <div
            className={cn(
                "mt-2 flex items-center gap-1.5 text-xs",
                tone === "success"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-600 dark:text-red-400",
            )}
        >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span className="flex-1">{children}</span>
            {onDismiss && (
                <button
                    type="button"
                    onClick={onDismiss}
                    className="text-muted-foreground hover:text-foreground"
                >
                    Dismiss
                </button>
            )}
        </div>
    )
}
