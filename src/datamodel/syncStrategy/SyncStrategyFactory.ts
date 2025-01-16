import { App } from "obsidian";
import { FileLog } from "../repository/fileLog";
import { TableRegistration } from "../types";
import { ISyncStrategy } from "./abstractSyncStrategy";
import { CsvFileSyncStrategy } from "./CsvFileSyncStrategy";
import { MarkdownTableSyncStrategy } from "./MarkdownTableSyncStrategy";

const fileLogToTableRegistration = (log: FileLog): TableRegistration => {
    return {
        aliasName: log.table_name,
        extras: log.extras,
        fileName: log.file_name,
        sourceFile: log.file_name, // ???? probably not needed here
        type: log.type
    }
}

const resolveFileStrategy = (filename: string) => {
    const parts = filename.split('.')
    const extension = parts[parts.length - 1].toLowerCase()

    switch (extension) {
        case 'csv':
            return CsvFileSyncStrategy
        default:
            throw new Error(`No file processor for extension ${extension}`)
    }
}

export class SyncStrategyFactory {
    static getStrategy(reg: TableRegistration, app: App): ISyncStrategy {
        switch (reg.type) {
            case 'file':
                const Cls = resolveFileStrategy(reg.fileName)
                return new Cls(reg, app)
            case 'table':
                return new MarkdownTableSyncStrategy(reg, app)
        }
    }

    static getStaticStrategyReference(type: string) {
        switch (type) {
            case 'csv-file':
                return CsvFileSyncStrategy
            case 'table':
                return MarkdownTableSyncStrategy
        }
    }

    static getStrategyByFileLog(log: FileLog, app: App) {
        return SyncStrategyFactory.getStrategy(fileLogToTableRegistration(log), app)
    }
}