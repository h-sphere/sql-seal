import { ItemView, WorkspaceLeaf } from "obsidian";
import { DityGraph } from '@hypersphere/dity-graph'
import { mainModule } from "../main/module";
import { settingsModule } from "../settings/module";

export const VIEW_TYPE_EXAMPLE = "example-view";

export class DityGraphView extends ItemView {
    constructor(leaf: WorkspaceLeaf) {
        super(leaf);
    }

    getViewType() {
        return VIEW_TYPE_EXAMPLE;
    }

    getDisplayText() {
        return "Example sidebar";
    }

    async onOpen() {
        const container = this.containerEl.children[1];
        container.empty();
        // container.createEl("h4", { text: "Example Sidebar" });
        // container.createEl("p", { text: "Your sidebar content goes here" });
        const el = container.createEl('div')
        el.style = 'width: 100%; height: 100%'

        const module = settingsModule.resolve({ plugin: { } as any, app: {} as any, cellParser: { } as any})
        // .resolve({
		// 		'obsidian.app': {} as any,
		// 		'obsidian.plugin': {} as any,
		// 		'obsidian.vault': {} as any,
        // })

        const dityGraph = new DityGraph(module as any, el)
        dityGraph.render()
    }

    async onClose() {
        // Clean up if needed
    }
}