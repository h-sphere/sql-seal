import { makeInjector } from "@hypersphere/dity"
import { ContextMenuModule } from "./module"
import { App, Menu, Plugin, TAbstractFile, TFile, TFolder } from "obsidian"

@(makeInjector<ContextMenuModule, 'factory'>()([
    'plugin', 'app'
]))
export class ContextMenuInit {
    make(plugin: Plugin, app: App) {
        const createNewCSVFile = async (file: TAbstractFile) => {
            const targetDir = file instanceof TFile ? file.parent : file
            const basePath = targetDir!.path

            const csvTemplate = 'Id,Name\n1,Test Data'

            const defaultName = 'Untitled CSV'
            let fileName = defaultName
            let filePath = `${basePath}/${fileName}.csv`;
            let counter = 1;

            while (await app.vault.adapter.exists(filePath)) {
                fileName = `${defaultName} ${counter}`;
                filePath = `${basePath}/${fileName}.csv`;
                counter++;
            }

            try {
                const newFile = await app.vault.create(filePath, csvTemplate);

                const leaf = app.workspace.getLeaf(false);
                await leaf.openFile(newFile);

                const fileExplorer = app.workspace.getLeavesOfType('file-explorer')[0]?.view;
                if (fileExplorer) {
                    await(fileExplorer as any).revealInFolder(newFile);
                }
            } catch (error) {
                console.error('Error creating CSV file:', error);
                throw error;
            }
        }

        const addCSVCreatorMenuItem = (menu: Menu, file: TAbstractFile) => {
            if (!(file instanceof TFolder)) {
                return
            }
            menu.addItem((item) => {
                item
                    .setTitle('New CSV file')
                    .setSection('action-primary')
                    .setIcon('table')
                    .onClick(async () => {
                        try {
                            await createNewCSVFile(file)
                        } catch (error) {
                            console.error('Failed to create CSV file:', error)
                        }
                    });
            });
        }

        return () => {
            plugin.registerEvent(
                app.workspace.on('file-menu', addCSVCreatorMenuItem)
            );
        }
    }
}