import { FilepathHasher } from "../../utils/hasher";
import { ISyncStrategy } from "./abstractSyncStrategy";
import type { App } from "obsidian";
import { Component, MarkdownRenderer } from "obsidian";
import { ParserTableDefinition } from "./types";

const DEFAULT_FILE_HASH = ''


export class MarkdownTableSyncStrategy extends ISyncStrategy {

    static async fromParser(def: ParserTableDefinition, app: App): Promise<MarkdownTableSyncStrategy> {
        const index = def.arguments[0]
        const hash = await FilepathHasher.sha256(`${def.sourceFile}`) // FILENAME is in this case
        const tableName = `mdtable_${hash}_${index}`
        return new MarkdownTableSyncStrategy({
            arguments: def.arguments,
            file_hash: DEFAULT_FILE_HASH,
            refresh_id: tableName,
            source_file: def.sourceFile,
            table_name: tableName,
            type: def.type
        }, app)
    }

    async returnData() {

        const tableIndex = parseInt(this.def.arguments[0], 10)
        const file = this.app.vault.getFileByPath(this.def.source_file)!
        const content = await this.app.vault.read(file);

        // Create a temporary div to render the markdown
        const tempDiv = document.createElement('div');

        // Use Obsidian's MarkdownRenderer to parse the content
        const component = new Component()

        await MarkdownRenderer.render(this.app, content, tempDiv, file.path, component)

        // Find all tables in the rendered content
        const tables = tempDiv.querySelectorAll('table');

        // Check if the requested table exists
        if (tableIndex >= tables.length) {
            return { data: [], columns: [] };
        }

        const targetTable = tables[tableIndex];

        // Extract headers
        const headers = Array.from(targetTable.querySelectorAll('th')).map(th => th.textContent?.trim() || '').filter(x => !!x);

        // Extract rows
        const rows = Array.from(targetTable.querySelectorAll('tr')).slice(1); // Skip header row

        // Parse data
        const data = rows.map(row => {
            const cells = Array.from(row.querySelectorAll('td')).map(td => td.textContent?.trim() || '');

            return headers.reduce((obj, header, index) => {
                obj[header] = cells[index] || '';
                return obj;
            }, {} as Record<string, string>);
        });

        return {
            data,
            columns: headers ?? []
        };
    }
}