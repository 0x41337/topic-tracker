"use client"

import type { TreeNodeData } from "@/lib/features/topics/types"

interface TopicMetadataCardProps {
    item: TreeNodeData
}

export function TopicMetadataCard({ item }: TopicMetadataCardProps) {
    const formattedDate = item.createdAt
        ? new Date(item.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
          })
        : "Unknown"

    return (
        <div className="rounded-md border p-4">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {item.type === "folder" ? "Folder" : "Topic"}
                    </p>
                    <h2 className="mt-1 text-xl font-semibold">{item.name}</h2>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                    <p>Created</p>
                    <p className="font-medium">{formattedDate}</p>
                </div>
            </div>
        </div>
    )
}
