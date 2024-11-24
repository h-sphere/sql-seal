import { App, Modal, Notice, Setting, TFile } from "obsidian";
import { sanitise } from "src/utils/sanitiseColumn";

export class CodeSampleModal extends Modal {
    constructor(app: App, private file: TFile) {
        super(app);
    }

    onOpen() {
        const {contentEl} = this;
        contentEl.createEl('h2', {text: 'SQLSeal Code'});

        // Add container for code
        const textArea = contentEl.createEl('textarea', {
            cls: 'sql-seal-modal-code',
            attr: {
                rows: '10'
            }
        });

        const tableName = sanitise(this.file.basename)
        
        textArea.setText(`TABLE ${tableName} = file(${this.file.path})

SELECT * FROM ${tableName}
LIMIT 100`);

        // Add copy button
        new Setting(contentEl)
            .addButton(button => button
                .setButtonText('Copy to Clipboard')
                .onClick(async () => {
                    await navigator.clipboard.writeText(textArea.getText());
                    new Notice('Copied to clipboard!');
                }));
    }

    onClose() {
        const {contentEl} = this;
        contentEl.empty();
    }
}