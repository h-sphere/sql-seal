import { asFactory, buildContainer } from "@hypersphere/dity";
import { SyntaxHighlightInit } from "./init";
import { App, Plugin } from "obsidian";
import { RendererRegistry } from "../editor/renderer/rendererRegistry";

export const syntaxHighlight = buildContainer(c => c
    .externals<{
        app: App,
        rendererRegistry: RendererRegistry,
        plugin: Plugin
    }>()
    .register({
        init: asFactory(SyntaxHighlightInit)
    })
)

export type SyntaxHighlightModule = typeof syntaxHighlight