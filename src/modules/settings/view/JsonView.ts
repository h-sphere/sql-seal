import { WorkspaceLeaf, TextFileView, Menu, IconName } from 'obsidian';
import { parse, stringify } from 'json5';
import * as jsonpath from 'jsonpath';
import { uniq } from 'lodash';

export const JSON_VIEW_TYPE = "sqlseal-json-viewer";
export const JSON_VIEW_EXTENSIONS = ['json', 'json5'];

export class JsonView extends TextFileView {
    private content: string = '';
    private parsedData: any = null;
    private jsonPathInput: HTMLInputElement | undefined = undefined;
    private jsonContainer: HTMLElement | undefined = undefined;
    private tableContainer: HTMLElement | undefined = undefined;
    private currentJsonPath: string = '$';
    private isLargeFile: boolean = false;
    private isAnalyzed: boolean = false;
    private analyzeButton: HTMLButtonElement | undefined = undefined;
    private isAnalyzing: boolean = false;
    
    // File size threshold in characters (roughly 1MB for typical JSON)
    private readonly LARGE_FILE_THRESHOLD = 1000000;

    constructor(leaf: WorkspaceLeaf) {
        super(leaf);
    }

    getViewType(): string {
        return JSON_VIEW_TYPE;
    }

    getDisplayText(): string {
        return this.file?.basename || 'JSON Viewer';
    }

    async onload(): Promise<void> {
        super.onload();
        this.contentEl.addClass('sqlseal-json-viewer-container');
    }

    async onOpen() {
        this.renderJson();
    }

    async onClose() {
        // Cleanup if needed
    }

    getIcon(): IconName {
        return 'file-json'
    }

    async setViewData(data: string, clear: boolean): Promise<void> {
        this.content = data;
        await this.renderJson();
    }

    getViewData(): string {
        return this.content;
    }

    clear(): void {
        this.content = '';
        this.parsedData = null;
        this.isLargeFile = false;
        this.isAnalyzed = false;
        this.isAnalyzing = false;
        this.jsonContainer?.empty();
        this.tableContainer?.empty();
    }

    api: any = null;

    private async renderJson() {
        if (!this.content) {
            return;
        }

        this.contentEl.empty();
        
        // Check if file is large
        this.isLargeFile = this.content.length > this.LARGE_FILE_THRESHOLD;
        
        // Create main container with flex layout
        const mainContainer = this.contentEl.createDiv({ cls: 'sqlseal-json-viewer' });
        
        // Show file size warning for large files
        if (this.isLargeFile) {
            const warningSection = mainContainer.createDiv({ cls: 'sqlseal-file-warning' });
            const sizeInMB = (this.content.length / 1000000).toFixed(1);
            warningSection.createEl('div', { 
                cls: 'sqlseal-warning-text',
                text: `⚠️ Large file detected (~${sizeInMB}MB). Analysis disabled to prevent freezing.`
            });
            
            this.analyzeButton = warningSection.createEl('button', {
                cls: 'sqlseal-analyze-btn',
                text: 'Analyze File (may take time)'
            });
            
            this.analyzeButton.addEventListener('click', () => {
                this.performAnalysis();
            });
        }
        
        // Create JSONPath input section
        const inputSection = mainContainer.createDiv({ cls: 'sqlseal-json-input-section' });
        const inputLabel = inputSection.createEl('label', { text: 'JSONPath Query:' });
        this.jsonPathInput = inputSection.createEl('input', {
            type: 'text',
            value: this.currentJsonPath,
            placeholder: '$.users[*] or $.data.items[?(@.active)]',
            disabled: this.isLargeFile && !this.isAnalyzed
        });
        
        if (!this.isLargeFile || this.isAnalyzed) {
            this.jsonPathInput.addEventListener('input', () => {
                this.currentJsonPath = this.jsonPathInput!.value || '$';
                this.updateTablePreview();
            });
        }
        
        // Create content area with two panels
        const contentArea = mainContainer.createDiv({ cls: 'sqlseal-json-content' });
        
        // JSON panel
        const jsonPanel = contentArea.createDiv({ cls: 'sqlseal-json-panel' });
        const jsonHeader = jsonPanel.createEl('h3', { text: 'JSON Data' });
        this.jsonContainer = jsonPanel.createDiv({ cls: 'sqlseal-json-display' });
        
        // Table panel
        const tablePanel = contentArea.createDiv({ cls: 'sqlseal-table-panel' });
        const tableHeader = tablePanel.createEl('h3', { text: 'Table Preview' });
        this.tableContainer = tablePanel.createDiv({ cls: 'sqlseal-table-display' });
        
        // Only auto-analyze small files
        if (!this.isLargeFile) {
            await this.performAnalysis();
        } else {
            // Show placeholder for large files
            this.showLargeFilePlaceholder();
        }
    }
    
    private async performAnalysis() {
        if (this.isAnalyzing || this.isAnalyzed) return;
        
        this.isAnalyzing = true;
        
        // Update button state
        if (this.analyzeButton) {
            this.analyzeButton.textContent = 'Analyzing...';
            this.analyzeButton.disabled = true;
        }
        
        // Enable input
        if (this.jsonPathInput) {
            this.jsonPathInput.disabled = false;
            this.jsonPathInput.addEventListener('input', () => {
                this.currentJsonPath = this.jsonPathInput!.value || '$';
                this.updateTablePreview();
            });
        }
        
        try {
            // Use setTimeout to allow UI to update
            await new Promise(resolve => setTimeout(resolve, 100));
            
            this.parsedData = parse(this.content);
            this.isAnalyzed = true;
            this.renderFormattedJson();
            this.updateTablePreview();
            
            // Hide warning section
            const warningSection = this.contentEl.querySelector('.sqlseal-file-warning');
            if (warningSection) {
                warningSection.remove();
            }
            
        } catch (e) {
            console.error('Error parsing JSON:', e);
            this.jsonContainer!.empty();
            this.jsonContainer!.createEl('div', {
                cls: 'sqlseal-error',
                text: `Error parsing JSON: ${e instanceof Error ? e.message : 'Unknown error'}`
            });
        } finally {
            this.isAnalyzing = false;
        }
    }
    
    private showLargeFilePlaceholder() {
        if (!this.jsonContainer || !this.tableContainer) return;
        
        this.jsonContainer.createEl('div', {
            cls: 'sqlseal-placeholder',
            text: 'Click "Analyze File" above to parse and display the JSON content.'
        });
        
        this.tableContainer.createEl('div', {
            cls: 'sqlseal-placeholder',
            text: 'Table preview will be available after analysis.'
        });
    }
    
    private renderFormattedJson() {
        if (!this.jsonContainer || !this.parsedData) return;
        
        this.jsonContainer.empty();
        const pre = this.jsonContainer.createEl('pre');
        const code = pre.createEl('code', { cls: 'language-json' });
        
        // For very large JSON, show only first part
        const formatted = stringify(this.parsedData, null, 2);
        if (formatted.length > 50000) {
            const truncated = formatted.substring(0, 50000) + '\n\n... (content truncated for display)';
            code.textContent = truncated;
        } else {
            code.textContent = formatted;
        }
        
        // Apply basic syntax highlighting
        this.applySyntaxHighlighting(code);
    }
    
    private applySyntaxHighlighting(codeElement: HTMLElement) {
        const text = codeElement.textContent || '';
        codeElement.innerHTML = text
            .replace(/"([^"]+)":/g, '<span class="json-key">"$1":</span>')
            .replace(/: "([^"]*)"/g, ': <span class="json-string">"$1"</span>')
            .replace(/: (true|false)/g, ': <span class="json-boolean">$1</span>')
            .replace(/: (null)/g, ': <span class="json-null">$1</span>')
            .replace(/: (-?\d+(?:\.\d+)?)/g, ': <span class="json-number">$1</span>');
    }
    
    private updateTablePreview() {
        if (!this.tableContainer || !this.parsedData || this.isAnalyzing) return;
        
        this.tableContainer.empty();
        
        // Show loading state for large files
        if (this.isLargeFile) {
            const loadingDiv = this.tableContainer.createEl('div', {
                cls: 'sqlseal-loading',
                text: 'Processing JSONPath query...'
            });
            
            // Use setTimeout to allow UI update
            setTimeout(() => {
                loadingDiv.remove();
                this.processTablePreview();
            }, 50);
        } else {
            this.processTablePreview();
        }
    }
    
    private processTablePreview() {
        if (!this.tableContainer || !this.parsedData) return;
        
        try {
            let queryResult = this.parsedData;
            
            if (this.currentJsonPath !== '$') {
                queryResult = jsonpath.query(this.parsedData, this.currentJsonPath);
            }
            
            if (!Array.isArray(queryResult)) {
                this.tableContainer.createEl('div', {
                    cls: 'sqlseal-info',
                    text: 'JSONPath result is not an array. Table preview requires array data.'
                });
                return;
            }
            
            if (queryResult.length === 0) {
                this.tableContainer.createEl('div', {
                    cls: 'sqlseal-info',
                    text: 'No data matches the JSONPath query.'
                });
                return;
            }
            
            // Limit rows for large datasets
            const maxRows = this.isLargeFile ? 50 : 100;
            const displayRows = queryResult.slice(0, maxRows);
            
            // Get all unique columns from first few rows to avoid processing all data
            const sampleSize = Math.min(displayRows.length, 20);
            const columns = uniq(displayRows.slice(0, sampleSize).map(row => 
                typeof row === 'object' && row !== null ? Object.keys(row) : []
            ).flat());
            
            if (columns.length === 0) {
                this.tableContainer.createEl('div', {
                    cls: 'sqlseal-info',
                    text: 'Data contains no object properties to display in table.'
                });
                return;
            }
            
            // Create table
            const table = this.tableContainer.createEl('table', { cls: 'sqlseal-preview-table' });
            
            // Create header
            const thead = table.createEl('thead');
            const headerRow = thead.createEl('tr');
            columns.forEach(col => {
                headerRow.createEl('th', { text: col });
            });
            
            // Create body
            const tbody = table.createEl('tbody');
            displayRows.forEach((row, index) => {
                const tableRow = tbody.createEl('tr');
                columns.forEach(col => {
                    const cell = tableRow.createEl('td');
                    const value = typeof row === 'object' && row !== null ? row[col] : '';
                    if (value === null || value === undefined) {
                        cell.textContent = '';
                        cell.addClass('sqlseal-null-cell');
                    } else if (typeof value === 'object') {
                        cell.textContent = JSON.stringify(value);
                        cell.addClass('sqlseal-object-cell');
                    } else {
                        cell.textContent = String(value);
                    }
                });
            });
            
            // Add row count info
            const totalRows = queryResult.length;
            if (totalRows > maxRows) {
                this.tableContainer.createEl('div', {
                    cls: 'sqlseal-row-info',
                    text: `Showing first ${maxRows} of ${totalRows} rows (limited for performance)`
                });
            } else {
                this.tableContainer.createEl('div', {
                    cls: 'sqlseal-row-info',
                    text: `${totalRows} rows`
                });
            }
            
        } catch (e) {
            console.error('JSONPath query error:', e);
            this.tableContainer.createEl('div', {
                cls: 'sqlseal-error',
                text: `JSONPath Error: ${e instanceof Error ? e.message : 'Invalid query'}`
            });
        }
    }
}