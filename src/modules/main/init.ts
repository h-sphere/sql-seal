type InitFn = () => void;

export const mainInit = (
	settingsInit: InitFn,
	editorInit: InitFn,
	highlighInit: InitFn,
	contextMenu: InitFn,
	syncInit: InitFn,
	apiInit: InitFn,
	globalTablesInit: InitFn,
	explorerInit: InitFn,
) => {
	return () => {
		settingsInit();
		editorInit();
		highlighInit();
		contextMenu();
		syncInit();
		apiInit();
		globalTablesInit();
		explorerInit();
	};
};
