import { WorkspaceLeaf, TextFileView, Menu, IconName, Notice, ButtonComponent } from 'obsidian';
import { parse, stringify } from 'json5';
import * as jsonpath from 'jsonpath';
import { uniq } from 'lodash';
import { CodeSampleModal } from '../modal/showCodeSample';
import { ViewPluginGeneratorType } from '../../syntaxHighlight/viewPluginGenerator';

export const JSON_VIEW_TYPE = "sqlseal-json-viewer";
export const JSON_VIEW_EXTENSIONS = ['json', 'json5'];

class JsonRenderer {
    applySyntaxHighlighting(codeElement: HTMLElement): void {
        const text = codeElement.textContent || '';
        codeElement.innerHTML = text
            .replace(/"([^"]+)":/g, '<span class="json-key">"$1":</span>')
            .replace(/: (true|false)/g, ': <span class="json-boolean">$1</span>')
            .replace(/: (null)/g, ': <span class="json-null">$1</span>')
            .replace(/: (-?\d+(?:\.\d+)?)/g, ': <span class="json-number">$1</span>');
    }
    
    renderFormattedJson(container: HTMLElement, parsedData: any): void {
        container.empty();
        const pre = container.createEl('pre');
        const code = pre.createEl('code', { cls: 'language-json' });
        
        // Enable text selection like a textarea
        pre.style.userSelect = 'text';
        pre.style.cursor = 'text';
        code.style.userSelect = 'text';
        
        const formatted = stringify(parsedData, null, 2);
        if (formatted.length > 50000) {
            const truncated = formatted.substring(0, 50000) + '\n\n... (content truncated for display)';
            code.textContent = truncated;
        } else {
            code.textContent = formatted;
        }
        
        this.applySyntaxHighlighting(code);
    }
}

class TableRenderer {
    processTablePreview(
        container: HTMLElement, 
        parsedData: any, 
        jsonPath: string, 
        isLargeFile: boolean
    ): void {
        try {
            let queryResult = parsedData;
            
            if (jsonPath !== '$') {
                queryResult = jsonpath.query(parsedData, jsonPath);
            }
            
            if (!Array.isArray(queryResult)) {
                container.createEl('div', {
                    cls: 'sqlseal-info',
                    text: 'JSONPath result is not an array. Table preview requires array data.'
                });
                return;
            }
            
            if (queryResult.length === 0) {
                container.createEl('div', {
                    cls: 'sqlseal-info',
                    text: 'No data matches the JSONPath query.'
                });
                return;
            }
            
            this.renderTable(container, queryResult, isLargeFile);
            
        } catch (e) {
            const errorDiv = container.createEl('div', { cls: 'sqlseal-error' });
            
            errorDiv.createEl('h4', { text: 'JSONPath Query Error' });
            
            const errorMessage = e instanceof Error ? e.message : 'Invalid query syntax';
            errorDiv.createEl('p', { text: `Error: ${errorMessage}` });
            
            // Add some helpful tips
            const tipsDiv = errorDiv.createEl('div', { cls: 'sqlseal-error-tips' });
            tipsDiv.createEl('p', { text: 'Common JSONPath examples:' });
            const tipsList = tipsDiv.createEl('ul');
            tipsList.createEl('li', { text: '$ - Root object' });
            tipsList.createEl('li', { text: '$.users[*] - All items in users array' });
            tipsList.createEl('li', { text: '$.users[0] - First user' });
            tipsList.createEl('li', { text: '$.users[?(@.active)] - Users where active is true' });
        }
    }
    
    private renderTable(container: HTMLElement, queryResult: any[], isLargeFile: boolean): void {
        const maxRows = isLargeFile ? 50 : 100;
        const displayRows = queryResult.slice(0, maxRows);
        
        const sampleSize = Math.min(displayRows.length, 20);
        const columns = uniq(displayRows.slice(0, sampleSize).map(row => 
            typeof row === 'object' && row !== null ? Object.keys(row) : []
        ).flat());
        
        if (columns.length === 0) {
            container.createEl('div', {
                cls: 'sqlseal-info',
                text: 'Data contains no object properties to display in table.'
            });
            return;
        }
        
        const table = container.createEl('table', { cls: 'sqlseal-preview-table' });
        
        this.createTableHeader(table, columns);
        this.createTableBody(table, displayRows, columns);
        this.addRowCountInfo(container, queryResult.length, maxRows);
    }
    
    private createTableHeader(table: HTMLElement, columns: string[]): void {
        const thead = table.createEl('thead');
        const headerRow = thead.createEl('tr');
        columns.forEach(col => {
            headerRow.createEl('th', { text: col });
        });
    }
    
    private createTableBody(table: HTMLElement, displayRows: any[], columns: string[]): void {
        const tbody = table.createEl('tbody');
        displayRows.forEach((row) => {
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
    }
    
    private addRowCountInfo(container: HTMLElement, totalRows: number, maxRows: number): void {
        if (totalRows > maxRows) {
            container.createEl('div', {
                cls: 'sqlseal-row-info',
                text: `Showing first ${maxRows} of ${totalRows} rows (limited for performance)`
            });
        } else {
            container.createEl('div', {
                cls: 'sqlseal-row-info',
                text: `${totalRows} rows`
            });
        }
    }
}

class UIBuilder {
    createWarningSection(container: HTMLElement, sizeInMB: number): HTMLButtonElement {
        const warningSection = container.createDiv({ cls: 'sqlseal-file-warning' });
        warningSection.createEl('div', { 
            cls: 'sqlseal-warning-text',
            text: `⚠️ Large file detected (~${sizeInMB}MB). Analysis disabled to prevent freezing.`
        });
        
        return warningSection.createEl('button', {
            cls: 'sqlseal-analyze-btn',
            text: 'Analyze File (may take time)'
        });
    }
    
    createInputSection(container: HTMLElement, currentPath: string, isDisabled: boolean): HTMLInputElement {
        const inputSection = container.createDiv({ cls: 'sqlseal-json-input-section' });
        inputSection.createEl('label', { text: 'JSONPath Query:' });
        const input = inputSection.createEl('input', {
            type: 'text',
            value: currentPath,
            placeholder: '$.users[*] or $.data.items[?(@.active)]'
        });
        if (isDisabled) {
            input.disabled = true;
        }
        return input;
    }
    
    createContentPanels(container: HTMLElement): { 
        jsonContainer: HTMLElement; 
        tableContainer: HTMLElement; 
    } {
        const contentArea = container.createDiv({ cls: 'sqlseal-json-content' });
        
        const jsonPanel = contentArea.createDiv({ cls: 'sqlseal-json-panel' });
        const jsonContainer = jsonPanel.createDiv({ cls: 'sqlseal-json-display' });
        
        const tablePanel = contentArea.createDiv({ cls: 'sqlseal-table-panel' });
        const tableContainer = tablePanel.createDiv({ cls: 'sqlseal-table-display' });
        
        return { jsonContainer, tableContainer };
    }
    
    createGenerateCodeButton(container: HTMLElement, onGenerate: () => void): HTMLButtonElement {
        const buttonContainer = container.createDiv({ cls: 'sqlseal-button-container' });
        
        const buttonComponent = new ButtonComponent(buttonContainer);
        buttonComponent
            .setButtonText('Generate SQLSeal Code')
            .onClick(onGenerate);
        
        return buttonComponent.buttonEl;
    }
    
    showPlaceholders(jsonContainer: HTMLElement, tableContainer: HTMLElement): void {
        jsonContainer.createEl('div', {
            cls: 'sqlseal-placeholder',
            text: 'Click "Analyze File" above to parse and display the JSON content.'
        });
        
        tableContainer.createEl('div', {
            cls: 'sqlseal-placeholder',
            text: 'Table preview will be available after analysis.'
        });
    }
}

const LARGE_FILE_THRESHOLD = 1000000;

function analyzeFileSize(content: string): { isLarge: boolean; sizeInMB: number } {
    const isLarge = content.length > LARGE_FILE_THRESHOLD;
    const sizeInMB = parseFloat((content.length / 1000000).toFixed(1));
    return { isLarge, sizeInMB };
}

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
    private generateCodeButton: HTMLButtonElement | undefined = undefined;
    
    private jsonRenderer = new JsonRenderer();
    private tableRenderer = new TableRenderer();
    private uiBuilder = new UIBuilder();

    constructor(leaf: WorkspaceLeaf, private readonly viewPluginGenerator: ViewPluginGeneratorType) {
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
        // Ensure we have fresh file data when reopening
        if (this.file) {
            const fileContent = await this.app.vault.cachedRead(this.file);
            this.content = fileContent;
        }
        this.renderJson();
    }

    async onClose() {
        // Cleanup if needed
    }

    getIcon(): IconName {
        return 'file-json'
    }

    async setViewData(data: string, clear: boolean): Promise<void> {
        if (clear) {
            this.clear();
        }
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
        this.currentJsonPath = '$';
        this.jsonContainer?.empty();
        this.tableContainer?.empty();
        this.contentEl.empty();
    }

    api: any = null;

    private async renderJson() {
        if (!this.content) {
            return;
        }

        this.contentEl.empty();
        
        const { isLarge, sizeInMB } = analyzeFileSize(this.content);
        this.isLargeFile = isLarge;
        
        const mainContainer = this.contentEl.createDiv({ cls: 'sqlseal-json-viewer' });
        
        if (this.isLargeFile) {
            this.analyzeButton = this.uiBuilder.createWarningSection(mainContainer, sizeInMB);
            this.analyzeButton.addEventListener('click', () => {
                this.performAnalysis();
            });
        }
        
        this.jsonPathInput = this.uiBuilder.createInputSection(
            mainContainer, 
            this.currentJsonPath, 
            this.isLargeFile && !this.isAnalyzed
        );
        
        if (!this.isLargeFile || this.isAnalyzed) {
            this.jsonPathInput.addEventListener('input', () => {
                this.currentJsonPath = this.jsonPathInput!.value || '$';
                this.updateTablePreview();
            });
        }
        
        this.generateCodeButton = this.uiBuilder.createGenerateCodeButton(mainContainer, () => this.generateSQLSealCode());
        if (this.isLargeFile && !this.isAnalyzed && this.generateCodeButton) {
            this.generateCodeButton.style.display = 'none';
        }
        
        const { jsonContainer, tableContainer } = this.uiBuilder.createContentPanels(mainContainer);
        this.jsonContainer = jsonContainer;
        this.tableContainer = tableContainer;
        
        if (!this.isLargeFile) {
            await this.performAnalysis();
        } else {
            this.uiBuilder.showPlaceholders(this.jsonContainer, this.tableContainer);
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
            this.jsonRenderer.renderFormattedJson(this.jsonContainer!, this.parsedData);
            this.updateTablePreview();
            
            // Show generate code button for large files
            if (this.generateCodeButton && this.isLargeFile) {
                this.generateCodeButton.style.display = 'block';
            }
            
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
    
    private updateTablePreview() {
        if (!this.tableContainer || !this.parsedData || this.isAnalyzing) return;
        
        this.tableContainer.empty();
        
        if (this.isLargeFile) {
            const loadingDiv = this.tableContainer.createEl('div', {
                cls: 'sqlseal-loading',
                text: 'Processing JSONPath query...'
            });
            
            setTimeout(() => {
                loadingDiv.remove();
                this.tableRenderer.processTablePreview(
                    this.tableContainer!, 
                    this.parsedData, 
                    this.currentJsonPath, 
                    this.isLargeFile
                );
            }, 50);
        } else {
            this.tableRenderer.processTablePreview(
                this.tableContainer, 
                this.parsedData, 
                this.currentJsonPath, 
                this.isLargeFile
            );
        }
    }
    
    private generateSQLSealCode(): void {
        if (!this.file) {
            new Notice('No file available for code generation');
            return;
        }
        
        const modal = new CodeSampleModal(this.app, this.file, this.viewPluginGenerator, this.currentJsonPath);
        modal.open();
    }
}