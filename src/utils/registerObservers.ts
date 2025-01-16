import { OmnibusRegistrator } from "@hypersphere/omnibus";

export interface RegisterConfiguration {
    bus: OmnibusRegistrator,
    tables: string[],
    callback: () => void,
    fileName: string
}

export const registerObservers = ({ bus, callback, fileName, tables}: RegisterConfiguration) => {
    bus.offAll()
    tables.forEach(t => {
        bus.on(`change::${t}`, callback)
    })
    bus.on(`file::change::${fileName}`, callback)
}