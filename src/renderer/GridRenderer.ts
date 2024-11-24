import { createGrid, GridApi, GridOptions, themeQuartz } from "ag-grid-community";
import { merge } from "lodash";
import { App } from "obsidian";
import { RendererConfig } from "src/rendererRegistry";
import { parse } from 'json5'
import { displayError, displayNotice, parseCell } from "src/ui";

const getCurrentTheme = () => {
    return document.body.classList.contains('theme-dark') ? 'dark' : 'light';
}

const getAgGridTheme = (theme: 'dark' | 'light') => {
    return {
        backgroundColor: "var(--color-primary)", //"#1f2836",
        browserColorScheme: theme,
        chromeBackgroundColor: {
            ref: "foregroundColor",
            mix: 0.07,
            onto: "backgroundColor"
        },
        foregroundColor: "var(--text-normal)",
        headerFontSize: 14
    } as const
}

class GridRendererCommunicator {
    constructor(private el: HTMLElement, private config: Partial<GridOptions>, private app: App) {
        this.initialize()
    }

    private gridApi: GridApi<any>
    private errorEl: HTMLElement
    private errorOverlay: HTMLElement

    private showError(message: string) {
        this.gridApi.setGridOption('loading', false)
        this.errorEl.textContent = message //.replace(`TTT${prefix}_`, '');
        this.errorOverlay.classList.remove('hidden')
    }

    private hideError() {
        this.errorOverlay.classList.add('hidden')
    }

    initialize() {
        this.el.empty()
        const div = this.el.createDiv()
        div.classList.add('sqlseal-grid-wrapper')
        const grid = div.createDiv()
        const errorMessageOverlay = div.createDiv({ cls: ['sqlseal-grid-error-message-overlay', 'hidden'] })
        this.errorEl = errorMessageOverlay.createDiv({ cls: ['sqlseal-grid-error-message'] })
        this.errorOverlay = errorMessageOverlay
        grid.classList.add('ag-theme-quartz')

        const myTheme = themeQuartz
            .withParams(getAgGridTheme(getCurrentTheme()))


        const gridOptions: GridOptions = merge({
            theme: myTheme,
            defaultColDef: {
                resizable: false,
                cellRendererSelector: () => {
                    return {
                        component: ({ value }: { value: string }) => parseCell(value, this.app)
                    }
                },
                autoHeight: true
            },
            autoSizeStrategy: {
                type: 'fitGridWidth',
                defaultMinWidth: 150,
            },
            pagination: true,
            suppressMovableColumns: true,
            loadThemeGoogleFonts: false,
            rowData: [],
            columnDefs: [],
            domLayout: 'autoHeight',
            enableCellTextSelection: true,
            ensureDomOrder: true
        }, this.config)
        this.gridApi = createGrid(
            grid,
            gridOptions,
        );
    }

    setData(columns: any[], data: any[]) {
        if (!this.gridApi) {
            throw new Error('Grid has not been initiated')
        }
        this.gridApi.setGridOption('columnDefs', columns.map((c: any) => ({ field: c })))
        this.gridApi.setGridOption('rowData', data)
        this.gridApi.setGridOption('loading', false)
    }

    showInfo(type: 'loading' | 'error', message: string) {
        switch (type) {
            case 'loading':
                this.hideError()
                this.gridApi.setGridOption('loading', true)
                break;
            case 'error':
                this.showError(message)
                break
        }
    }
}

export class GridRenderer implements RendererConfig {
    constructor(private app: App) { }
    get rendererKey() {
        return 'grid'
    }

    isInitialised = false

    validateConfig(config: string) {
        if (!config || !config.trim()) {
            return {}
        }
        return parse(config)
    }


    render(config: Partial<GridOptions>, el: HTMLElement) {
        const communicator = new GridRendererCommunicator(el, config, this.app)
        return {
            render: (data: any) => {
                // FIXME: we need to update that.
                communicator.setData(data.columns, data.data)
            },
            error: (message: string) => {
                communicator.showInfo('error', message)
            }
        }
    }
}