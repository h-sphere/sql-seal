export interface CodeBlockMatch {
  startIndex: number
  content: string
  /** Characters stripped from the start of each content line (e.g. "> " in callouts) */
  linePrefix?: string
}

/**
 * Extract sqlseal code blocks from markdown text, including those inside callouts.
 *
 * This function handles both regular code blocks and those inside Obsidian callouts
 * (which are prefixed with "> " on each line). For callout blocks, the prefix is
 * stripped from content lines so the SQL parser can process them cleanly.
 *
 * @param text - The raw markdown text to search
 * @returns Array of code block matches with their content and position information
 */
export function extractCodeBlocks(text: string): CodeBlockMatch[] {
  // Parsing — match code blocks with optional callout prefix (e.g. "> ") on fence lines.
  // The prefix is captured so positions can be mapped back to the raw document.
  const codeBlockRegex = /^([ \t]*(?:> )*)```(sqlseal)\n([\s\S]*?)^[ \t]*(?:> )*```/gm
  let match
  const results: CodeBlockMatch[] = []

  while ((match = codeBlockRegex.exec(text)) !== null) {
    const fencePrefix = match[1] || ''
    const langTag = match[2]
    const rawContent = match[3]
    const blockStart = match.index
    const langTagEnd = blockStart + fencePrefix.length + 3 + langTag.length // prefix + ``` + langTag
    const contentStart = langTagEnd + 1 // +1 for the newline after the opening fence

    if (!fencePrefix) {
      results.push({ content: rawContent, startIndex: contentStart })
    } else {
      // Strip the callout prefix from each content line so the grammar can parse it cleanly.
      const strippedLines = rawContent.split('\n').map(line =>
        line.startsWith(fencePrefix) ? line.slice(fencePrefix.length) : line
      )
      results.push({
        content: strippedLines.join('\n'),
        startIndex: contentStart,
        linePrefix: fencePrefix
      })
    }
  }

  return results
}

/**
 * Map a position in stripped content back to the raw document position.
 *
 * For callout blocks, each line has a prefix (e.g. "> ") that was removed before
 * parsing. This function restores that offset: for a position on line N, it adds
 * (N+1) * prefixLen to account for all the stripped prefixes up to that point.
 *
 * Formula: rawPos = startIndex + strippedPos + (lineNum + 1) * prefixLen
 * where lineNum = count of \n characters in content before posInContent
 *
 * @param content - The stripped content (after prefix removal)
 * @param linePrefix - The prefix that was stripped (e.g. "> "), empty string if none
 * @param startIndex - Starting position of the content in the raw document
 * @param posInContent - Position within the stripped content
 * @returns Position in the raw document
 */
export function toDocPos(
  content: string,
  linePrefix: string,
  startIndex: number,
  posInContent: number
): number {
  if (!linePrefix) return startIndex + posInContent

  const prefixLen = linePrefix.length
  const lineCount = (content.slice(0, posInContent).match(/\n/g) || []).length
  return startIndex + posInContent + (lineCount + 1) * prefixLen
}
