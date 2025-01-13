export interface Table {
    tableName: string;
    fileName: string;
}

export interface TableWithParentPath extends Table {
    parentPath: string;
}

interface ParsedLanguage {
    tables: Table[];
    queryPart: string;
    intermediateContent: string;
}

export function parseLanguage(input: string): ParsedLanguage {
    const lines = input.split('\n');
    const result: ParsedLanguage = {
        tables: [],
        queryPart: '',
        intermediateContent: ''
    };

    // State tracking
    let currentPosition = 0;
    let intermediateContentStarted = false;
    
    // Parse TABLE declarations
    while (currentPosition < lines.length) {
        const line = lines[currentPosition].trim();
        
        // Skip empty lines at the beginning
        if (line === '') {
            currentPosition++;
            continue;
        }
        
        // If we hit SELECT or any other non-TABLE part, break
        if (!line.startsWith('TABLE')) {
            break;
        }
        
        // Parse TABLE declaration
        // Format: TABLE tableName = file(filename.csv)
        const tableMatch = line.match(/TABLE\s+(\w+)\s*=\s*file\(([^)]+)\)/);
        if (tableMatch) {
            result.tables.push({
                tableName: tableMatch[1],
                fileName: tableMatch[2]
            });
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
            .join('\n')
            .trim();
    }
    
    // Extract SQL query
    if (selectPosition !== -1) {
        result.queryPart = lines
            .slice(selectPosition)
            .join('\n')
            .trim();
    } else {
        // If no SELECT found, assume the entire remaining content is a SQL query
        result.queryPart = lines
            .slice(currentPosition)
            .join('\n')
            .trim();
    }
    
    return result;
}