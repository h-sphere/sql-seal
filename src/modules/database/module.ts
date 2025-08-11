import { asClass, asFactory, buildContainer } from "@hypersphere/dity";
import { App, Vault } from "obsidian";
import { DatabaseFactory } from "./factory";
import { DatabaseProvider } from "./sqlocal/databaseProvider";

export const db = buildContainer(c => c
    .register({
        db: asFactory(DatabaseFactory),
        provider: asClass(DatabaseProvider)
    })
    .externals<{ app: App }>()
    .exports('db', 'provider')
)

export type DatabaseModule = typeof db
