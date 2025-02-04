import { App } from "obsidian";

export interface DataFormat {
    data: Record<string, any>[],
    columns: string[]
}

export interface RenderReturn {
    render: (data: any) => void;
    error: (errorMessage: string) => void;
}
export interface RendererConfig<T extends Record<string, any> = Record<string, any>> {
	rendererKey: string;
	validateConfig: (config: string) => T,
	render: (config: T, el: HTMLElement) => RenderReturn
}

export class RendererRegistry {
    renderers: Map<string, RendererConfig> = new Map()
    renderersByKey: Map<string, RendererConfig> = new Map()
    constructor() { }

    private default = 'grid'

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
        return (el: HTMLElement) => {
            return rendererConfig.render(elConfig, el)
        }
    }
}
