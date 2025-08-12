import { BindingSpec, Database } from "@sqlite.org/sqlite-wasm";

interface Context {
	filename: string;
}

type ColumnTransformer = (
	db: Database,
	context: Context,
	query: string,
) => Promise<string>;

const TransformerId = async (_db: Database, context: Context, query: string) =>
	query;

const transformBindings = (b: Record<string, unknown>) => {
	return Object.entries(b).reduce(
		(acc, [key, value]) => ({
			...acc,
			[key.startsWith("?") ? key : `?${key}`]: value,
		}),
		{},
	) as BindingSpec;
};

export class QueryDatabase {
	constructor(
		private db: Database,
		private columnTransformer: ColumnTransformer = TransformerId,
	) {}

	async contextSelect(
		query: string,
		context: Context,
		params: Record<string, unknown>,
	) {
		const q = await this.columnTransformer(this.db, context, query);

		const stmt = this.db.prepare(q).bind(transformBindings(params));

		const results = [];
		let columns = stmt.getColumnNames();
		while (stmt.step()) {
			results.push(stmt.get({}));
		}
		stmt.finalize();

        return {
            data: results,
            columns
        }
	}
}
