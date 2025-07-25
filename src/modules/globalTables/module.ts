import { asFactory, buildContainer } from "@hypersphere/dity";
import { InitFactory } from "./InitFactory";
import { App, Plugin } from "obsidian";
import { GlobalTablesViewRegister } from "./GlobalTablesViewRegister";

export const globalTables = buildContainer(c => 
    c.register({
        init: asFactory(InitFactory),
        globalTablesViewRegister: asFactory(GlobalTablesViewRegister)
    })
    .externals<{
        plugin: Plugin,
        app: App
    }>()
    .exports('init')
)

export type GlobalTablesModule = typeof globalTables
