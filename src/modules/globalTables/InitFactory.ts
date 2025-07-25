import { makeInjector } from "@hypersphere/dity"
import { GlobalTablesModule } from "./module"

@(makeInjector<GlobalTablesModule, 'factory'>()(['globalTablesViewRegister']))
export class InitFactory {
    make(register: () => void) {
        return () => {
            register()
        }
    }
}