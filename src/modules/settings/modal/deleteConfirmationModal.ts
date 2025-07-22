import { App, Modal } from 'obsidian';

export class DeleteConfirmationModal extends Modal {
    private onConfirm: () => void;
    private itemName: string;

    constructor(app: App, itemName: string, onConfirm: () => void) {
        super(app);
        this.itemName = itemName;
        this.onConfirm = onConfirm;
    }

    onOpen() {
        const {contentEl} = this;
        
        contentEl.createEl('h2', {text: `Delete ${this.itemName}?`});
        contentEl.createEl('p', {
            text: `Are you sure you want to delete this ${this.itemName}? This action cannot be undone.`
        });

        const buttonContainer = contentEl.createDiv('modal-button-container');
        
        buttonContainer.createEl('button', {
            text: 'Cancel',
            cls: 'mod-warning'
        }).addEventListener('click', () => this.close());
        
        buttonContainer.createEl('button', {
            text: 'Delete',
            cls: 'mod-cta'
        }).addEventListener('click', () => {
            this.onConfirm();
            this.close();
        });
    }

    onClose() {
        const {contentEl} = this;
        contentEl.empty();
    }
}