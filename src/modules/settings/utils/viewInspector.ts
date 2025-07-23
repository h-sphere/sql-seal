import { App } from "obsidian";

export const checkTypeViewAvaiability = (app: App, extension: string) => {
	const viewRegistry = (app as any).viewRegistry;
	const csvHandler = viewRegistry.typeByExtension[extension];

	if (csvHandler) {
        return csvHandler as string
	} else {
        return null
	}
};
