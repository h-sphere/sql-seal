export const globalTablesInit = (register: () => void) => {
	return () => {
		register();
	};
};
