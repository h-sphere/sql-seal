export class Component {
	private _cleanups: (() => any)[] = [];
	load() { this.onload(); }
	onload() {}
	unload() { this._cleanups.forEach(cb => cb()); this.onunload(); }
	onunload() {}
	register(cb: () => any) { this._cleanups.push(cb); }
	addChild<T extends Component>(c: T) { return c; }
	removeChild<T extends Component>(c: T) { return c; }
}

export class MarkdownRenderChild extends Component {
	containerEl: HTMLElement;
	constructor(containerEl: HTMLElement) {
		super();
		this.containerEl = containerEl;
	}
}

export class App {}
export class Plugin extends Component {}
export class TFile {}
