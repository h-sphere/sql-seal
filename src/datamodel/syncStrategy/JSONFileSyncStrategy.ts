import { App } from "obsidian";
import { ISyncStrategy } from "./abstractSyncStrategy";
import { FilepathHasher } from "../../utils/hasher";
import { ParserTableDefinition } from "./types";
import { parse } from 'json5';
import { uniq } from "lodash";
import * as jsonpath from 'jsonpath'

const DEFAULT_FILE_HASH = ''

export class JsonFileSyncStrategy extends ISyncStrategy {

    static async fromParser(def: ParserTableDefinition, app: App): Promise<JsonFileSyncStrategy> {
    
            const tableSourceFile = def.arguments[0]

            let jsonPath = '$'
            if (def.arguments.length > 1) {
                jsonPath = def.arguments[1]
            }
    
            const path = app.metadataCache.getFirstLinkpathDest(tableSourceFile, def.sourceFile)
            if (!path) {
                throw new Error(`File not found: ${tableSourceFile}`)
            }
            const sourcePath = path.path
            const hash = await FilepathHasher.sha256(`${sourcePath}_${jsonPath}`) // FILENAME is in this case
            const tableName = `file_${hash}`
    
            return new JsonFileSyncStrategy({
                arguments: def.arguments,
                file_hash: DEFAULT_FILE_HASH,
                refresh_id: tableName,
                source_file: sourcePath,
                table_name: tableName,
                type: def.type
            }, app)
        }

    async returnData() {
        const file = this.app.vault.getFileByPath(this.def.source_file)!
        const fileData = await this.app.vault.cachedRead(file)

        let data = parse(fileData)

        let pathQuery = '$'
        if (this.def.arguments.length > 1) {
            pathQuery = this.def.arguments[1]
            data = jsonpath.query(data, pathQuery)
        }

        if(!Array.isArray(data)) {
            throw new Error('Resulting data is not an array')
        }

        const columns = uniq(data.map(d => Object.keys(d)).flat()).map(c => ({ name: c, type: 'auto' as const }))

        return { columns, data: data }
    }
}