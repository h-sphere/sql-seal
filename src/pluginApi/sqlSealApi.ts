import { Plugin } from "obsidian"
import SqlSealPlugin from "../main"
import { version } from '../../package.json'
import { RendererConfig } from "../renderer/rendererRegistry";

const API_VERSION = 1;

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

interface RegisteredFunction {
    name: string,
    fn: CallableFunction
}

export class SQLSealApi {
    private views: Array<RegisteredView> = []
    private functions: Array<RegisteredFunction> = []

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

    registerCustomFunction(name: string, fn: CallableFunction, argumentsCount: number = 1) {
        this.functions.push({
            name,
            fn,
        })
        this.sqlSealPlugin.registerSQLSealFunction(name, fn, argumentsCount)
    }

    registerTable<const columns extends string[]>(tableName: string, columns: columns) {
        return this.sqlSealPlugin.registerTable(this.plugin, tableName, columns)
    }

    unregister() {
        for(const view of this.views) {
            this.sqlSealPlugin.unregisterSQLSealView(view.name)
        }
        this.views = []

        for(const fn of this.functions) {
            this.sqlSealPlugin.unregisterSQLSealFunction(fn.name)
        }
    }
}
