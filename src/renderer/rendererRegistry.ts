import { ModernCellParser } from "../cellParser/ModernCellParser";
import { ViewDefinition } from "../grammar/parser";

export interface DataFormat {
    data: Record<string, any>[],
    columns: string[]
}

export interface RendererContext {
    cellParser: ModernCellParser,
    sourcePath: string
}

export interface RenderReturn {
    render: (data: any) => void;
    error: (errorMessage: string) => void;
    cleanup?: () => void;
}
export interface RendererConfig<T extends Record<string, any> = Record<string, any>> {
	rendererKey: string;
	validateConfig: (config: string) => T,
	render: (config: T, el: HTMLElement, context: RendererContext) => RenderReturn,
    viewDefinition: ViewDefinition
}

export interface Flag {
    name: string;
    key: string;
}

export class RendererRegistry {
    renderers: Map<string, RendererConfig> = new Map()
    renderersByKey: Map<string, RendererConfig> = new Map()
    _extraFlags: Array<Flag> = []
    constructor() { }

    register(uniqueName: string, config: RendererConfig) {
        if (this.renderers.has(uniqueName)) {
            throw new Error(`Renderer already registered for ${uniqueName}`)
        }
        if (this.renderersByKey.has(config.rendererKey)) {
            throw new Error(`Renderer already registered for type: ${config.rendererKey}`)
        }

        this.renderers.set(uniqueName, config)
        this.renderersByKey.set(config.rendererKey, config)
    }

    registerFlag(flag: Flag) {
        this._extraFlags.push(flag)
    }

    unregisterFlag(name: string) {
        this._extraFlags = this._extraFlags.filter(f => f.name !== name)
    }

    get flags(): Readonly<typeof this._extraFlags> {
        return this._extraFlags
    }

    unregister(uniqueName: string) {
        if (!this.renderers.has(uniqueName)) {
            throw new Error(`Renderer not registered: ${uniqueName}`)
        }
        const config = this.renderers.get(uniqueName)!
        this.renderersByKey.delete(config.rendererKey)
        this.renderers.delete(uniqueName)
    }

    prepareRender(type: string, config: string) {
        if (!this.renderersByKey.has(type)) {
            throw new Error(`Renderer does not exist for ${type}`)
        }
        const rendererConfig = this.renderersByKey.get(type.toLowerCase())!
        const elConfig = rendererConfig.validateConfig(config)
        return (el: HTMLElement, context: RendererContext) => {
            return rendererConfig.render(elConfig, el, context)
        }
    }

    getViewDefinitions() {
        return Array.from(this.renderers.values()).map(r => {
            if (r.rendererKey.toLowerCase() === 'chart' && !r.viewDefinition) {
                // backwards compatibility
                return {
                    argument: 'anyObject?',
                    name: 'chart',
                    singleLine: false
                } satisfies ViewDefinition
            }
            return r.viewDefinition
    })
    }
}
