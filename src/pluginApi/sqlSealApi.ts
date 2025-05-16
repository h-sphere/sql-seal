import { Plugin } from "obsidian"
import SqlSealPlugin from "../main"
import { version } from '../../package.json'
import { RendererConfig } from "../renderer/rendererRegistry";
import { CellFunction } from "../cellParser/CellFunction";

const API_VERSION = 4;

export class SQLSealRegisterApi {
    registeredApis: Array<SQLSealApi> = []
    constructor(private sqlSealPlugin: SqlSealPlugin) {
        sqlSealPlugin.register(() => {
            this.registeredApis.forEach(p => {
                p.unregister()
            })
            this.registeredApis = []
        })
    }

    get sqlSealVersion() {
        return version
    }

    get apiVersion() {
        return API_VERSION
    }

    registerForPlugin(plugin: Plugin) {
        const api = new SQLSealApi(plugin, this.sqlSealPlugin)
        this.registeredApis.push(api)
        return api
    }
}

interface RegisteredView {
    name: string;
    viewClass: any;
}

// TODO: use the type from registrator
export interface RegisteredFlag {
    name: string,
    key: string
}

export class SQLSealApi {
    private views: Array<RegisteredView> = []
    private functions: Array<CellFunction> = []
    private flags: Array<RegisteredFlag> = []

    constructor(private readonly plugin: Plugin, private sqlSealPlugin: SqlSealPlugin) {
        plugin.register(() => {
            this.unregister()
        })
    }

    registerView(name: string, viewClass: RendererConfig) {
        this.views.push({
            name,
            viewClass
        })
        this.sqlSealPlugin.registerSQLSealView(name, viewClass)
    }

    registerCustomFunction(fn: CellFunction) {
        this.functions.push(fn)
        this.sqlSealPlugin.registerSQLSealFunction(fn)
    }

    registerTable<const columns extends string[]>(tableName: string, columns: columns) {
        return this.sqlSealPlugin.registerTable(this.plugin, tableName, columns)
    }

    registerFlag(flag: RegisteredFlag) {
        this.flags.push(flag)
        this.sqlSealPlugin.registerSQLSealFlag(flag)
    }

    unregister() {
        for(const view of this.views) {
            this.sqlSealPlugin.unregisterSQLSealView(view.name)
        }
        this.views = []

        for(const fn of this.functions) {
            this.sqlSealPlugin.unregisterSQLSealFunction(fn.name)
        }

        for(const flag of this.flags) {
            this.sqlSealPlugin.unregisterSQLSealFlag(flag.name)
        }
    }
}
