import { createGrid, GridApi, GridOptions, themeQuartz } from "ag-grid-community";
import { merge } from "lodash";
import { App } from "obsidian";
import { RendererConfig, RendererContext } from "./rendererRegistry";
import { parse } from 'json5'
import { ViewDefinition } from "../grammar/parser";
import SqlSealPlugin from "../main";
import { ModernCellParser } from "../cellParser/ModernCellParser";

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
    constructor(
        private el: HTMLElement,
        private config: Partial<GridOptions>,
        private plugin: SqlSealPlugin | null,
        private app: App,
        private cellParser: ModernCellParser
    ) {
        this.initialize()
    }

    private _gridApi: GridApi<any>
    private errorEl: HTMLElement
    private errorOverlay: HTMLElement

    get gridApi(): GridApi<any> {
        return this._gridApi
    }

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
                        component: ({ value }: { value: string }) => this.cellParser.render(value)
                    }
                },
                autoHeight: true
            },
            autoSizeStrategy: {
                // make sure to fit content
                type: 'fitGridWidth',
                // defaultMinWidth: 150,
            },
            pagination: true,
            suppressMovableColumns: true,
            loadThemeGoogleFonts: false,
            rowData: [],
            columnDefs: [],
            domLayout: 'autoHeight',
            enableCellTextSelection: true,
            paginationPageSize: this.plugin? this.plugin.settings.gridItemsPerPage : undefined,
            // ensureDomOrder: true
        }, this.config)
        this._gridApi = createGrid(
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
    constructor(private app: App, private readonly plugin: SqlSealPlugin | null) { }
    get viewDefinition(): ViewDefinition {
        return {
            name: this.rendererKey,
            argument: 'anyObject?',
            singleLine: false
        }
    }
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


    render(config: Partial<GridOptions>, el: HTMLElement, { cellParser }: RendererContext) {
        const communicator = new GridRendererCommunicator(el, config, this.plugin, this.app, cellParser)
        return {
            render: (data: any) => {
                communicator.setData(data.columns, data.data)
                communicator.gridApi.autoSizeAllColumns()

            },
            error: (message: string) => {
                communicator.showInfo('error', message)
            }
        }
    }
}