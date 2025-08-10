import { OmnibusRegistrator } from "@hypersphere/omnibus";
import {
	App,
	MarkdownPostProcessorContext,
	MarkdownRenderChild,
} from "obsidian";
import { Sync } from "../../sync/sync/sync";
import { RendererRegistry, RenderReturn } from "../renderer/rendererRegistry";
import { ParserResult, parseWithDefaults, TableDefinition } from "../parser";
import { SqlSealDatabase } from "../../database/database";
import { displayError, displayNotice } from "../../../utils/ui";
import { transformQuery } from "../sql/sqlTransformer";
import { registerObservers } from "../../../utils/registerObservers";
import { Settings } from "../../settings/Settings";
import { ModernCellParser } from "../../syntaxHighlight/cellParser/ModernCellParser";

export class CodeblockProcessor extends MarkdownRenderChild {
	registrator: OmnibusRegistrator;
	renderer: RenderReturn;
	private flags: ParserResult["flags"];
	private extrasEl: HTMLElement;
	private explainEl: HTMLElement;

	constructor(
		private el: HTMLElement,
		private source: string,
		private ctx: MarkdownPostProcessorContext,
		private rendererRegistry: RendererRegistry,
		private db: SqlSealDatabase,
		private cellParser: ModernCellParser,
		private settings: Settings,
		private app: App,
		private sync: Sync,
	) {
		super(el);

		this.registrator = this.sync.getRegistrator();
	}

	query: string;

	async onload() {
		try {
			const defaults: ParserResult = {
				flags: {
					refresh: this.settings.get("enableDynamicUpdates"),
					explain: false,
				},
				query: "",
				renderer: {
					options: "",
					type: this.settings.get("defaultView").toUpperCase(),
				},
				tables: [],
			};

			const results = parseWithDefaults(
				this.source,
				this.rendererRegistry.getViewDefinitions(),
				defaults,
				this.rendererRegistry.flags,
			);

			if (results.tables) {
				await this.registerTables(results.tables);
				if (!results.query) {
					displayNotice(
						this.el,
						`Creating tables: ${results.tables.map((t) => t.tableAlias).join(", ")}`,
					);
					return;
				}
			}

			this.flags = results.flags;
			let rendererEl = this.el;

			if (this.flags.explain) {
				this.extrasEl = this.el.createDiv({ cls: "sqlseal-extras-container" });
				if (this.flags.explain) {
					this.explainEl = this.extrasEl.createEl("pre", {
						cls: "sqlseal-extras-explain-container",
					});
				}
				rendererEl = this.el.createDiv({ cls: "sqlseal-renderer-container" });
			}

            // IF WE'RE ON CANVAS, LETS ADD BACKGRUND
            if (this.isOnCanvas) {
                rendererEl.classList.add('sqlseal-renderer-on-canvas')
            }

			this.renderer = this.rendererRegistry.prepareRender(
				results.renderer.type.toLowerCase(),
				results.renderer.options,
			)(rendererEl, {
				cellParser: this.cellParser,
				sourcePath: this.sourceKey,
			});

			// FIXME: probably should save the one before transform and perform transform every time we execute it.
			this.query = results.query;
			await this.render();
		} catch (e) {
			displayError(this.el, e.toString());
		}
	}

	onunload() {
		this.registrator.offAll();
		if (this.renderer?.cleanup) {
			this.renderer.cleanup();
		}
	}

	async render() {
		try {
			const registeredTablesForContext =
				await this.sync.getTablesMappingForContext(this.sourceKey);

			const res = transformQuery(this.query, registeredTablesForContext);
			const transformedQuery = res.sql;

			if (this.flags.refresh) {
				registerObservers({
					bus: this.registrator,
					callback: () => this.render(),
					fileName: this.sourceKey,
					tables: res.mappedTables,
				});
			}

			let variables = {};
			const file = this.app.vault.getFileByPath(this.sourceKey);
			if (file) {
				const fileCache = this.app.metadataCache.getFileCache(file);
				variables = {
					...(fileCache?.frontmatter ?? {}),
					path: file.path,
					fileName: file.name,
					basename: file.basename,
					parent: file.parent?.path,
					extension: file.extension,
				};
			}

			if (this.flags.explain) {
				// Rendering explain
				const result = await this.db.explain(transformedQuery, variables);
				this.explainEl.textContent = result;
			}

			const { data, columns } = (await this.db.select(
				transformedQuery,
				variables,
			))!; // FIXME: check this
			this.renderer.render({
				data,
				columns,
				flags: this.flags,
				frontmatter: variables,
			});
		} catch (e) {
			this.renderer.error(e.toString());
		}
	}

    private cachedName: string | null = null

    get isOnCanvas() {
        return !this.ctx.sourcePath
    }

	get canvasName() {
        // This is hack to detect what name has current canvas.
        // It's not fool proof but should work for majority of use-cases for now.
        // We need to find proper way of getting it or ask Obsidian devs to expose some info.
        
        if (this.cachedName !== null) {
            return this.cachedName
        }
		const canvasViews = this.app.workspace.getLeavesOfType("canvas");

		for (const leaf of canvasViews) {
            const canvasView = leaf.view as any; // Canvas view has data and file properties not exposed in base View type
            const nodes = JSON.parse(canvasView.data).nodes
            const node = nodes.filter((n: any) => n.text).find((n: any) => n.text.contains(this.source))
            if (node) {
                this.cachedName = canvasView.file.path
                return this.cachedName as string
            }
		}
        this.cachedName = ''
        return ''
	}

	get sourceKey() {
		return this.ctx.sourcePath.trim() ? this.ctx.sourcePath.trim() : this.canvasName;
	}

	async registerTables(tables: TableDefinition[]) {
		await Promise.all(
			tables.map((table) =>
				this.sync.registerTable({
					...table,
					sourceFile: this.sourceKey,
				}),
			),
		);
	}
}
