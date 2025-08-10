import { WidgetType } from "@codemirror/view";
import { App } from "obsidian";

export class FilePathWidget extends WidgetType {
    constructor(private filePath: string, private app: App) {
      super();
    }
  
    toDOM() {
      const link = document.createElement("a");
      link.textContent = this.filePath;
      link.href = this.filePath
      link.className = "internal-link";
      
      return link;
    }
}