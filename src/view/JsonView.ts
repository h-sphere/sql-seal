import { WorkspaceLeaf, TextFileView, Menu } from 'obsidian';
import { parse, stringify } from 'json5'

export const JSON_VIEW_TYPE = "sqlseal-json-viewer";
export const JSON_VIEW_EXTENSIONS = ['json', 'json5'];

export class JsonView extends TextFileView {
    private content: string;
    private table: HTMLTableElement;

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

    async setViewData(data: string, clear: boolean): Promise<void> {
        this.content = data;
        await this.renderJson();
    }

    getViewData(): string {
        return this.content;
    }

    clear(): void {
        this.content = '';
        this.table.empty();
    }

    api: any = null;

    private async renderJson() {

        if (!this.content) {
            return
        }


        this.contentEl.empty()
        const csvEditorDiv = this.contentEl.createDiv({ cls: 'sqlseal-json-editor' })
        const code = csvEditorDiv.createEl('pre').createEl('code')

        try {
            const data = parse(this.content)
            const formatted = stringify(data, null, 2)
            code.appendText(formatted)
        } catch (e) {
            console.error(e)
            // EMPTY
        }
    }
}