import { parseCSVLine } from "../utils/parseLine";
import { ParserTableDefinition } from "../datamodel/syncStrategy/types";

interface ParsedLanguage {
    tables: ParserTableDefinition[];
    queryPart: string;
    intermediateContent: string;
}

const COMMENT_START = '--'

// TODO: this should be retwitten to use proper grammar but this seems to work, at least for now :)
export function parseLanguage(input: string, sourceFile: string = ''): ParsedLanguage {
    const lines = input.split('\n');
    const result: ParsedLanguage = {
        tables: [],
        queryPart: '',
        intermediateContent: ''
    };

    // State tracking
    let currentPosition = 0;
    // Parse TABLE declarations
    while (currentPosition < lines.length) {
        const line = lines[currentPosition].trim();

        // Skip empty lines at the beginning
        if (line === '' || line.startsWith(COMMENT_START)) {
            currentPosition++;
            continue;
        }

        // If we hit SELECT or any other non-TABLE part, break
        if (!line.toUpperCase().startsWith('TABLE')) {
            break;
        }

        // Parse TABLE declaration
        // Format: TABLE tableName = file(filename.csv)
        const tableMatch = line.match(/TABLE\s+(\w+)\s*=\s*(\w+)\(([^)]+)\)/i);
        if (tableMatch) {
            const args = parseCSVLine(tableMatch[3] ?? '')
            const config = {
                tableAlias: tableMatch[1],
                type: tableMatch[2].toLowerCase(),
                arguments: args,
                sourceFile: sourceFile
            } satisfies ParserTableDefinition
            result.tables.push(config);
        }
        currentPosition++;
    }

    // Find the position of SELECT statement
    let selectPosition = -1;
    for (let i = currentPosition; i < lines.length; i++) {
        const line = lines[i].trim().toUpperCase()
        if (line.startsWith('SELECT') || line.startsWith('WITH')) {
            selectPosition = i;
            break;
        }
    }

    // Extract intermediate content (if any)
    if (selectPosition > currentPosition) {
        result.intermediateContent = lines
            .slice(currentPosition, selectPosition)
            .map(line => line.trim()).filter(line => !line.startsWith(COMMENT_START))
            .join('\n')
            .trim();
    }

    // Extract SQL query
    if (selectPosition !== -1) {
        result.queryPart = lines
            .slice(selectPosition)
            .map(line => line.trim()).filter(line => !line.startsWith(COMMENT_START))
            .join('\n')
            .trim();
    } else {
        // If no SELECT found, assume the entire remaining content is a SQL query
        result.queryPart = lines
            .slice(currentPosition)
            .map(line => line.trim()).filter(line => !line.startsWith(COMMENT_START))
            .join('\n')
            .trim();
    }

    return result;
}