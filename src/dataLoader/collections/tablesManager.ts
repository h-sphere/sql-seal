import { SqlSealDatabase } from "src/database";
import { FilesManager } from "./filesManager";
import { createSignal, Signal, SignalUnsubscriber } from "src/utils/signal";
import { SignalConstants } from "os";
import { linkTableWithFile } from "../tableSignal";

interface Definition {
    fileName: string;
    unlink: SignalUnsubscriber;
}


export class TablesManager {
    private tableLinks: Map<string, Definition> = new Map()
    private tableSignals: Map<string, Signal<number>> = new Map()
    constructor(private filesManager: FilesManager, private db: SqlSealDatabase) {

    }

    registerTable(tableName: string, fileName: string) {
        if (this.tableLinks.has(tableName)) {
            const { fileName: prevFileName, unlink } = this.tableLinks.get(tableName)!
            if (prevFileName === fileName) {
                console.log('Same filename', fileName)
                return
            }
            console.log('Different Filename')
            unlink()
            this.tableLinks.delete(tableName)
        }
        const fileSignal = this.filesManager.getFileSignal(fileName)
        const tableSignal = this.getTableSignal(tableName)

        const unlink = linkTableWithFile(fileSignal, tableSignal, tableName, this.db)
        this.tableLinks.set(tableName, {
            fileName,
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