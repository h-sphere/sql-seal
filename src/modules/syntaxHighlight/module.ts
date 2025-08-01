import { asFactory, buildContainer } from "@hypersphere/dity";
import { SyntaxHighlightInit } from "./init";
import { App, Plugin } from "obsidian";
import { RendererRegistry } from "../editor/renderer/rendererRegistry";
import { CellParserFactory } from "./cellParser/factory";
import { SqlSealDatabase } from "../database/database";
import { ViewPluginGenerator } from "./viewPluginGenerator";

export const syntaxHighlight = buildContainer((c) =>
	c
		.externals<{
			app: App;
			db: SqlSealDatabase;
			rendererRegistry: RendererRegistry;
			plugin: Plugin;
		}>()
		.register({
			init: asFactory(SyntaxHighlightInit),
			cellParser: asFactory(CellParserFactory),
			viewPluginGenerator: asFactory(ViewPluginGenerator)
		})
		.exports("init", "cellParser", "viewPluginGenerator"),
);

export type SyntaxHighlightModule = typeof syntaxHighlight;
