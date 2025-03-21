import { ItemView, TFile, WorkspaceLeaf } from 'obsidian';
import SqlSealPlugin from '../main';

export const SIDEBAR_VIEW_TYPE = 'sql-seal-sidebar-view';

export class SidebarView extends ItemView {
    private currentFile: TFile | null = null;
    public contentEl: HTMLElement;
    private plugin: SqlSealPlugin;

    constructor(leaf: WorkspaceLeaf, plugin: SqlSealPlugin) {
        super(leaf);
        this.plugin = plugin;
    }

    getViewType(): string {
        return SIDEBAR_VIEW_TYPE;
    }

    getDisplayText(): string {
        return 'SQL Seal Sidebar';
    }

    async onload(): Promise<void> {
        super.onload();

        // Create container for the sidebar content
        this.contentEl = this.containerEl.createDiv('sql-seal-sidebar-container');

        // Register event handler for file changes
        this.registerEvent(
            this.app.workspace.on('file-open', (file: TFile | null) => {
                this.currentFile = file;
                this.updateView();
            })
        );
    }

    async updateView(): Promise<void> {
        this.contentEl.empty();

        if (!this.currentFile) {
            this.contentEl.createEl('div', {
                text: 'No file is currently open',
                cls: 'sql-seal-sidebar-empty'
            });
            return;
        }

        try {
            // Get file metadata or frontmatter
            const fileCache = this.app.metadataCache.getFileCache(this.currentFile);
            const frontmatter = fileCache?.frontmatter || {};

            // Add file-specific properties to frontmatter
            const enhancedFrontmatter = {
                ...frontmatter,
                '@file': {
                    name: this.currentFile.name,
                    path: this.currentFile.path,
                    basename: this.currentFile.basename,
                    extension: this.currentFile.extension,
                    stat: {
                        ctime: this.currentFile.stat.ctime,
                        mtime: this.currentFile.stat.mtime,
                        size: this.currentFile.stat.size
                    }
                },
                '@tags': fileCache?.tags?.map(tag => tag.tag) || [],
                '@links': fileCache?.links?.map(link => link.link) || [],
                '@headings': fileCache?.headings?.map(h => ({
                    text: h.heading,
                    level: h.level
                })) || []
            };

            // Check if there's a specific SQL query defined in frontmatter
            const query = frontmatter?.['sql-seal-query'];
            const view = frontmatter?.['sql-seal-view'] || 'table'; // Default to table view
            
            if (query) {
                const result = await this.plugin.sqlSeal.db.select(query, enhancedFrontmatter);
                this.renderQueryResults(result.data, view);
            } else {
                this.contentEl.createEl('div', {
                    text: 'No SQL query defined for this file',
                    cls: 'sql-seal-sidebar-empty'
                });
            }
        } catch (error) {
            this.contentEl.createEl('div', {
                text: `Error: ${error.message}`,
                cls: 'sql-seal-sidebar-error'
            });
        }
    }

    private renderQueryResults(results: any[], view: string): void {
        if (!results || results.length === 0) {
            this.contentEl.createEl('div', {
                text: 'No results found',
                cls: 'sql-seal-sidebar-empty'
            });
            return;
        }

        if (view === 'list') {
            this.renderListView(results);
        } else {
            this.renderTableView(results);
        }
    }

    private renderTableView(results: any[]): void {
        const table = this.contentEl.createEl('table', {
            cls: 'sql-seal-sidebar-table'
        });

        // Create header row
        const headerRow = table.createEl('tr');
        Object.keys(results[0]).forEach(key => {
            headerRow.createEl('th', { text: key });
        });

        // Create data rows
        results.forEach(row => {
            const tr = table.createEl('tr');
            Object.values(row).forEach(value => {
                tr.createEl('td', { text: String(value) });
            });
        });
    }

    private renderListView(results: any[]): void {
        const list = this.contentEl.createEl('ul', {
            cls: 'sql-seal-sidebar-list'
        });

        results.forEach(row => {
            const li = list.createEl('li');
            Object.entries(row).forEach(([key, value]) => {
                const span = li.createEl('span', {
                    cls: 'sql-seal-sidebar-list-item'
                });
                span.createEl('span', {
                    text: key,
                    cls: 'sql-seal-sidebar-list-key'
                });
                span.createEl('span', {
                    text: ': '
                });
                span.createEl('span', {
                    text: String(value),
                    cls: 'sql-seal-sidebar-list-value'
                });
            });
        });
    }
} 