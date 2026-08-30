import * as React from "react"

import { cn } from "@/lib/utils"

type LogoProps = React.ComponentProps<"h1"> & {
    size?: "sm" | "default"
}

export function Logo({ size = "default", className, ...props }: LogoProps) {
    switch (size) {
        case "sm":
            return (
                <h1 className={cn("text-sm font-bold", className)} {...props}>
                    Tr
                </h1>
            )
        default:
            return (
                <h1
                    className={cn(
                        "text-sm font-bold cursor-default",
                        className,
                    )}
                    {...props}
                >
                    TopicTracker
                </h1>
            )
    }
}
