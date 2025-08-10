import { makeInjector } from "@hypersphere/dity";
import { DebugModule } from "./module";
import { Plugin, WorkspaceLeaf } from "obsidian";
import { DityGraphView, VIEW_TYPE_EXAMPLE } from "./DityGraphView";

@(makeInjector<DebugModule, 'factory'>()(
    ['plugin']
))
export class DityGraph {
    make(plugin: Plugin) {

        const activateView = async () => {
            const { workspace } = plugin.app;

            let leaf: WorkspaceLeaf | null = null;
            const leaves = workspace.getLeavesOfType(VIEW_TYPE_EXAMPLE);

            if (leaves.length > 0) {
                // A leaf with our view already exists, use that
                leaf = leaves[0];
            } else {
                // Our view could not be found in the workspace, create a new leaf
                // in the right sidebar for it
                leaf = workspace.getRightLeaf(false);
                if (!leaf) { return }
                await leaf.setViewState({ type: VIEW_TYPE_EXAMPLE, active: true });
            }

            // "Reveal" the leaf in case it is in a collapsed sidebar
            workspace.revealLeaf(leaf);
        }

        return () => {
            plugin.registerView(VIEW_TYPE_EXAMPLE, leaf => new DityGraphView(leaf))
            plugin.addRibbonIcon('dice', 'Dity Graph', activateView)

        }
    }
}