import { Registrator } from "@hypersphere/dity";
import { App, Plugin } from "obsidian";
import { contextMenuInit } from "./init";

export const contextMenu = new Registrator()
    .import<'app', App>()
    .import<'plugin', Plugin>()
    .register('init', d => d.fn(contextMenuInit).inject('plugin', 'app'))
    .export('init')
