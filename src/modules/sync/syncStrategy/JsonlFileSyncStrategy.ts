import { App } from "obsidian";
import { ISyncStrategy } from "./abstractSyncStrategy";
import { ParserTableDefinition } from "./types";
import { parse } from 'json5';
import { uniq } from "lodash";
import { FilepathHasher } from "../../../utils/hasher";

const DEFAULT_FILE_HASH = ''

export class JsonlFileSyncStrategy extends ISyncStrategy {

    static async fromParser(def: ParserTableDefinition, app: App): Promise<JsonlFileSyncStrategy> {
        const tableSourceFile = def.arguments[0]

        const path = app.metadataCache.getFirstLinkpathDest(tableSourceFile, def.sourceFile)
        if (!path) {
            throw new Error(`File not found: ${tableSourceFile}`)
        }
        const sourcePath = path.path
        const hash = await FilepathHasher.sha256(sourcePath)
        const tableName = `file_${hash}`

        return new JsonlFileSyncStrategy({
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

        const lines = fileData.split('\n')
        const data: Record<string, unknown>[] = []

        for (let i = 0; i < lines.length; i++) {
            // Strip BOM from first line and trim whitespace/CRLF
            const line = (i === 0 ? lines[i].replace(/^\uFEFF/, '') : lines[i]).trim()

            if (!line) {
                continue
            }

            try {
                const parsed = parse(line)
                if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
                    console.warn(`SQLSeal JSONL: skipping line ${i + 1} — expected a JSON object`)
                    continue
                }
                data.push(parsed)
            } catch (e) {
                console.warn(`SQLSeal JSONL: skipping malformed line ${i + 1}:`, e)
            }
        }

        const columns = uniq(data.flatMap(d => Object.keys(d))).map(c => ({ name: c, type: 'auto' as const }))

        return { columns, data }
    }
}
