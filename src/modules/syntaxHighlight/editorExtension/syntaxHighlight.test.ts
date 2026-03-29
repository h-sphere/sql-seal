/**
 * Tests for the callout syntax-highlighting fix (main-ow0).
 *
 * SQLSealViewPlugin is not imported here because it pulls in Obsidian/CodeMirror
 * globals that don't exist in Node. Instead, we test the pure logic functions
 * that were extracted for testability:
 *
 * 1. extractCodeBlocks() - The regex that finds sqlseal blocks (including inside callouts)
 *    and the prefix-stripping that cleans "> " from each content line
 * 2. toDocPos() - The formula that maps stripped positions back to raw doc positions
 */

import { extractCodeBlocks, toDocPos } from './codeBlockExtraction';

// --------------------------------------------------------------------------
// Tests
// --------------------------------------------------------------------------

describe('callout code block detection (getCodeBlocks logic)', () => {
    describe('regular (non-callout) blocks', () => {
        it('finds a simple sqlseal block', () => {
            const text = '```sqlseal\nSELECT * FROM files\n```\n'
            const blocks = extractCodeBlocks(text)
            expect(blocks).toHaveLength(1)
            expect(blocks[0].content).toBe('SELECT * FROM files\n')
            expect(blocks[0].linePrefix).toBeUndefined()
        })

        it('sets startIndex to char 11 ("```sqlseal\\n" = 11 chars)', () => {
            const text = '```sqlseal\nSELECT 1\n```\n'
            expect(extractCodeBlocks(text)[0].startIndex).toBe(11)
        })

        it('returns empty array when there are no sqlseal blocks', () => {
            expect(extractCodeBlocks('no blocks here')).toHaveLength(0)
            expect(extractCodeBlocks('```sql\nSELECT 1\n```')).toHaveLength(0)
        })

        it('finds multiple blocks', () => {
            const text = '```sqlseal\nSELECT 1\n```\n\ntext\n\n```sqlseal\nSELECT 2\n```\n'
            expect(extractCodeBlocks(text)).toHaveLength(2)
        })
    })

    describe('callout blocks (bug: were invisible to the highlighter)', () => {
        it('finds a sqlseal block inside a callout', () => {
            // Before fix: regex /```(sqlseal)\n([\s\S]*?)```/g did not match
            // when opening fence was preceded by "> "
            const text = '> ```sqlseal\n> SELECT * FROM files\n> ```\n'
            const blocks = extractCodeBlocks(text)
            expect(blocks).toHaveLength(1)
        })

        it('strips "> " prefix from each content line', () => {
            const text = '> ```sqlseal\n> SELECT * FROM files\n> ```\n'
            const blocks = extractCodeBlocks(text)
            // Grammar must receive clean SQL, not "> SELECT * FROM files"
            expect(blocks[0].content).toContain('SELECT * FROM files')
            expect(blocks[0].content).not.toContain('> ')
        })

        it('sets linePrefix to "> "', () => {
            const text = '> ```sqlseal\n> SELECT 1\n> ```\n'
            expect(extractCodeBlocks(text)[0].linePrefix).toBe('> ')
        })

        it('sets startIndex to first raw char of content (after "> ```sqlseal\\n")', () => {
            // "> "(2) + "```"(3) + "sqlseal"(7) + "\n"(1) = 13
            const text = '> ```sqlseal\n> SELECT 1\n> ```\n'
            expect(extractCodeBlocks(text)[0].startIndex).toBe(13)
        })

        it('correctly strips multi-line callout content', () => {
            const text = '> ```sqlseal\n> LINE 1\n> LINE 2\n> ```\n'
            const blocks = extractCodeBlocks(text)
            expect(blocks[0].content).toBe('LINE 1\nLINE 2\n')
        })
    })
})

describe('toDocPos() — maps stripped positions to raw document positions', () => {
    /**
     * For a callout block, each line in the raw document has a "> " prefix (2 chars)
     * that was stripped before grammar parsing. When applying decorations we must add
     * those chars back.
     *
     * Formula: rawPos = startIndex + strippedPos + (lineNum + 1) * prefixLen
     * where lineNum = count of \n characters in strippedContent before strippedPos
     */

    it('maps position 0 on line 0 (S of SELECT)', () => {
        // "> ```sqlseal\n" = 13 chars → contentStart = 13
        // raw line: "> SELECT * FROM files\n" → S is at raw[15] = 13 + 2
        // formula: 13 + 0 + (0+1)*2 = 15
        expect(toDocPos('SELECT * FROM files\n', '> ', 13, 0)).toBe(15)
    })

    it('maps end of SELECT keyword (pos 6) on line 0', () => {
        // formula: 13 + 6 + (0+1)*2 = 21
        expect(toDocPos('SELECT * FROM files\n', '> ', 13, 6)).toBe(21)
    })

    it('maps start of second line (after first \\n)', () => {
        // strippedContent = "LINE1\nLINE2\n", pos=6 = L of LINE2, lineNum=1
        // formula: 13 + 6 + (1+1)*2 = 23
        expect(toDocPos('LINE1\nLINE2\n', '> ', 13, 6)).toBe(23)
    })

    it('maps the \\n at end of line 0', () => {
        // "SELECT\n", pos=6 = \n, lineNum=0
        // formula: 13 + 6 + (0+1)*2 = 21
        // raw line "> SELECT\n" has \n at index 13+2+6 = 21 ✓
        expect(toDocPos('SELECT\n', '> ', 13, 6)).toBe(21)
    })

    it('uses prefix length correctly for longer prefixes', () => {
        // nested callout prefix "> > " (4 chars)
        // pos=0, lineNum=0: 13 + 0 + (0+1)*4 = 17
        expect(toDocPos('SELECT 1\n', '> > ', 13, 0)).toBe(17)
    })
})
