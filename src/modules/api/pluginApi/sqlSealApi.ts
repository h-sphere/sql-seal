import { Plugin } from "obsidian"
import { version } from '../../../../package.json'
import { RendererConfig, RendererRegistry } from "../../editor/renderer/rendererRegistry";
import { CellFunction } from "../../../cellParser/CellFunction";
import { ModernCellParser } from "../../../cellParser/ModernCellParser";
import { FilepathHasher } from "../../../utils/hasher";
import { DatabaseTable } from "./table";
import { SqlSealDatabase } from "../../database/database";


export type PluginRegister = {
    plugin: Plugin,
    run: (api: SQLSealApi) => void
}


const API_VERSION = 4;

export class SQLSealRegisterApi {
    registeredApis: Array<SQLSealApi> = []
    constructor(
        sqlSealPlugin: Plugin,
        private readonly cellParser: ModernCellParser,
        private readonly rendererRegistry: RendererRegistry,
        private readonly db: SqlSealDatabase
    ) {
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

    // registerForPlugin(plugin: Plugin) {
    //     const api = new SQLSealApi(plugin)
    //     this.registeredApis.push(api)
    //     return api
    // }

    registerForPluginNew(reg: PluginRegister) {
        const api = new SQLSealApi(reg.plugin, this.cellParser, this.rendererRegistry, this.db)
        this.registeredApis.push(api)

        reg.run(api)

        // If plugin gets unregistered, we need to handle it.
        reg.plugin.register(() => {
            api.unregister()
            this.registeredApis = this.registeredApis.filter(a => a !== api)
        })
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

    constructor(
        private readonly plugin: Plugin,
        private readonly cellParser: ModernCellParser,
        private readonly rendererRegistry: RendererRegistry,
        private readonly db: SqlSealDatabase
    ) {
        plugin.register(() => {
            this.unregister()
        })
    }

    get sqlSealVersion() {
        return version
    }

    get apiVersion() {
        return API_VERSION
    }

    registerView(name: string, viewClass: RendererConfig) {
        this.views.push({
            name,
            viewClass
        })
        this.rendererRegistry.register(name, viewClass)
    }

    registerCustomFunction(fn: CellFunction) {
        this.functions.push(fn)
        this.cellParser.register(fn)
    }

    async registerTable<const columns extends string[]>(name: string, columns: columns) {
        const hash = await FilepathHasher.sha256(`${this.plugin.manifest.name}`)
		const tableName = `external_table_${hash}_name`
		const newTable = new DatabaseTable(this.db, tableName, columns)
		await newTable.connect()
		// FIXME: probably register this table in some type of map for the future use?
		return newTable
    }

    registerFlag(flag: RegisteredFlag) {
        this.flags.push(flag)
        this.rendererRegistry.registerFlag(flag)
    }

    unregister() {
        for(const view of this.views) {
            this.rendererRegistry.unregister(view.name)
        }
        this.views = []

        for(const fn of this.functions) {
            this.cellParser.unregister(fn.name)
        }

        for(const flag of this.flags) {
            this.rendererRegistry.unregisterFlag(flag.name)
        }
    }
}
