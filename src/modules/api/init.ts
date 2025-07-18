import { Plugin } from "obsidian"
import { PluginRegister, SQLSealApi, SQLSealRegisterApi } from "./pluginApi/sqlSealApi"
import { makeInjector } from "@hypersphere/dity"
import { ApiModule } from "./module"

const SQLSEAL_API_KEY = '___sqlSeal'
const SQLSEAL_QUEUED_PLUGINS = '___sqlSeal_queue'

@(makeInjector<ApiModule, 'factory'>()([
    'plugin'
]))
export class ApiInit {
    make(plugin: Plugin) {
        return () => {
            const api = new SQLSealRegisterApi(plugin);
            (window as any)[SQLSEAL_API_KEY] = api

            const queuedPlugins = (window as any)[SQLSEAL_QUEUED_PLUGINS] as PluginRegister[] | undefined
            if (!queuedPlugins) {
                return
            }
            queuedPlugins.forEach(pl => {
                api.registerForPluginNew(pl)
            });

            (window as any)[SQLSEAL_QUEUED_PLUGINS] = []
        }
    }
}