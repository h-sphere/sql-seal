import { TFile } from "obsidian";
import { AFileSyncTable } from "./abstractFileSyncTable";

export class TasksFileSyncTable extends AFileSyncTable {
    get tableName() {
        return 'tasks'
    }
    async onFileModify(file: TFile): Promise<void> {
        await this.onFileDelete(file.path)
        await this.onFileCreate(file)
    }
    async onFileDelete(path: string): Promise<void> {
        await this.db.deleteData('tasks', [{ path: path }], 'path')
    }

    async onFileCreate(file: TFile): Promise<void> {
        const tasks = await this.getFileTasks(file)
        this.db.insertData('tasks', tasks)
    }

    async getFileTasks(file: TFile) {
        const cache = this.app.metadataCache.getFileCache(file);
            
        if (!cache || !cache.listItems) return [];

        const content = await this.app.vault.read(file);
        const lines = content.split('\n');
		const headings = cache.headings;

        return cache.listItems.map(listItem => {
            // Check if it's a task
            if (!listItem.task) return;

            const status = listItem.task !== ' '
            
            // Get the full line content
            const lineContent = lines[listItem.position.start.line];
            
            // Extract task content (removing the checkbox syntax)
            const taskContent = lineContent.substring(
                lineContent.indexOf(']') + 1
            ).trim();
            
            const checkboxData = {
                type: "checkbox",
                values: {
                    checked: status,
                    path: file.path,
                    task: taskContent,
                    position: {
                        line: listItem.position.start.line,
                        lineContent: lineContent
                    }
                }
            };

			const heading = headings ?
				headings.filter(h => h.position.start.line < listItem.position.start.line)
				.last() : undefined;
            
            return {
                filePath: file.path,
                path: file.path,
                task: taskContent,
                completed: status ? 1 : 0,
                position: listItem.position.start.line,
                checkbox: `SQLSEALCUSTOM(${JSON.stringify(checkboxData)})`,
				heading: heading ? heading.heading : undefined,
				heading_level: heading ? heading.level : undefined
            }
        }).filter(t => !!t)
    }

    async onInit(): Promise<void> {
        await this.db.createTableNoTypes('tasks', ['checkbox', 'task', 'completed', 'filePath', 'path', 'position', 'heading', 'heading_level'])

         // Indexes
         const toIndex = ['filePath']
         await Promise.all(toIndex.map(column =>
             this.db.createIndex(`tasks_${column}_idx`, this.tableName, [column])
         ))
    }
}
