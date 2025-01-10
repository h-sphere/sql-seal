import { App } from "obsidian";
import { TableRegistration } from "../types";
import { ISyncStrategy } from "./abstractSyncStrategy";
import { sanitise } from "src/utils/sanitiseColumn";
import { parse } from "papaparse";
import { FieldTypes, toTypeStatements } from "src/utils/typePredictions";
import { FilepathHasher } from "src/utils/hasher";

export class FileSyncStrategy implements ISyncStrategy {
    constructor(private reg: TableRegistration, private app: App) {

    }

    async tableName() {
        const hash = await FilepathHasher.sha256(`${this.reg.sourceFile}`) // FILENAME is in this case 
        return `file_${hash}`
    }

    async returnData() {
        const file = this.app.vault.getFileByPath(this.reg.sourceFile)!
        const data = await this.app.vault.cachedRead(file)
        // TODO: PROBABLY SHOULD BE EXTRACTED SOMEWHERE FROM HERE later.
        const parsed = parse<Record<string, string>>(data, {
            header: true,
            dynamicTyping: false,
            skipEmptyLines: true,
            transformHeader: sanitise
        })
        const typeStatements = toTypeStatements(parsed.meta.fields ?? [], parsed.data)
        const columns = Object.entries(typeStatements.types).map(([key, value]) => ({
            name: key,
            type: value as FieldTypes
        }));

        return { columns, data: parsed.data }
    }
}