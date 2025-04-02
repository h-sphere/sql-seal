import { ISyncStrategy } from "./abstractSyncStrategy";
import { sanitise } from "../../utils/sanitiseColumn";
import { parse } from "papaparse";
import { FilepathHasher } from "../../utils/hasher";
import { TableDefinitionExternal } from "../repository/tableDefinitions";
import { ParserTableDefinition } from "./types";
import { App } from "obsidian";

const DEFAULT_FILE_HASH = ''


export class CsvFileSyncStrategy extends ISyncStrategy {


    static async fromParser(def: ParserTableDefinition, app: App): Promise<CsvFileSyncStrategy> {

        const tableSourceFile = def.arguments[0]

        const path = app.metadataCache.getFirstLinkpathDest(tableSourceFile, def.sourceFile)
        if (!path) {
            throw new Error(`File not found: ${tableSourceFile}`)
        }
        const sourcePath = path.path
        const hash = await FilepathHasher.sha256(`${sourcePath}`) // FILENAME is in this case
        const tableName = `file_${hash}`

        return new CsvFileSyncStrategy({
            arguments: def.arguments,
            file_hash: DEFAULT_FILE_HASH,
            refresh_id: tableName,
            source_file: sourcePath,
            table_name: tableName,
            type: def.type
        }, app)
    }

    async toTableDefinition(): Promise<TableDefinitionExternal> {
        const tableSourceFile = this.def.arguments[0]
        const hash = await FilepathHasher.sha256(`${tableSourceFile}`) // FILENAME is in this case
        const def = this.def
        const tableName = `file_${hash}`
        return {
            arguments: def.arguments,
            file_hash: DEFAULT_FILE_HASH,
            refresh_id: tableName,
            source_file: tableSourceFile,
            table_name: tableName,
            type: def.type
        }
    }

    async returnData() {
        const file = this.app.vault.getFileByPath(this.def.source_file)!
        const data = await this.app.vault.cachedRead(file)

        // TODO: PROBABLY SHOULD BE EXTRACTED SOMEWHERE FROM HERE later.
        const parsed = parse<Record<string, string>>(data, {
            header: true,
            dynamicTyping: false,
            skipEmptyLines: true,
            transformHeader: sanitise
        })
        // const typeStatements = toTypeStatements(parsed.meta.fields ?? [], parsed.data)
        // const columns = Object.entries(typeStatements.types).map(([key, value]) => ({
        //     name: key,
        //     type: value as FieldTypes
        // }));

        return { data: parsed.data, columns: parsed.meta.fields ?? [] }
    }
}