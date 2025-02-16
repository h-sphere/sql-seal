import {
  App
} from 'obsidian';
import * as ohm from 'ohm-js';

import {
  ViewUpdate,
  PluginValue,
  EditorView,
  Decoration,
  DecorationSet
} from '@codemirror/view';

import { SQLSealLangDefinition } from '../grammar/parser';
import { RendererRegistry } from '../renderer/rendererRegistry';
import { traceWalker } from '../utils/traceWalker';
import { Range } from '@codemirror/state';

const markDecorations = {
  blockFlag: Decoration.mark({ class: 'cm-sqlseal-block-flag' }),
  blockQuery: Decoration.mark({ class: 'cm-sqlseal-block-query' }),
  blockView: Decoration.mark({ class: 'cm-sqlseal-block-view' }),
  blockTable: Decoration.mark({ class: 'cm-sqlseal-block-table' }),
  identifier: Decoration.mark({ class: 'cm-sqlseal-identifier' }),
  keyword: Decoration.mark({ class: 'cm-sqlseal-keyword' }),
  function: Decoration.mark({ class: 'cm-sqlseal-function' }),
  error: Decoration.mark({ class: "cm-sql-error" })
};

export class SQLSealViewPlugin implements PluginValue {
  decorations: DecorationSet;
  private readonly app: App;
  private readonly renderers: RendererRegistry;

  constructor(view: EditorView, app: App, renderers: RendererRegistry) {
    this.app = app;
    this.renderers = renderers;
    this.decorations = this.buildDecorations(view);
  }

  update(update: ViewUpdate): void {
    if (update.docChanged || update.viewportChanged) {
      this.decorations = this.buildDecorations(update.view);
    }
  }

  destroy(): void { }

  private parseWithGrammar(sql: string) {
    const grammar = ohm.grammar(SQLSealLangDefinition(this.renderers.getViewDefinitions()));

    const trace = grammar.trace(sql)
    const decs = traceWalker(trace as any)
    return decs
  }

  private buildDecorations(view: EditorView): DecorationSet {
    const builder: Array<Range<Decoration>> = [];
    const text = view.state.doc.toString();
    const codeBlockRegex = /```(sqlseal)\n([\s\S]*?)```/g;
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      const blockStart = match.index;
      const langTagEnd = blockStart + match[1].length + 3;
      const sqlContent = match[2];
      const contentStart = langTagEnd + 1;


      const decorations = this.parseWithGrammar(sqlContent);

      if (decorations) {
        decorations.forEach(dec => {
          const decoration = markDecorations[dec.type as keyof typeof markDecorations];
          if (decoration) {
            builder.push(decoration.range(
              contentStart + dec.start,
              contentStart + dec.end
            ));
          }
        });
      }
    }

    return Decoration.set(builder, true);
  }
}