import { App, MarkdownPostProcessorContext } from "obsidian"

export const resolveFrontmatter = (ctx: Pick<MarkdownPostProcessorContext, 'frontmatter' | 'sourcePath'>, app: App) => {
    if (ctx.frontmatter && Object.keys(ctx.frontmatter).length > 0) {
        return ctx.frontmatter as Record<string, any>
    }
    const file = app.vault.getFileByPath(ctx.sourcePath)
    if (!file) {
        return null
    }
    return app.metadataCache.getFileCache(file)?.frontmatter
}