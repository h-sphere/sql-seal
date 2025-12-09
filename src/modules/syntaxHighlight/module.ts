import { Registrator } from "@hypersphere/dity";
import { syntaxHighlightInit } from "./init";
import { App, Plugin } from "obsidian";
import { RendererRegistry } from "../editor/renderer/rendererRegistry";
import { cellParserFactory } from "./cellParser/factory";
import { SqlocalDatabaseProxy } from "../database/sqlocal/sqlocalDatabase";
import { viewPluginGeneratorFactory } from "./viewPluginGenerator";


export const syntaxHighlight = new Registrator()
	.import<'app', App>()
	.import<'db', Promise<SqlocalDatabaseProxy>>()
	.import<'rendererRegistry', RendererRegistry>()
	.import<'plugin', Plugin>()
	.register('cellParser', d => d.fn(cellParserFactory).inject('app', 'db'))
	.register('viewPluginGenerator', d => d.fn(viewPluginGeneratorFactory).inject('app', 'rendererRegistry'))
	.register('init', d => d.fn(syntaxHighlightInit).inject('plugin', 'viewPluginGenerator'))
	.export('init', 'viewPluginGenerator', 'cellParser')
