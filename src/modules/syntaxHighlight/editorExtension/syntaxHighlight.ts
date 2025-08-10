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

import { Range } from '@codemirror/state';
import { Decorator, highlighterOperation } from '../grammar/highlighterOperation';
import { FilePathWidget } from './widgets/FilePathWidget';
import { RendererRegistry } from '../../editor/renderer/rendererRegistry';
import { SQLSealLangDefinition } from '../../editor/parser';

interface CodeBlockMatch {
  startIndex: number,
  content: string
}

const markDecorations = {
  blockFlag: Decoration.mark({ class: 'cm-sqlseal-block-flag' }),
  blockQuery: Decoration.mark({ class: 'cm-sqlseal-block-query' }),
  blockView: Decoration.mark({ class: 'cm-sqlseal-block-view' }),
  blockTable: Decoration.mark({ class: 'cm-sqlseal-block-table' }),
  identifier: Decoration.mark({ class: 'cm-sqlseal-identifier' }),
  literal: Decoration.mark({ class: 'cm-sqlseal-literal' }),
  number: Decoration.mark({ class: 'cm-sqlseal-literal' }),
  string: Decoration.mark({ class: 'cm-sqlseal-literal' }),
  parameter: Decoration.mark({ class: 'cm-sqlseal-parameter' }),
  comment: Decoration.mark({ class: 'cm-sqlseal-comment' }),
  keyword: Decoration.mark({ class: 'cm-sqlseal-keyword' }),
  'template-keyword': Decoration.mark({ class: 'cm-sqlseal-template-keyword' }),
  function: Decoration.mark({ class: 'cm-sqlseal-function' }),
  error: Decoration.mark({ class: "cm-sqlseal-error" })
};

export class SQLSealViewPlugin implements PluginValue {
  decorations: DecorationSet;
  private readonly app: App;
  private readonly renderers: RendererRegistry;

  constructor(view: EditorView, app: App, renderers: RendererRegistry, private allIsCode: boolean) {
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

  private parseWithGrammar(sql: string): Decorator[] {
    const grammar = ohm.grammar(SQLSealLangDefinition(this.renderers.getViewDefinitions(), this.renderers.flags, true));

    // FIXME: extend grammar with error line.

    const match = grammar.match(sql)
    if (match.failed()) {
      return []
    }
    const highlight = highlighterOperation(grammar)(match)

    const results = highlight.highlight()

    return results
  }

  private getCodeBlocks(view: EditorView): CodeBlockMatch[] {
    const text = view.state.doc.toString();
    if (this.allIsCode) {
      return [{
        startIndex: 0,
        content: text
      }]
    }

    // Parsing
    const codeBlockRegex = /```(sqlseal)\n([\s\S]*?)```/g;
    let match;
    let results: CodeBlockMatch[] = []
    while ((match = codeBlockRegex.exec(text)) !== null) {
      const blockStart = match.index;
      const langTagEnd = blockStart + match[1].length + 3;
      const sqlContent = match[2];
      const contentStart = langTagEnd + 1;
      results.push({
        content: sqlContent,
        startIndex: contentStart
      })
    }
    return results
  }

  decorateFilename(dec: Decorator, { content, startIndex }: CodeBlockMatch) {
    let hasQuotes = false;
    // Get the actual filename text from the document
    let filePath = content.slice(dec.start, dec.end)

    // Remove leading & trailing quotes, if captured.
    if (filePath.startsWith('"')) {
      filePath = filePath.substring(1, filePath.length - 1)
      hasQuotes = true;
    }

    // Create widget decoration for the filename
    const widget = new FilePathWidget(filePath, this.app);
    return Decoration.replace({
      widget,
      inclusive: true
    }).range(
      startIndex + dec.start + Number(hasQuotes),
      startIndex + dec.end - Number(hasQuotes)
    )
  }

  privateDecorateCodeblock(codeblockMatch: CodeBlockMatch): Array<Range<Decoration>> {
      const { content, startIndex } = codeblockMatch
      const decorations = this.parseWithGrammar(content);
        return (decorations || []).flatMap(dec => {
          switch (dec.type) {
            case 'filename':
              return this.decorateFilename(dec, codeblockMatch)
            default:
              const decoration = markDecorations[dec.type as keyof typeof markDecorations];
            if (decoration) {
              return decoration.range(
                startIndex + dec.start,
                startIndex + dec.end
              )
            } else {
              return []
            }
          }
        });
  }

  private buildDecorations(view: EditorView): DecorationSet {
    const builder: Array<Range<Decoration>> = [];
    // const text = view.state.doc.toString();
    // const codeBlockRegex = /```(sqlseal)\n([\s\S]*?)```/g;
    // let match;

    const results = this.getCodeBlocks(view)
    const decorators = results.flatMap(r => this.privateDecorateCodeblock(r))

    return Decoration.set(decorators, true);
    

    // while ((match = codeBlockRegex.exec(text)) !== null) {
    //   const blockStart = match.index;
    //   const langTagEnd = blockStart + match[1].length + 3;
    //   const sqlContent = match[2];
    //   const contentStart = langTagEnd + 1;


    //   const decorations = this.parseWithGrammar(sqlContent)

    //   if (decorations) {
    //     decorations.forEach(dec => {
    //       if (dec.type === 'filename') {
    //         let hasQuotes = false;
    //         // Get the actual filename text from the document
    //         let filePath = view.state.doc.sliceString(
    //           contentStart + dec.start,
    //           contentStart + dec.end
    //         );

    //         // Remove leading & trailing quotes, if captured.
    //         if (filePath.startsWith('"')) {
    //           filePath = filePath.substring(1, filePath.length - 1)
    //           hasQuotes = true;
    //         }

    //         // Create widget decoration for the filename
    //         const widget = new FilePathWidget(filePath, this.app);
    //         builder.push(Decoration.replace({
    //           widget,
    //           inclusive: true
    //         }).range(
    //           contentStart + dec.start + Number(hasQuotes),
    //           contentStart + dec.end - Number(hasQuotes)
    //         ));
    //       } else {
    //         const decoration = markDecorations[dec.type as keyof typeof markDecorations];
    //         if (decoration) {
    //           builder.push(decoration.range(
    //             contentStart + dec.start,
    //             contentStart + dec.end
    //           ));
    //         }
    //       }
    //     });
    //   }
    // }

    // return Decoration.set(builder, true);
  }
}