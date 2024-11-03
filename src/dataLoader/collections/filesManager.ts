import { Signal, SignalUnsubscriber } from "src/utils/signal";
import { dataTransformer, DataTransformerOut } from "../dataTransformer";
import { csvFileSignal } from "../csvFile";
import { Vault } from "obsidian";

export class FilesManager {
    files: Map<string, Signal<DataTransformerOut>> = new Map()
    inputFiles: Map<string, Signal<string>> = new Map()
    unregisters: Array<SignalUnsubscriber> = []
    constructor(private vault: Vault) {
        this.vault.on('modify', async (file) => {
            if (this.files.has(file.path)) {
                this.inputFiles.get(file.path)!(await this.loadFile(file.path))
            }
        })
    }

    private async loadFile(url: string) {
        const file = this.vault.getFileByPath(url)

        if (!file) {
            return ''
        }
        const data = await this.vault.cachedRead(file)
        return data
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