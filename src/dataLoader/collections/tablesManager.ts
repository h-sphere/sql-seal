import { SqlSealDatabase } from "src/database";
import { FilesManager } from "./filesManager";
import { createSignal, Signal, SignalUnsubscriber } from "src/utils/signal";
import { linkTableWithFile } from "../tableSignal";
import { FileManager } from "obsidian";
import { isNull } from "lodash";

interface Definition {
    fileName: string;
    unlink: SignalUnsubscriber;
}


export class TablesManager {
    private tableLinks: Map<string, Definition> = new Map()
    private tableSignals: Map<string, Signal<number>> = new Map()
    constructor(private filesManager: FilesManager, private db: SqlSealDatabase) {

    }

    registerTable(tableName: string, fileName: string, parentPath: string) {
        const file = this.filesManager.getFile(fileName, parentPath)
        if (isNull(file)) {
            throw new Error(`File ${fileName} does not exist`)
        }

        if (this.tableLinks.has(tableName)) {
            const { fileName: prevFileName, unlink } = this.tableLinks.get(tableName)!
            if (prevFileName === file.path) {
                return
            }
            unlink()
            this.tableLinks.delete(tableName)
        }
        const resolvedFileName = file.path
        const fileSignal = this.filesManager.getFileSignal(resolvedFileName)
        const tableSignal = this.getTableSignal(tableName)

        const unlink = linkTableWithFile(fileSignal, tableSignal, tableName, this.db)
        this.tableLinks.set(tableName, {
            fileName: resolvedFileName,
            unlink
        })
    }

    getTableSignal(tableName: string, failOnUndefined: boolean = false) {
        if (!this.tableSignals.has(tableName)) {
            if (failOnUndefined) {
                throw new Error(`${tableName} does not exist`)
            }
            this.tableSignals.set(tableName, createSignal<number>())
        }
        return this.tableSignals.get(tableName)!
    }
}