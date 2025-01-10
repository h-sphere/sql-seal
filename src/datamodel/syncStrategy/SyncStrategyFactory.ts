import { App } from "obsidian";
import { FileLog } from "../repository/fileLog";
import { TableRegistration } from "../types";
import { ISyncStrategy } from "./abstractSyncStrategy";
import { FileSyncStrategy } from "./FileSyncStrategy";
import { TableSyncStrategy } from "./TableSyncStrategy";

const fileLogToTableRegistration = (log: FileLog): TableRegistration => {
    return {
        aliasName: log.table_name,
        extras: log.extras,
        fileName: log.file_name,
        sourceFile: log.file_name, // ???? probably not needed here
        type: log.type
    }
}

export class SyncStrategyFactory {
    static getStrategy(reg: TableRegistration, app: App): ISyncStrategy {
        switch (reg.type) {
            case 'file':
                return new FileSyncStrategy(reg, app)
            case 'table':
                return new TableSyncStrategy(reg, app)
        }
    }

    static getStrategyByFileLog(log: FileLog, app: App) {
        return SyncStrategyFactory.getStrategy(fileLogToTableRegistration(log), app)
    }
}