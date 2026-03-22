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
  content: string,
  /** Characters stripped from the start of each content line (e.g. "> " in callouts) */
  linePrefix?: string
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

    // Parsing — match code blocks with optional callout prefix (e.g. "> ") on fence lines.
    // The prefix is captured so positions can be mapped back to the raw document.
    const codeBlockRegex = /^([ \t]*(?:> )*)```(sqlseal)\n([\s\S]*?)^[ \t]*(?:> )*```/gm;
    let match;
    let results: CodeBlockMatch[] = []
    while ((match = codeBlockRegex.exec(text)) !== null) {
      const fencePrefix = match[1] || '';
      const langTag = match[2];
      const rawContent = match[3];
      const blockStart = match.index;
      const langTagEnd = blockStart + fencePrefix.length + 3 + langTag.length; // prefix + ``` + langTag
      const contentStart = langTagEnd + 1; // +1 for the newline after the opening fence

      if (!fencePrefix) {
        results.push({ content: rawContent, startIndex: contentStart })
      } else {
        // Strip the callout prefix from each content line so the grammar can parse it cleanly.
        const strippedLines = rawContent.split('\n').map(line =>
          line.startsWith(fencePrefix) ? line.slice(fencePrefix.length) : line
        )
        results.push({
          content: strippedLines.join('\n'),
          startIndex: contentStart,
          linePrefix: fencePrefix
        })
      }
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
      const { content, startIndex, linePrefix } = codeblockMatch
      const decorations = this.parseWithGrammar(content);

      /**
       * Map a position in the (possibly stripped) content back to the raw document.
       * For callout blocks, each line has a prefix (e.g. "> ") that was removed before
       * parsing. We restore that offset here: for a position on line N, add (N+1) * prefixLen.
       */
      const toDocPos = (posInContent: number): number => {
        if (!linePrefix) return startIndex + posInContent
        const prefixLen = linePrefix.length
        const lineCount = (content.slice(0, posInContent).match(/\n/g) || []).length
        return startIndex + posInContent + (lineCount + 1) * prefixLen
      }

      return (decorations || []).flatMap(dec => {
          switch (dec.type) {
            case 'filename':
              return this.decorateFilename(dec, codeblockMatch)
            default:
              const decoration = markDecorations[dec.type as keyof typeof markDecorations];
            if (decoration) {
              return decoration.range(
                toDocPos(dec.start),
                toDocPos(dec.end)
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