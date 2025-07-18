import { EditorView, ViewPlugin, ViewUpdate, DecorationSet, Decoration, WidgetType } from "@codemirror/view";
import { RangeSetBuilder } from "@codemirror/state";
import { syntaxTree } from "@codemirror/language";
import { App, Plugin } from "obsidian";
import { Sync } from "../modules/sync/sync/sync";
import { SqlSealInlineHandler } from "../codeblockHandler/inline/InlineCodeHandler";
import { InlineProcessor } from "../codeblockHandler/inline/InlineProcessor";
import SqlSealPlugin from "../main";
import { SqlSealDatabase } from "../modules/database/database";

export function createSqlSealEditorExtension(
    app: App,
    db: SqlSealDatabase,
    plugin: Plugin,
    sync: Sync,
) {
    return ViewPlugin.fromClass(
        class {
            decorations: DecorationSet;
            inlineHandler: SqlSealInlineHandler;

            constructor(view: EditorView) {
                this.inlineHandler = new SqlSealInlineHandler(app, db, plugin, sync);
                this.decorations = this.buildDecorations(view);
            }

            update(update: ViewUpdate) {
                if (update.docChanged || update.viewportChanged || update.selectionSet) {
                    this.decorations = this.buildDecorations(update.view);
                }
            }

            buildDecorations(view: EditorView) {
                const builder = new RangeSetBuilder<Decoration>();
                const tree = syntaxTree(view.state);

                tree.iterate({
                    enter: ({ type, from, to }) => {
                        if (type.name.includes("inline-code")) {
                            const text = view.state.doc.sliceString(from, to);
                            if (text.startsWith('S>')) {
                                // Check if we're currently editing this specific inline code
                                const isEditing = view.hasFocus && 
                                    view.state.selection.ranges.some(range => 
                                        range.from >= from && range.to <= to);

                                if (!isEditing) {
                                    // Create a replacement decoration
                                    builder.add(from, to, Decoration.replace({
                                        widget: new SqlSealInlineWidget(
                                            text,
                                            this.inlineHandler,
                                            view.state.doc.lineAt(from).number,
                                            app
                                        )
                                    }));
                                }
                            }
                        }
                    }
                });

                return builder.finish();
            }
        },
        {
            decorations: (v) => v.decorations
        }
    );
}

class SqlSealInlineWidget extends WidgetType {
    constructor(
        private query: string,
        private handler: SqlSealInlineHandler,
        private line: number,
        private app: App
    ) {
        super();
    }

    eq(other: SqlSealInlineWidget): boolean {
        return (
            other.query === this.query &&
            other.line === this.line
        );
    }

    processor: InlineProcessor

    toDOM(): HTMLElement {
        const container = document.createElement('span');
        container.classList.add('sqlseal-inline-result');
        
        // Create a new context for the inline query
        const ctx = {
            sourcePath: this.app.workspace.getActiveFile()?.path ?? '',
            addChild: () => {},
            getSectionInfo: () => ({
                lineStart: this.line,
                lineEnd: this.line
            })
        };

        // Show the original query on hover
        container.setAttribute('aria-label', this.query);
        container.classList.add('has-tooltip');

        this.processor = this.handler.instantiateProcessor(this.query, container, ctx.sourcePath)

        this.processor.load()
        return container;
    }

    destroy(dom: HTMLElement): void {
        if (this.processor) {
            this.processor.unload()
        }
    }

    ignoreEvent(event: Event): boolean {
        // Return false to allow events to propagate (important for editing)
        return false;
    }
}