import { FolderIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

import {
    Empty,
    EmptyTitle,
    EmptyHeader,
    EmptyMedia,
    EmptyContent,
    EmptyDescription,
} from "@/components/ui/empty"

export function NoTopicsFound() {
    return (
        <Empty>
            <EmptyHeader>
                <EmptyMedia variant="icon">
                    <FolderIcon />
                </EmptyMedia>
                <EmptyTitle>No topics yet</EmptyTitle>
                <EmptyDescription>
                    You haven&apos;t created any topic yet. Get started by
                    creating your first topic.
                </EmptyDescription>
            </EmptyHeader>
            <EmptyContent className="flex-row justify-center gap-2">
                <Button>Create Topic</Button>
                <Button variant="outline">Import backup</Button>
            </EmptyContent>
        </Empty>
    )
}
