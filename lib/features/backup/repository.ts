import type { BackupData } from "./types"

export interface BackupRepository {
    exportAll(): Promise<BackupData>
    importAll(data: BackupData): Promise<void>
}
