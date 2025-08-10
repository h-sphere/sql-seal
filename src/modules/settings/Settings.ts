import { args, BusBuilder, CallbackType } from "@hypersphere/omnibus";
import { SQLSealSettings } from "./SQLSealSettingsTab";

export class Settings {
    bus = BusBuilder
        .init()
        .register('change', args<SQLSealSettings>())
        .build()

    constructor(private settings: SQLSealSettings) {
    }

    get<K extends keyof SQLSealSettings>(key: K): SQLSealSettings[K]  {
        return this.settings[key]
    }

    set<K extends keyof SQLSealSettings>(key: K, val: SQLSealSettings[K]) {
        this.settings[key] = val
        this.bus.trigger('change', this.settings)
    }

    onChange(fn: CallbackType<[SQLSealSettings]>) {
        return this.bus.on('change', fn)
    }
}