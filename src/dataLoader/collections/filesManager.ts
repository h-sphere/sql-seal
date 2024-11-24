import { Signal, SignalUnsubscriber } from "src/utils/signal";
import { dataTransformer, DataTransformerOut } from "../dataTransformer";
import { csvFileSignal } from "../csvFile";
import { App, TFile, Vault } from "obsidian";
import { isNull } from "lodash";

export class FilesManager {
    files: Map<string, Signal<DataTransformerOut>> = new Map()
    inputFiles: Map<string, Signal<string>> = new Map()
    unregisters: Array<SignalUnsubscriber> = []
    constructor(private vault: Vault, private app: App) {
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

    getFile(url: string, sourcePath: string) {
        return this.app.metadataCache.getFirstLinkpathDest(url, sourcePath)
    }

    doesFileExist(url: string, sourcePath: string) {
        const file = this.app.metadataCache.getFirstLinkpathDest(url, sourcePath)
        return !isNull(file)
    }

    destroy() {
        this.unregisters.forEach(u => u())
    }

    getFileSignal(filename: string): Signal<DataTransformerOut> {
        if (this.files.has(filename)) {
            return this.files.get(filename)!
        }
        const fileSignal = csvFileSignal(filename)
        const signal = dataTransformer(fileSignal)

        // FIXME: add here ability to watch changes.

        this.files.set(filename, signal)
        this.inputFiles.set(filename, fileSignal)

        // now firing signal for the file
        this.loadFile(filename).then(fileSignal)

        return signal
    }

    addUnregister(unreg: SignalUnsubscriber) {
        this.unregisters.push(unreg)
    }
}