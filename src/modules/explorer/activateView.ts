import { App, WorkspaceLeaf } from "obsidian";

export const activateView = async (app: App, name: string) => {
	const { workspace } = app;

	let leaf: WorkspaceLeaf | null = null;
	const leaves = workspace.getLeavesOfType(name);

	if (leaves.length > 0) {
		// A leaf with our view already exists, use that
		leaf = leaves[0];
	} else {
		leaf = workspace.getLeaf("tab");
		if (!leaf) {
			return;
		}
		await leaf.setViewState({ type: name, active: true });
	}

	// "Reveal" the leaf in case it is in a collapsed sidebar
	workspace.revealLeaf(leaf);
};
