import { Registrator } from "@hypersphere/dity";
import { syntaxHighlightInit } from "./init";
import { App, Plugin } from "obsidian";
import { RendererRegistry } from "../editor/renderer/rendererRegistry";
import { cellParserFactory } from "./cellParser/factory";
import { SqlSealDatabase } from "../database/database";
import { viewPluginGeneratorFactory } from "./viewPluginGenerator";


export const syntaxHighlight = new Registrator()
	.import<'app', App>()
	.import<'db', Promise<SqlSealDatabase>>()
	.import<'rendererRegistry', RendererRegistry>()
	.import<'plugin', Plugin>()
	.register('cellParser', d => d.fn(cellParserFactory).inject('app', 'db'))
	.register('viewPluginGenerator', d => d.fn(viewPluginGeneratorFactory).inject('app', 'rendererRegistry'))
	.register('init', d => d.fn(syntaxHighlightInit).inject('plugin', 'viewPluginGenerator'))
	.export('init', 'viewPluginGenerator', 'cellParser')
