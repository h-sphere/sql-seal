import { Signal, SignalUnsubscriber } from "src/utils/signal";
import { dataTransformer, DataTransformerOut } from "../dataTransformer";
import { CSVData, csvFileSignal } from "../csvFile";
import { App, TFile, Vault } from "obsidian";
import { isNull } from "lodash";
import { SqlSealDatabase } from "src/database";
import { SyncModel } from "src/models/sync";

export class FilesManager {
    files: Map<string, Signal<DataTransformerOut>> = new Map()
    inputFiles: Map<string, Signal<CSVData>> = new Map()
    unregisters: Array<SignalUnsubscriber> = []
    syncModel: SyncModel
    constructor(private vault: Vault, private app: App, private db: SqlSealDatabase) {
        this.syncModel = new SyncModel(this.db)
        this.vault.on('modify', async (file) => {
            if (this.files.has(file.path)) {
                this.inputFiles.get(file.path)!(await this.loadFile(file.path))
            }
        })
    }

    private async loadFile(url: string, sourcePath?: string) {
        let file: TFile | null;
        if (sourcePath) {
            file = this.app.metadataCache.getFirstLinkpathDest(url, sourcePath)
        } else {
            file = this.vault.getFileByPath(url)
        }
        if (!file) {
            return ''
        }
        const data = await this.vault.cachedRead(file)
        return data
    }

    getFile(url: string, sourcePath: string = '/') {
        return this.app.metadataCache.getFirstLinkpathDest(url, sourcePath)
    }

    getFileHandler(url: string, sourcePath?: string) {
        let file: TFile | null;
        if (sourcePath) {
            file = this.app.metadataCache.getFirstLinkpathDest(url, sourcePath)
        } else {
            file = this.vault.getFileByPath(url)
        }
    }

    doesFileExist(url: string, sourcePath: string) {
        const file = this.app.metadataCache.getFirstLinkpathDest(url, sourcePath)
        return !isNull(file)
    }

    destroy() {
        this.unregisters.forEach(u => u())
    }

    private saveManagedRecord(filename: string, checksum: string) {

    }

    getFileSignal(filename: string): Signal<DataTransformerOut> {
        if (this.files.has(filename)) {
            return this.files.get(filename)!
        }
        const fileSignal = csvFileSignal(filename)
        const signal = dataTransformer(fileSignal)

        // Check if it's already in the database, if so, we can just load it again.
        this.db

        // FIXME: add here ability to watch changes.

        this.files.set(filename, signal)
        this.inputFiles.set(filename, fileSignal)
        this.loadFile(filename).then(fileSignal)

        return signal
    }

    addUnregister(unreg: SignalUnsubscriber) {
        this.unregisters.push(unreg)
    }
}