import {
    Plugin,
    TFile,
    App
  } from 'obsidian';
  
  import {
    ViewUpdate,
    PluginValue,
    EditorView,
    ViewPlugin,
    Decoration,
    DecorationSet,
    WidgetType
  } from '@codemirror/view';
  
  import {
    Extension,
    StateField,
    EditorState
  } from '@codemirror/state';
  
  import {
    CompletionContext,
    autocompletion,
    Completion,
    CompletionResult
  } from '@codemirror/autocomplete';
  
  const SQL_KEYWORDS = [
    "SELECT", "FROM", "WHERE", "TABLE", "INSERT", "UPDATE", "DELETE",
    "CREATE", "DROP", "ALTER", "INTO", "VALUES", "JOIN", "LEFT",
    "RIGHT", "INNER", "OUTER", "GROUP", "BY", "HAVING", "ORDER",
    "LIMIT", "OFFSET", "AS", "AND", "OR", "NOT", "NULL", "IS", "IN"
  ];
  
  class TableStatsWidget extends WidgetType {
    toDOM(): HTMLElement {
      const comment = document.createElement('span');
      comment.className = 'table-stats-comment';
      comment.textContent = '// Rows: 100, Columns: 500';
      return comment;
    }
  }
  
  class SQLSealIconWidget extends WidgetType {
    toDOM(): HTMLElement {
      const icon = document.createElement('span');
      icon.innerHTML = '<?xml version="1.0" encoding="UTF-8" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg width="100%" height="100%" viewBox="0 0 800 800" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/" style="fill-rule:evenodd;clip-rule:evenodd;"><path d="M622.836,619.536c7.462,5.648 73.146,75.603 68.132,93.136c-5.592,19.579 -28.429,24.142 -51.066,24.142c-7.141,-0 -14.257,-0.454 -20.811,-1.033c-17.659,-1.561 -34.668,-4.617 -44.371,-6.552c-19.94,46.456 -137.648,59.456 -193.367,45.705c-25.946,-6.403 -26.845,-20.769 -27.84,-19.936c-20.591,17.242 -123.963,27.267 -141.833,-5.23c-4.429,-8.053 -2.328,-29.412 7.649,-40.455c3.501,-3.873 6.825,-7.696 10.006,-11.471c-3.961,-4.533 -7.765,-9.209 -11.325,-14.019c-10.063,-13.601 -25.618,-21.635 -42.681,-22.042c-30.837,-0.737 -56.731,-5.137 -76.966,-13.081c-15.848,-6.218 -25.941,-20.718 -26.338,-37.834c-0.397,-17.077 9.391,-32.601 24.934,-39.544c13.923,-6.185 27.782,-10.652 41.22,-13.292c5.093,-0.998 9.034,-4.601 10.54,-9.64c0.672,-2.248 1.71,-7.993 -3.177,-12.776c-0.234,-0.225 -0.551,-0.532 -0.898,-0.839c-7.925,-7.023 -11.224,-17.78 -8.625,-28.084c2.655,-10.53 10.864,-18.614 21.42,-21.1c22.439,-5.28 42.64,-2.681 58.428,7.532c11.534,7.464 21.196,19.734 31.424,32.724c27.83,35.346 47.584,55.454 87.218,36.684c10.973,-5.199 17.811,-12.206 20.906,-21.427c9,-26.806 -12.741,-68.517 -27.126,-96.118c-6.851,-13.145 -11.802,-22.642 -13.512,-30.055c-5.575,-24.158 -2.489,-46.593 9.178,-66.686c16.018,-27.587 48.506,-47.388 94.437,-65.193c27.988,-10.849 67.302,3.871 75.203,14.266c9.298,12.231 13.084,28.102 9.923,43.701c-5.644,27.676 -9.426,79.045 28.643,112.348c28.44,24.885 63.283,59.037 80.44,102.632c8.147,20.702 11.547,41.921 10.235,63.537Z" style="fill:#9ac3eb;"/><g><g><path d="M655.179,646.61c-12.313,-11.521 -24.881,-21.426 -32.343,-27.074c1.312,-21.616 -2.088,-42.835 -10.235,-63.537c-17.157,-43.595 -52,-77.747 -80.44,-102.632c-38.069,-33.303 -34.287,-84.672 -28.643,-112.348c3.161,-15.599 -0.625,-31.47 -9.923,-43.701c-7.901,-10.395 -47.215,-25.115 -75.203,-14.266c-45.931,17.805 -78.419,37.606 -94.437,65.193c-11.667,20.093 -14.753,42.528 -9.178,66.686c1.71,7.413 6.661,16.91 13.512,30.055c14.385,27.601 36.126,69.312 27.126,96.118c-3.095,9.221 -9.933,16.228 -20.906,21.427c-39.634,18.77 -59.388,-1.338 -87.218,-36.684c-10.228,-12.99 -19.89,-25.26 -31.424,-32.724c-15.788,-10.213 -35.989,-12.812 -58.428,-7.532c-10.556,2.486 -18.765,10.57 -21.42,21.1c-2.599,10.304 0.7,21.061 8.625,28.084c0.347,0.307 0.664,0.614 0.898,0.839c4.887,4.783 3.849,10.528 3.177,12.776c-1.506,5.039 -5.447,8.642 -10.54,9.64c-13.438,2.64 -27.297,7.107 -41.22,13.292c-15.543,6.943 -25.331,22.467 -24.934,39.544c0.397,17.116 10.49,31.616 26.338,37.834c20.235,7.944 46.129,12.344 76.966,13.081c17.063,0.407 32.618,8.441 42.681,22.042c3.56,4.81 7.364,9.486 11.325,14.019c-3.181,3.775 -6.505,7.598 -10.006,11.471c-9.977,11.043 -12.078,32.402 -7.649,40.455c17.87,32.497 121.242,22.472 141.833,5.23c0.995,-0.833 1.894,13.533 27.84,19.936c55.719,13.751 173.427,0.751 193.367,-45.705c9.703,1.935 26.712,4.991 44.371,6.552c6.554,0.579 13.67,1.033 20.811,1.033c22.637,-0 45.474,-4.563 51.066,-24.142c5.014,-17.533 -6.36,-38.525 -35.789,-66.062Zm-84.748,40.959c-23.467,40.131 -77.446,63.53 -137.527,65.197l-13.094,-0c-16.408,-0.404 -33.125,-2.383 -49.689,-6.102c35.251,-21.324 55.068,-46.702 56.562,-48.657c4.913,-6.433 3.679,-15.63 -2.754,-20.543c-6.433,-4.911 -15.63,-3.679 -20.543,2.754c-0.586,0.766 -59.628,76.504 -156.097,65.569c-5.454,-0.618 -7.547,-4.668 -8.195,-6.381c-0.66,-1.748 -1.792,-6.264 1.979,-10.436c25.924,-28.687 43.668,-54.729 52.738,-77.405c3.007,-7.516 -0.648,-16.044 -8.164,-19.051c-7.519,-3.008 -16.044,0.648 -19.051,8.164c-4.012,10.029 -10.418,21.318 -18.929,33.476c-2.095,-2.545 -4.147,-5.128 -6.098,-7.764c-15.485,-20.925 -39.374,-33.285 -65.546,-33.911c-27.01,-0.644 -50.163,-4.469 -66.957,-11.063c-6.816,-2.676 -7.686,-8.743 -7.745,-11.228c-0.046,-2.024 0.364,-8.876 7.561,-12.091c11.892,-5.284 23.649,-9.086 34.932,-11.303c15.727,-3.081 28.364,-14.574 32.979,-29.999c4.509,-15.072 0.392,-31.213 -10.75,-42.122c-0.041,-0.04 -0.111,-0.108 -0.152,-0.148c-0.226,-0.215 -0.451,-0.431 -0.68,-0.646c14.216,-3.156 25.898,-1.863 34.729,3.851c7.442,4.814 15.639,15.226 24.316,26.246c23.569,29.932 59.187,75.168 122.793,45.038c18.296,-8.668 30.458,-21.648 36.146,-38.585c12.972,-38.628 -12.238,-86.992 -28.92,-118.995c-4.722,-9.058 -10.074,-19.328 -10.944,-23.099c-3.902,-16.902 -1.949,-31.745 5.965,-45.378c13.984,-24.082 45.76,-43.29 94.443,-57.087c7.71,-2.182 16.056,-0.365 22.277,4.816l0.427,0.357c6.985,5.816 10.181,15.067 8.344,24.127c-6.915,33.894 -11.164,97.181 38.063,140.247c25.941,22.699 57.624,53.589 72.467,91.308c15.105,38.371 10.233,77.901 -14.886,120.844Zm45.839,18.493c-7.435,-0.797 -14.663,-1.842 -21.02,-2.891c0.16,-0.266 0.328,-0.53 0.486,-0.799c9.824,-16.797 16.992,-33.453 21.532,-49.922c5.227,4.269 11.065,9.241 16.841,14.592c25.25,23.392 28.281,34.32 28.634,36.946c-2.402,1.402 -12.801,5.682 -46.473,2.074Z" style="fill-rule:nonzero;"/></g></g><g><g><circle cx="398.568" cy="355.953" r="14.656"/></g></g><path d="M583.419,40.06c61.177,27.41 86.374,104.279 56.233,171.55c-30.141,67.271 -104.279,99.633 -165.456,72.223c-61.177,-27.411 -86.374,-104.28 -56.233,-171.551c30.14,-67.271 104.279,-99.633 165.456,-72.222Z" style="fill:#ffb62f;"/><g><g><path d="M653.651,131.912c-9.753,28.845 -64.426,36.417 -122.117,16.912c-57.691,-19.505 -96.552,-58.701 -86.8,-87.546c9.753,-28.845 64.426,-36.417 122.117,-16.912c57.691,19.505 96.552,58.7 86.8,87.546Z" style="fill:none;fill-rule:nonzero;stroke:#000;stroke-width:27.57px;"/><path d="M631.578,197.198c-9.753,28.845 -64.426,36.417 -122.117,16.912c-57.691,-19.505 -96.552,-58.701 -86.8,-87.546" style="fill:none;fill-rule:nonzero;stroke:#000;stroke-width:27.57px;"/><path d="M444.734,61.278l-44.146,130.573c-9.752,28.845 29.109,68.041 86.8,87.546c57.691,19.505 112.364,11.932 122.117,-16.912l44.146,-130.573" style="fill:none;fill-rule:nonzero;stroke:#000;stroke-width:27.57px;"/></g></g></svg>';
      icon.className = 'sqlseal-icon';
      icon.title = 'SQLSeal Code Block';
      return icon;
    }
  }
  
  const markDecorations = {
    block: Decoration.mark({ class: "cm-sqlseal-block" }),
    keyword: Decoration.mark({ class: "cm-sql-keyword" }),
    string: Decoration.mark({ class: "cm-sql-string" }),
    number: Decoration.mark({ class: "cm-sql-number" }),
    operator: Decoration.mark({ class: "cm-sql-operator" }),
    identifier: Decoration.mark({ class: "cm-sql-identifier" })
  };
  
  const iconWidget = Decoration.widget({
    widget: new SQLSealIconWidget(),
    side: 1
  });
  
  const tableStatsWidget = Decoration.widget({
    widget: new TableStatsWidget(),
    side: 1
  });
  
export  const sqlsealTheme = EditorView.theme({
    ".cm-sqlseal-block": { backgroundColor: "#f8f9fa" },
    ".cm-sql-keyword": { color: "#0033B3", fontWeight: "bold" },
    ".cm-sql-string": { color: "#067D17" },
    ".cm-sql-number": { color: "#1750EB" },
    ".cm-sql-operator": { color: "#5C5C5C" },
    ".cm-sql-identifier": { color: "#871094" },
    ".sqlseal-icon": {
      display: "inline-block",
      marginLeft: "4px",
      cursor: "pointer",
      fontSize: "14px",
      verticalAlign: "middle"
    },
    ".table-stats-comment": {
      color: "#808080",
      marginLeft: "1em",
      fontStyle: "italic"
    }
  });
  
export  function createFileCompletionSource(app: App) {
    return async (context: CompletionContext): Promise<CompletionResult | null> => {
      const word = context.matchBefore(/file\([^)]*$/);
      if (!word || (word.from === word.to && !context.explicit)) {
        return null;
      }
  
      const csvFiles = app.vault.getFiles()
        .filter(file => file.extension === 'csv')
        .map(file => file.path);
  
      return {
        from: word.from + 5,
        options: csvFiles.map(path => ({
          label: path,
          type: 'file',
          apply: path
        })),
        validFor: /^[^)]*$/
      };
    };
  }
  
export  class SQLSealViewPlugin implements PluginValue {
    decorations: DecorationSet;
    private readonly app: App;
  
    constructor(view: EditorView, app: App) {
      this.app = app;
      this.decorations = this.buildDecorations(view);
    }
  
    update(update: ViewUpdate): void {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = this.buildDecorations(update.view);
      }
    }
  
    destroy(): void {}
  
    private findTableLineEnds(text: string): number[] {
      const lines = text.split('\n');
      const positions: number[] = [];
      let currentPos = 0;
  
      for (const line of lines) {
        if (/\bTABLE\b/i.test(line)) {
          positions.push(currentPos + line.length);
        }
        currentPos += line.length + 1;
      }
  
      return positions;
    }
  
    private tokenize(sql: string): Array<{ type: string; text: string; index: number }> {
      const tokens: Array<{ type: string; text: string; index: number }> = [];
      let currentIndex = 0;
  
      const patterns = {
        whitespace: /^\s+/,
        string: /^(['"`])((?:\\.|[^\\])*?)\1/,
        number: /^\d*\.?\d+/,
        operator: /^[=<>!+\-*/%]+/,
        identifier: /^[a-zA-Z][a-zA-Z0-9_]*/,
        punctuation: /^[.,()[\];]/
      };
  
      while (currentIndex < sql.length) {
        const slice = sql.slice(currentIndex);
        let matched = false;
  
        for (const [type, pattern] of Object.entries(patterns)) {
          const match = slice.match(pattern);
          if (match) {
            const text = match[0];
            if (type !== 'whitespace') {
              const tokenType = SQL_KEYWORDS.includes(text.toUpperCase()) ? 'keyword' : type;
              tokens.push({ type: tokenType, text, index: currentIndex });
            }
            currentIndex += text.length;
            matched = true;
            break;
          }
        }
  
        if (!matched) {
          currentIndex++;
        }
      }
  
      return tokens;
    }
  
    private buildDecorations(view: EditorView): DecorationSet {
      const builder: Range<Decoration>[] = [];
      const text = view.state.doc.toString();
      const codeBlockRegex = /```(sqlseal)\n([\s\S]*?)```/g;
      let match;
  
      while ((match = codeBlockRegex.exec(text)) !== null) {
        const blockStart = match.index;
        const blockEnd = blockStart + match[0].length;
        const langTagEnd = blockStart + match[1].length + 3;
        const sqlContent = match[2];
        const contentStart = langTagEnd + 1;
  
        builder.push(markDecorations.block.range(blockStart, blockEnd));
        builder.push(iconWidget.range(langTagEnd));
  
        const tableLineEnds = this.findTableLineEnds(sqlContent);
        for (const lineEnd of tableLineEnds) {
          builder.push(tableStatsWidget.range(contentStart + lineEnd));
        }
  
        const tokens = this.tokenize(sqlContent);
        for (const token of tokens) {
          const tokenStart = contentStart + token.index;
          const tokenEnd = tokenStart + token.text.length;
          const decoration = markDecorations[token.type as keyof typeof markDecorations];
          if (decoration) {
            builder.push(decoration.range(tokenStart, tokenEnd));
          }
        }
      }
  
      return Decoration.set(builder, true);
    }
  }
  