import { VaultLoader } from "../VaultLoader";
import { TFile } from "obsidian";
import nunjucks from "nunjucks";

function createMockFile(path: string, extension: string) {
	return Object.assign(new TFile(), { path, extension });
}

function createMockApp(files: Array<{ path: string; extension: string }> = []) {
	const contents: Record<string, string> = {};
	const eventHandlers: Record<string, Array<(...args: any[]) => void>> = {};

	return {
		app: {
			vault: {
				getFiles: () => files,
				cachedRead: async (file: { path: string }) =>
					contents[file.path] ?? "",
				on: (event: string, handler: (...args: any[]) => void) => {
					eventHandlers[event] ??= [];
					eventHandlers[event].push(handler);
					return { event, handler };
				},
			},
		} as any,
		plugin: {
			registerEvent: () => {},
		} as any,
		contents,
		eventHandlers,
	};
}

describe("VaultLoader", () => {
	describe("getSource", () => {
		it("returns cached template by exact path", async () => {
			const njkFile = createMockFile("_templates/row.njk", "njk");
			const { app, plugin, contents } = createMockApp([njkFile]);
			contents["_templates/row.njk"] = "<tr>{{ name }}</tr>";

			const loader = new VaultLoader(app, plugin);
			await loader.loadAll();

			const result = loader.getSource("_templates/row.njk");
			expect(result.src).toBe("<tr>{{ name }}</tr>");
			expect(result.path).toBe("_templates/row.njk");
			expect(result.noCache).toBe(true);
		});

		it("resolves name without extension by appending .njk", async () => {
			const njkFile = createMockFile("_templates/row.njk", "njk");
			const { app, plugin, contents } = createMockApp([njkFile]);
			contents["_templates/row.njk"] = "<tr>{{ name }}</tr>";

			const loader = new VaultLoader(app, plugin);
			await loader.loadAll();

			const result = loader.getSource("_templates/row");
			expect(result.src).toBe("<tr>{{ name }}</tr>");
		});

		it("throws when template is not found", async () => {
			const { app, plugin } = createMockApp([]);
			const loader = new VaultLoader(app, plugin);
			await loader.loadAll();

			expect(() => loader.getSource("missing.njk")).toThrow(
				"Template not found: missing.njk",
			);
		});
	});

	describe("loadAll", () => {
		it("loads only .njk files from vault", async () => {
			const njkFile = createMockFile("_templates/row.njk", "njk");
			const mdFile = createMockFile("notes/readme.md", "md");
			const { app, plugin, contents } = createMockApp([
				njkFile,
				mdFile,
			]);
			contents["_templates/row.njk"] = "template content";
			contents["notes/readme.md"] = "markdown content";

			const loader = new VaultLoader(app, plugin);
			await loader.loadAll();

			expect(() => loader.getSource("_templates/row.njk")).not.toThrow();
			expect(() => loader.getSource("notes/readme.md")).toThrow();
		});

		it("loads multiple templates", async () => {
			const files = [
				createMockFile("_templates/row.njk", "njk"),
				createMockFile("_templates/header.njk", "njk"),
			];
			const { app, plugin, contents } = createMockApp(files);
			contents["_templates/row.njk"] = "row";
			contents["_templates/header.njk"] = "header";

			const loader = new VaultLoader(app, plugin);
			await loader.loadAll();

			expect(loader.getSource("_templates/row.njk").src).toBe("row");
			expect(loader.getSource("_templates/header.njk").src).toBe(
				"header",
			);
		});
	});

	describe("nunjucks integration", () => {
		it("resolves {% include %} via VaultLoader", async () => {
			const files = [
				createMockFile("_templates/row.njk", "njk"),
			];
			const { app, plugin, contents } = createMockApp(files);
			contents["_templates/row.njk"] = "<td>{{ name }}</td>";

			const loader = new VaultLoader(app, plugin);
			await loader.loadAll();

			const env = new nunjucks.Environment(loader as any, {
				autoescape: false,
			});
			const template = nunjucks.compile(
				'<table>{% include "_templates/row.njk" %}</table>',
				env,
			);
			const result = template.render({ name: "Alice" });
			expect(result).toBe("<table><td>Alice</td></table>");
		});

		it("resolves {% from ... import %} macros via VaultLoader", async () => {
			const files = [
				createMockFile("_templates/macros.njk", "njk"),
			];
			const { app, plugin, contents } = createMockApp(files);
			contents["_templates/macros.njk"] = [
				"{% macro extLink(url, label) %}",
				'<a class="external-link" href="{{ url }}">{{ label }}</a>',
				"{% endmacro %}",
			].join("\n");

			const loader = new VaultLoader(app, plugin);
			await loader.loadAll();

			const env = new nunjucks.Environment(loader as any, {
				autoescape: false,
			});
			const template = nunjucks.compile(
				'{% from "_templates/macros.njk" import extLink %}' +
					"{{ extLink('https://example.com', 'Example') }}",
				env,
			);
			const result = template.render({});
			expect(result).toContain('class="external-link"');
			expect(result).toContain('href="https://example.com"');
			expect(result).toContain(">Example</a>");
		});

		it("resolves include without .njk extension", async () => {
			const files = [
				createMockFile("_templates/row.njk", "njk"),
			];
			const { app, plugin, contents } = createMockApp(files);
			contents["_templates/row.njk"] = "hello";

			const loader = new VaultLoader(app, plugin);
			await loader.loadAll();

			const env = new nunjucks.Environment(loader as any, {
				autoescape: false,
			});
			const template = nunjucks.compile(
				'{% include "_templates/row" %}',
				env,
			);
			expect(template.render({})).toBe("hello");
		});

		it("works with nested includes", async () => {
			const files = [
				createMockFile("_templates/outer.njk", "njk"),
				createMockFile("_templates/inner.njk", "njk"),
			];
			const { app, plugin, contents } = createMockApp(files);
			contents["_templates/outer.njk"] =
				'<div>{% include "_templates/inner.njk" %}</div>';
			contents["_templates/inner.njk"] = "<span>nested</span>";

			const loader = new VaultLoader(app, plugin);
			await loader.loadAll();

			const env = new nunjucks.Environment(loader as any, {
				autoescape: false,
			});
			const template = nunjucks.compile(
				'{% include "_templates/outer.njk" %}',
				env,
			);
			expect(template.render({})).toBe(
				"<div><span>nested</span></div>",
			);
		});
	});

	describe("file watchers", () => {
		it("registers all four vault events", () => {
			const { app, plugin, eventHandlers } = createMockApp([]);
			const loader = new VaultLoader(app, plugin);
			loader.registerWatchers();

			expect(eventHandlers["modify"]).toHaveLength(1);
			expect(eventHandlers["delete"]).toHaveLength(1);
			expect(eventHandlers["rename"]).toHaveLength(1);
			expect(eventHandlers["create"]).toHaveLength(1);
		});

		it("updates cache on modify", async () => {
			const njkFile = createMockFile("t.njk", "njk");
			const { app, plugin, contents, eventHandlers } = createMockApp([
				njkFile,
			]);
			contents["t.njk"] = "v1";

			const loader = new VaultLoader(app, plugin);
			await loader.loadAll();
			loader.registerWatchers();

			expect(loader.getSource("t.njk").src).toBe("v1");

			contents["t.njk"] = "v2";
			await eventHandlers["modify"][0](njkFile);

			expect(loader.getSource("t.njk").src).toBe("v2");
		});

		it("removes from cache on delete", async () => {
			const njkFile = createMockFile("t.njk", "njk");
			const { app, plugin, contents, eventHandlers } = createMockApp([
				njkFile,
			]);
			contents["t.njk"] = "content";

			const loader = new VaultLoader(app, plugin);
			await loader.loadAll();
			loader.registerWatchers();

			expect(loader.getSource("t.njk").src).toBe("content");

			await eventHandlers["delete"][0](njkFile);

			expect(() => loader.getSource("t.njk")).toThrow();
		});

		it("updates cache on rename", async () => {
			const njkFile = createMockFile("new.njk", "njk");
			const { app, plugin, contents, eventHandlers } = createMockApp([
				createMockFile("old.njk", "njk"),
			]);
			contents["old.njk"] = "content";

			const loader = new VaultLoader(app, plugin);
			await loader.loadAll();
			loader.registerWatchers();

			contents["new.njk"] = "content";
			await eventHandlers["rename"][0](njkFile, "old.njk");

			expect(() => loader.getSource("old.njk")).toThrow();
			expect(loader.getSource("new.njk").src).toBe("content");
		});

		it("adds to cache on create", async () => {
			const { app, plugin, contents, eventHandlers } = createMockApp([]);
			const loader = new VaultLoader(app, plugin);
			await loader.loadAll();
			loader.registerWatchers();

			const newFile = createMockFile("new.njk", "njk");
			contents["new.njk"] = "new content";
			await eventHandlers["create"][0](newFile);

			expect(loader.getSource("new.njk").src).toBe("new content");
		});

		it("ignores non-njk files in watchers", async () => {
			const { app, plugin, contents, eventHandlers } = createMockApp([]);
			const loader = new VaultLoader(app, plugin);
			await loader.loadAll();
			loader.registerWatchers();

			const mdFile = createMockFile("note.md", "md");
			contents["note.md"] = "markdown";
			await eventHandlers["create"][0](mdFile);

			expect(() => loader.getSource("note.md")).toThrow();
		});
	});
});
