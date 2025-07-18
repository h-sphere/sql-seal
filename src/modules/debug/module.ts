import { asFactory, buildContainer } from "@hypersphere/dity";
import { DityGraph } from "./dityGraph";
import { Plugin } from "obsidian";

export const debugModule = buildContainer(c =>
    c
    .register({
        init: asFactory(DityGraph)
    })
    .externals<{
        plugin: Plugin
    }>()
)

export type DebugModule = typeof debugModule
