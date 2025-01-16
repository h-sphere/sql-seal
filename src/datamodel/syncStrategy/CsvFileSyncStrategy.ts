import { App, Component } from "obsidian";
import { TableRegistration } from "../types";
import { ISyncStrategy } from "./abstractSyncStrategy";
import { sanitise } from "src/utils/sanitiseColumn";
import { parse } from "papaparse";
import { FieldTypes, toTypeStatements } from "src/utils/typePredictions";
import { FilepathHasher } from "src/utils/hasher";
import { TableDefinitionConfig } from "./types";
import { SourceType } from "src/grammar/newParser";

export class CsvFileSyncStrategy implements ISyncStrategy {
    constructor(private reg: TableRegistration, private app: App) {

    }

    async tableName() {
        const hash = await FilepathHasher.sha256(`${this.reg.sourceFile}`) // FILENAME is in this case 
        return `file_${hash}`
    }

    static processTableDefinition(config: TableDefinitionConfig) {
            return {
                tableName: config.alias,
                type: config.type as SourceType,
                fileName: config.arguments
            }
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