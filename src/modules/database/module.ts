import { asFactory, buildContainer } from "@hypersphere/dity";
import { App } from "obsidian";
import { DatabaseFactory } from "./factory";

export const db = buildContainer(c => c
    .register({
        db: asFactory(DatabaseFactory)
    })
    .externals<{ app: App }>()
)

export type DbModel = typeof db
