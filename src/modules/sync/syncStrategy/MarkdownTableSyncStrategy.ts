import { ISyncStrategy } from "./abstractSyncStrategy";
import type { App } from "obsidian";
import { Component, MarkdownRenderer, normalizePath } from "obsidian";
import { ParserTableDefinition } from "./types";
import { dirname, join } from "path";
import { FilepathHasher } from "../../../utils/hasher";
import { sanitise } from "../../../utils/sanitiseColumn";

const DEFAULT_FILE_HASH = ''

// Prefix used to identify file path in arguments
const FILE_PREFIX = 'file:';

export class MarkdownTableSyncStrategy extends ISyncStrategy {

    static async fromParser(def: ParserTableDefinition, app: App): Promise<MarkdownTableSyncStrategy> {
        const args = def.arguments
        
        // Check if the first argument specifies a file
        let sourceFile = def.sourceFile;
        let argsToUse = [...args];
        
        if (args[0]?.startsWith(FILE_PREFIX)) {
            let filePath = args[0].substring(FILE_PREFIX.length);
            
            if (filePath.startsWith('./') || filePath.startsWith('../')) {
                const currentDir = dirname(def.sourceFile);
                filePath = normalizePath(join(currentDir, filePath));
            }
            
            const hasExtension = filePath.lastIndexOf('.') > filePath.lastIndexOf('/');
            if (!hasExtension) {
                filePath += '.md';
            }
            
            sourceFile = filePath;
            
            // Remove the file path from the arguments
            argsToUse = args.slice(1);
            
            // If no arguments are left, default to index 0
            if (argsToUse.length === 0) {
                argsToUse = ['0'];
            }
        }
        
        const headerOrIndex = argsToUse[0];
        const secondParam = argsToUse.length > 1 ? argsToUse[1] : undefined;
        const hash = await FilepathHasher.sha256(`${sourceFile}`);
        
        // Create a safe tableName using the existing sanitise function
        const safeHeaderOrIndex = sanitise(headerOrIndex);
        const safeSecondParam = secondParam ? sanitise(secondParam) : '';
        const tableName = `mdtable_${hash}_${safeHeaderOrIndex}${safeSecondParam ? `_${safeSecondParam}` : ''}`;
        
        return new MarkdownTableSyncStrategy({
            arguments: argsToUse,
            file_hash: DEFAULT_FILE_HASH,
            refresh_id: tableName,
            source_file: sourceFile,
            table_name: tableName,
            type: def.type
        }, app);
    }

    async returnData() {
        const file = this.app.vault.getFileByPath(this.def.source_file)!;
        if (!file) {
            return { data: [], columns: [] };
        }
        
        const content = await this.app.vault.read(file);

        // Create a temporary div to render the markdown
        const tempDiv = document.createElement('div');

        // Use Obsidian's MarkdownRenderer to parse the content
        const component = new Component();
        await MarkdownRenderer.render(this.app, content, tempDiv, file.path, component);

        const headerOrIndex = this.def.arguments[0];
        const secondParam = this.def.arguments.length > 1 ? this.def.arguments[1] : undefined;
        
        // Check if first argument is a number (index) or a header name
        const isIndex = !isNaN(parseInt(headerOrIndex, 10));
        
        if (isIndex) {
            // Original behavior - handle by table index
            return this.getTableByIndex(parseInt(headerOrIndex, 10), tempDiv);
        } else {
            // New behavior - handle by header name
            return this.getTableByHeader(headerOrIndex, secondParam, tempDiv);
        }
    }
    
    private getTableByIndex(tableIndex: number, tempDiv: HTMLElement) {
        // Find all tables in the rendered content
        const tables = tempDiv.querySelectorAll('table');

        // Check if the requested table exists
        if (tableIndex >= tables.length) {
            return { data: [], columns: [] };
        }

        return this.extractTableData(tables[tableIndex]);
    }
    
    private getTableByHeader(headerName: string, tableIndex: string | undefined, tempDiv: HTMLElement) {
        // Find the header element with the given name
        const headers = Array.from(tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6'));
        
        for (let i = 0; i < headers.length; i++) {
            const header = headers[i];
            
            // Check if this header matches the requested name
            if (header.textContent?.trim().toLowerCase() === headerName.toLowerCase()) {
                // Find all tables that follow this header and before the next header
                const tablesUnderHeader: HTMLTableElement[] = [];
                
                let currentElement = header.nextElementSibling;
                while (currentElement && !currentElement.matches('h1, h2, h3, h4, h5, h6')) {
                    if (currentElement instanceof HTMLTableElement || currentElement.querySelector('table')) {
                        const tables = currentElement.matches('table')
                            ? [currentElement as HTMLTableElement]
                            : Array.from(currentElement.querySelectorAll('table'));
                        
                        tablesUnderHeader.push(...(tables as HTMLTableElement[]));
                    }
                    currentElement = currentElement.nextElementSibling;
                }
                
                // No tables found under this header
                if (tablesUnderHeader.length === 0) {
                    return { data: [], columns: [] };
                }
                
                // If a specific table index is provided, use it
                if (tableIndex !== undefined) {
                    const idx = parseInt(tableIndex, 10);
                    if (isNaN(idx) || idx >= tablesUnderHeader.length) {
                        return { data: [], columns: [] };
                    }
                    return this.extractTableData(tablesUnderHeader[idx]);
                }
                
                // Otherwise, return the first table
                return this.extractTableData(tablesUnderHeader[0]);
            }
        }
        
        // Header not found
        return { data: [], columns: [] };
    }
    
    private extractTableData(table: HTMLTableElement) {
        // Extract headers
        const headers = Array.from(table.querySelectorAll('th')).map(th => th.textContent?.trim() || '').filter(x => !!x);

        // Extract rows
        const rows = Array.from(table.querySelectorAll('tr')).slice(1); // Skip header row

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
            columns: headers.map(c => ({ name: c, type: 'auto' as const })) ?? []
        };
    }
}