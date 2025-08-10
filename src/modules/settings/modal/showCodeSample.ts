import { App, Modal, Notice, Setting, TFile } from "obsidian";
import { sanitise } from "../../../utils/sanitiseColumn";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { ViewPluginGeneratorType } from "../../syntaxHighlight/viewPluginGenerator";

const query = (tableName: string, path: string) => `\`\`\`sqlseal
TABLE ${tableName} = file(${path})

SELECT * FROM ${tableName}
LIMIT 100
\`\`\``

export class CodeSampleModal extends Modal {
    constructor(app: App, private file: TFile, private viewPluginGenerator: ViewPluginGeneratorType) {
        super(app);
    }

    onOpen() {
        const {contentEl} = this;
        contentEl.createEl('h2', {text: 'SQLSeal Code'});

        contentEl.classList.add('sqlseal-modal-copycode')

        // Setup actual editor here
        const tableName = sanitise(this.file.basename)
        const q = query(tableName, this.file.path)

        const state = EditorState.create({
			doc: q,
            extensions: [
                this.viewPluginGenerator(false),
                EditorView.theme({
					"&": { height: "100%" },
					".cm-scroller": { fontFamily: "monospace" },
					".cm-content": {
						caretColor: "var(--color-base-100)",
					},
				}),
            ]
        })

        new EditorView({
			state,
			parent: contentEl.createDiv({ cls: 'cm-sqlseal-overlay' }),
		});

        // Add copy button
        new Setting(contentEl)
            .addButton(button => button
                .setButtonText('Copy to Clipboard')
                .onClick(async () => {
                    await navigator.clipboard.writeText(q);
                    new Notice('Copied to clipboard!');
                }));
    }

    onClose() {
        const {contentEl} = this;
        contentEl.empty();
    }
}