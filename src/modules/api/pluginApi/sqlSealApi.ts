import { Plugin } from "obsidian"
import SqlSealPlugin from "../../../main";
import { version } from '../../../../package.json'
import { RendererConfig } from "../../editor/renderer/rendererRegistry";
import { CellFunction } from "../../../cellParser/CellFunction";


export type PluginRegister = {
    plugin: Plugin,
    run: (api: SQLSealApi) => void
}


const API_VERSION = 4;

export class SQLSealRegisterApi {
    registeredApis: Array<SQLSealApi> = []
    constructor(sqlSealPlugin: Plugin) {
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
        const api = new SQLSealApi(plugin)
        this.registeredApis.push(api)
        return api
    }

    registerForPluginNew(reg: PluginRegister) {
        const api = new SQLSealApi(reg.plugin)
        this.registeredApis.push(api)

        // If plugin gets unregistered, we need to handle it.
        reg.plugin.register(() => {
            api.unregister()
            this.registeredApis = this.registeredApis.filter(a => a !== api)
        })
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

    constructor(private readonly plugin: Plugin) {
        plugin.register(() => {
            this.unregister()
        })
    }

    registerView(name: string, viewClass: RendererConfig) {
        this.views.push({
            name,
            viewClass
        })
        // this.sqlSealPlugin.registerSQLSealView(name, viewClass)
    }

    registerCustomFunction(fn: CellFunction) {
        this.functions.push(fn)
        // this.sqlSealPlugin.registerSQLSealFunction(fn)
    }

    registerTable<const columns extends string[]>(tableName: string, columns: columns) {
        // return this.sqlSealPlugin.registerTable(this.plugin, tableName, columns)
    }

    registerFlag(flag: RegisteredFlag) {
        this.flags.push(flag)
        // this.sqlSealPlugin.registerSQLSealFlag(flag)
    }

    unregister() {
        for(const view of this.views) {
            // this.sqlSealPlugin.unregisterSQLSealView(view.name)
        }
        this.views = []

        for(const fn of this.functions) {
            // this.sqlSealPlugin.unregisterSQLSealFunction(fn.name)
        }

        for(const flag of this.flags) {
            // this.sqlSealPlugin.unregisterSQLSealFlag(flag.name)
        }
    }
}
