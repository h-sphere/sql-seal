import { asFactory, buildContainer } from "@hypersphere/dity";
import { ApiInit } from "./init";
import { Plugin } from "obsidian";

export const apiModule = buildContainer(c => c
    .register({
        init: asFactory(ApiInit)
    })
    .externals<{
        plugin: Plugin
    }>()
)

export type ApiModule = typeof apiModule