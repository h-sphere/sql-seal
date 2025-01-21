import { FilepathHasher } from "../../utils/hasher";
import { TableRegistration } from "../types";
import { ISyncStrategy } from "./abstractSyncStrategy";
import type { App } from "obsidian";
import { Component, MarkdownRenderer } from "obsidian";
import { TableDefinitionConfig } from "./types";
import { SourceType } from "../../grammar/newParser";


interface TableData {
    columns: string[];
    data: Array<Record<string, string>>;
}

export class MarkdownTableSyncStrategy implements ISyncStrategy {
    constructor(private reg: TableRegistration, private app: App) {

    }

    static processTableDefinition(config: TableDefinitionConfig) {
        return {
            tableName: config.alias,
            type: config.type as SourceType,
            fileName: config.sourceFile, //+ '?table=' + config.arguments
            extras: {
                tableNo: parseInt(config.arguments, 10) ?? 0
            }
        }
    }

    async tableName() {
        const hash = await FilepathHasher.sha256(`${this.reg.sourceFile}__${this.reg.fileName}`) // FILENAME is in this case 

        return `mdtable_${hash}`
    }

    async returnData() {

        const tableIndex = this.reg.extras.tableNo
        const file = this.app.vault.getFileByPath(this.reg.sourceFile)!
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
        const headers = Array.from(targetTable.querySelectorAll('th')).map(th => th.textContent?.trim() || '');

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