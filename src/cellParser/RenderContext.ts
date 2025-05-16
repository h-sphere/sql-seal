// This is render context which collects all the parsed elements and maintains overvability of them.

import { ModernCellParser, OnRunCallback, UnregisterCallback } from "./ModernCellParser";

class RenderContext {

    private isContextActive: boolean = false;
    private contextActivateCalbacks: (() => ReturnType<OnRunCallback>)[] = []
    private contextDeactivateCallbacks: UnregisterCallback[] = []

    constructor(private readonly cellParser: ModernCellParser) {

    }

    render(context: string) {
        const res = this.cellParser.prepare(context)
        if (typeof res === 'string' || typeof res === 'number') {
            return res
        }
        if (res instanceof HTMLElement) {
            return res
        }

        if (res.onRunCallback) {
            // FIXME: not sure if this is the proper element, this might get recreated inside the handlebars. To check.
            this.contextActivateCalbacks.push(res.onRunCallback.apply(res.element, [res.element]))
        }
        return res.element
    }

    activate() {
        if (this.isContextActive) {
            throw new Error('Context already active')
        }
        this.isContextActive = true
        for (const cb of this.contextActivateCalbacks) {
            const res = cb()
            if (res) {
                this.contextDeactivateCallbacks.push(res)
            }
        }
    }

    deactivate() {
        if (!this.isContextActive) {
            throw new Error('Context not active')
        }
        this.isContextActive = false
        for (const cb of this.contextDeactivateCallbacks) {
            cb()
        }
        this.contextDeactivateCallbacks = []
    }

    clear() {
        try {
            this.deactivate()
        } catch (e) { }

        this.contextActivateCalbacks = []
    }
}