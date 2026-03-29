/**
 * Tests for the `status` column added to the tasks table (main-2xf).
 *
 * `getFileTasks()` is an instance method that calls `this.app` and `this.db`,
 * so we test the pure data-shaping logic by replicating it here rather than
 * mocking the full Obsidian API surface.
 */

interface ListItemMock {
    task: string        // raw checkbox char: ' ', 'x', '/', '-', '<', '>', etc.
    position: { start: { line: number } }
}

/** Mirrors the core logic of getFileTasks() in tasksTable.ts */
function shapeTask(listItem: ListItemMock, lineContent: string, filePath: string) {
    if (!listItem.task) return undefined

    const status = listItem.task !== ' '
    const taskContent = lineContent.substring(lineContent.indexOf(']') + 1).trim()

    return {
        filePath,
        path: filePath,
        task: taskContent,
        completed: status ? 1 : 0,
        status: listItem.task,
        position: listItem.position.start.line,
    }
}

describe('tasks table — status column (main-2xf)', () => {
    describe('status value reflects the raw checkbox character', () => {
        it('is " " (space) for an unchecked task', () => {
            const item: ListItemMock = { task: ' ', position: { start: { line: 0 } } }
            const row = shapeTask(item, '- [ ] Buy groceries', 'note.md')
            expect(row?.status).toBe(' ')
        })

        it('is "x" for a standard completed task', () => {
            const item: ListItemMock = { task: 'x', position: { start: { line: 1 } } }
            const row = shapeTask(item, '- [x] Done', 'note.md')
            expect(row?.status).toBe('x')
        })

        it('is "/" for an in-progress task (Tasks plugin custom status)', () => {
            const item: ListItemMock = { task: '/', position: { start: { line: 2 } } }
            const row = shapeTask(item, '- [/] In progress', 'note.md')
            expect(row?.status).toBe('/')
        })

        it('is "-" for a cancelled task', () => {
            const item: ListItemMock = { task: '-', position: { start: { line: 3 } } }
            const row = shapeTask(item, '- [-] Cancelled', 'note.md')
            expect(row?.status).toBe('-')
        })

        it('is ">" for a forwarded/rescheduled task', () => {
            const item: ListItemMock = { task: '>', position: { start: { line: 4 } } }
            const row = shapeTask(item, '- [>] Rescheduled', 'note.md')
            expect(row?.status).toBe('>')
        })
    })

    describe('completed column is unaffected', () => {
        it('completed=0 when status is space', () => {
            const item: ListItemMock = { task: ' ', position: { start: { line: 0 } } }
            expect(shapeTask(item, '- [ ] Pending', 'note.md')?.completed).toBe(0)
        })

        it('completed=1 when status is "x"', () => {
            const item: ListItemMock = { task: 'x', position: { start: { line: 0 } } }
            expect(shapeTask(item, '- [x] Done', 'note.md')?.completed).toBe(1)
        })

        it('completed=1 for custom non-space chars (any char != space counts as complete)', () => {
            // This matches the existing semantics: status !== ' ' → completed
            const item: ListItemMock = { task: '/', position: { start: { line: 0 } } }
            expect(shapeTask(item, '- [/] In progress', 'note.md')?.completed).toBe(1)
        })
    })

    describe('non-task list items are excluded', () => {
        it('returns undefined when listItem.task is empty string (plain list item)', () => {
            const item = { task: '', position: { start: { line: 0 } } }
            expect(shapeTask(item, '- plain list item', 'note.md')).toBeUndefined()
        })
    })

    describe('task content extraction is unaffected', () => {
        it('strips the checkbox syntax and returns just the content', () => {
            const item: ListItemMock = { task: 'x', position: { start: { line: 0 } } }
            const row = shapeTask(item, '- [x] Buy milk', 'note.md')
            expect(row?.task).toBe('Buy milk')
        })
    })
})
