import { asFactory, buildContainer } from "@hypersphere/dity";
import { ContextMenuInit } from "./init";
import { App, Plugin } from "obsidian";

export const contextMenu = buildContainer(c => 
    c.register({
        init: asFactory(ContextMenuInit)
    })
    .externals<{
        app: App,
        plugin: Plugin
    }>()
    .exports('init')
)

export type ContextMenuModule = typeof contextMenu
