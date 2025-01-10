import { FilepathHasher } from "src/utils/hasher";
import { TableRegistration } from "../types";
import { ISyncStrategy } from "./abstractSyncStrategy";
import { App, MarkdownRenderer, TFile } from "obsidian";
import { FieldTypes, toTypeStatements } from "src/utils/typePredictions";


interface TableData {
    columns: string[];
    data: Array<Record<string, string>>;
}

export class TableSyncStrategy implements ISyncStrategy {
    constructor(private reg: TableRegistration, private app: App) {

    }

    async tableName() {
        const hash = await FilepathHasher.sha256(`${this.reg.sourceFile}__${this.reg.fileName}`) // FILENAME is in this case 

        return `mdtable_${hash}`
    }

    async returnData() {

        const tableIndex = this.reg.extras.tableNo
        console.log('TABLE INDEX', tableIndex)
        const file = this.app.vault.getFileByPath(this.reg.sourceFile)!
        // Get the file content
        const content = await this.app.vault.read(file);

        // Create a temporary div to render the markdown
        const tempDiv = document.createElement('div');

        // Use Obsidian's MarkdownRenderer to parse the content
        await MarkdownRenderer.renderMarkdown(content, tempDiv, file.path, null);

        // Find all tables in the rendered content
        const tables = tempDiv.querySelectorAll('table');

        // Check if the requested table exists
        if (tableIndex >= tables.length) {
            return null;
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

        const typeStatements = toTypeStatements(headers ?? [], data)
        const columns = Object.entries(typeStatements.types).map(([key, value]) => ({
            name: key,
            type: value as FieldTypes
        }));

        return {
            columns,
            data
        };
    }
}