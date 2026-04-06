import { WorkspaceLeaf, TextFileView, IconName, ButtonComponent } from 'obsidian';
import { uniq } from 'lodash';
import { CodeSampleModal } from '../modal/showCodeSample';
import { ViewPluginGeneratorType } from '../../syntaxHighlight/viewPluginGenerator';

export const JSONL_VIEW_TYPE = "sqlseal-jsonl-viewer";
export const JSONL_VIEW_EXTENSIONS = ['jsonl', 'ndjson'];

const LARGE_FILE_THRESHOLD = 1000000;
const MAX_ROWS = 100;

function parseJsonlLines(content: string): { data: Record<string, unknown>[]; errors: number } {
    const lines = content.split('\n');
    const data: Record<string, unknown>[] = [];
    let errors = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = (i === 0 ? lines[i].replace(/^\uFEFF/, '') : lines[i]).trim();
        if (!line) continue;
        try {
            const parsed = JSON.parse(line);
            if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
                errors++;
                continue;
            }
            data.push(parsed);
        } catch {
            errors++;
        }
    }

    return { data, errors };
}

export class JsonlView extends TextFileView {
    private content: string = '';

    constructor(leaf: WorkspaceLeaf, private readonly viewPluginGenerator: ViewPluginGeneratorType) {
        super(leaf);
    }

    getViewType(): string {
        return JSONL_VIEW_TYPE;
    }

    getDisplayText(): string {
        return this.file?.basename || 'JSONL Viewer';
    }

    getIcon(): IconName {
        return 'file-json';
    }

    async setViewData(data: string, clear: boolean): Promise<void> {
        if (clear) this.clear();
        this.content = data;
        this.render();
    }

    getViewData(): string {
        return this.content;
    }

    clear(): void {
        this.content = '';
        this.contentEl.empty();
    }

    private render(): void {
        this.contentEl.empty();

        if (!this.content) return;

        const isLarge = this.content.length > LARGE_FILE_THRESHOLD;
        const container = this.contentEl.createDiv({ cls: 'sqlseal-json-viewer' });

        if (isLarge) {
            container.createDiv({
                cls: 'sqlseal-file-warning',
                text: `⚠️ Large file (~${(this.content.length / 1000000).toFixed(1)}MB). Showing first ${MAX_ROWS} rows.`
            });
        }

        const buttonContainer = container.createDiv({ cls: 'sqlseal-button-container' });
        const buttonComponent = new ButtonComponent(buttonContainer);
        buttonComponent
            .setButtonText('Generate SQLSeal Code')
            .onClick(() => {
                if (this.file) {
                    new CodeSampleModal(this.app, this.file, this.viewPluginGenerator).open();
                }
            });

        const { data, errors } = parseJsonlLines(this.content);

        if (data.length === 0) {
            container.createDiv({ cls: 'sqlseal-info', text: 'No valid JSON objects found.' });
            return;
        }

        const displayRows = data.slice(0, MAX_ROWS);
        const columns = uniq(displayRows.slice(0, 20).flatMap(row => Object.keys(row)));

        const table = container.createEl('table', { cls: 'sqlseal-preview-table' });
        const thead = table.createEl('thead');
        const headerRow = thead.createEl('tr');
        columns.forEach(col => headerRow.createEl('th', { text: col }));

        const tbody = table.createEl('tbody');
        displayRows.forEach(row => {
            const tr = tbody.createEl('tr');
            columns.forEach(col => {
                const td = tr.createEl('td');
                const value = row[col];
                if (value === null || value === undefined) {
                    td.addClass('sqlseal-null-cell');
                } else if (typeof value === 'object') {
                    td.textContent = JSON.stringify(value);
                    td.addClass('sqlseal-object-cell');
                } else {
                    td.textContent = String(value);
                }
            });
        });

        const total = data.length;
        let infoText = total > MAX_ROWS
            ? `Showing first ${MAX_ROWS} of ${total} rows (limited for performance)`
            : `${total} rows`;
        if (errors > 0) infoText += ` · ${errors} line(s) skipped`;
        container.createDiv({ cls: 'sqlseal-row-info', text: infoText });
    }
}
