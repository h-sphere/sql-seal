import * as esprima from 'esprima';
import * as estraverse from 'estraverse';

interface Decorator {
    type: 'keyword' | 'identifier' | 'string' | 'string-escape' | 'string-interpolation' |
    'number' | 'comment' | 'function' | 'operator' | 'punctuation' | 'regex' | 'error';
    start: number;
    end: number;
}

/**
 * Highlights JavaScript syntax using Esprima and estraverse
 * @param source - The JavaScript source code to highlight
 * @returns Array of decorator objects for syntax highlighting
 */
function highlightJavaScript(source: string): Decorator[] {
    const decorators: Decorator[] = [];

    // Keywords in JavaScript
    const keywords = new Set([
        'var', 'let', 'const', 'if', 'else', 'switch', 'case', 'default', 'for', 'while', 'do',
        'break', 'continue', 'return', 'function', 'class', 'extends', 'new', 'this', 'super',
        'import', 'export', 'from', 'as', 'async', 'await', 'try', 'catch', 'finally', 'throw',
        'typeof', 'instanceof', 'in', 'of', 'void', 'delete', 'yield', 'static', 'get', 'set',
        'true', 'false', 'null', 'undefined', 'NaN', 'Infinity'
    ]);

    // Helper function to add a decorator
    function addDecorator(type: Decorator['type'], start: number, end: number): void {
        if (start >= 0 && end > start && end <= source.length) {
            decorators.push({ type, start, end });
        }
    }

    try {
        // Parse the source code with location information and comment handling
        const ast = esprima.parseScript(source, {
            loc: true,
            range: true,
            comment: true,
            tokens: true,
            jsx: true
        });

        // Process comments (they're separate from the AST in Esprima)
        if (ast.comments) {
            for (const comment of ast.comments) {
                addDecorator('comment', comment.range![0], comment.range![1]);
            }
        }

        // Process tokens for basic syntax elements
        if (ast.tokens) {
            for (const token of ast.tokens) {
                switch (token.type) {
                    case 'Keyword':
                        addDecorator('keyword', token.range[0], token.range[1]);
                        break;
                    case 'Identifier':
                        // We'll handle function identifiers separately
                        addDecorator('identifier', token.range[0], token.range[1]);
                        break;
                    case 'Punctuator':
                        if (['+', '-', '*', '/', '%', '=', '>', '<', '!', '&', '|', '^', '~', '?', ':'].includes(token.value) ||
                            token.value.length > 1 && /^[+\-*/%=><!\^&|?:]+$/.test(token.value)) {
                            addDecorator('operator', token.range[0], token.range[1]);
                        } else {
                            addDecorator('punctuation', token.range[0], token.range[1]);
                        }
                        break;
                    case 'String':
                        // String literals include the quotes
                        addDecorator('string', token.range[0], token.range[1]);

                        // Highlight string content differently if needed
                        const stringContent = source.substring(token.range[0] + 1, token.range[1] - 1);

                        // Look for escape sequences within the string
                        const escapeRegex = /\\./g;
                        let escapeMatch;
                        while ((escapeMatch = escapeRegex.exec(stringContent)) !== null) {
                            const escapeStart = token.range[0] + 1 + escapeMatch.index;
                            const escapeEnd = escapeStart + escapeMatch[0].length;
                            // Add specific decorator for escape sequences
                            addDecorator('string-escape', escapeStart, escapeEnd);
                        }

                        // Look for string interpolation patterns like ${...} if needed
                        // This is mostly relevant for template literals, which are handled separately
                        break;
                    case 'Numeric':
                        addDecorator('number', token.range[0], token.range[1]);
                        break;
                    case 'RegularExpression':
                        addDecorator('regex', token.range[0], token.range[1]);
                        break;
                    case 'Boolean':
                    case 'Null':
                        addDecorator('keyword', token.range[0], token.range[1]);
                        break;
                    case 'Template':
                        // Handle template literals more carefully - they may contain expressions
                        // The token itself might be just a part of the template (a quasi)
                        addDecorator('string', token.range[0], token.range[1]);

                        // Check if it's a template with expressions
                        const templateText = source.substring(token.range[0], token.range[1]);
                        if (templateText.includes('${')) {
                            // This is handled in the AST traversal for TemplateLiteral nodes
                            // But we can add specific handling here if needed
                        }
                        break;
                }
            }
        }

        // Use estraverse to traverse the AST and identify more complex patterns
        estraverse.traverse(ast, {
            enter: function (node: any, parent: any) {
                switch (node.type) {
                    case 'FunctionDeclaration':
                        // Function name
                        if (node.id) {
                            addDecorator('function', node.id.range[0], node.id.range[1]);
                        }
                        break;

                    case 'MethodDefinition':
                        // Method name in classes
                        if (node.key) {
                            addDecorator('function', node.key.range[0], node.key.range[1]);
                        }
                        break;

                    case 'Property':
                        // Methods in object literals
                        if (node.method && node.key) {
                            addDecorator('function', node.key.range[0], node.key.range[1]);
                        }
                        break;

                    case 'VariableDeclarator':
                        // Find arrow functions and function expressions assigned to variables
                        if (node.init &&
                            (node.init.type === 'ArrowFunctionExpression' ||
                                node.init.type === 'FunctionExpression')) {
                            addDecorator('function', node.id.range[0], node.id.range[1]);
                        }
                        break;

                    case 'CallExpression':
                        // Highlight function calls
                        if (node.callee.type === 'Identifier') {
                            // Don't change the styling of built-in functions/methods or keywords
                            const name = node.callee.name;
                            if (!keywords.has(name)) {
                                addDecorator('function', node.callee.range[0], node.callee.range[1]);
                            }
                        }
                        else if (node.callee.type === 'MemberExpression' &&
                            node.callee.property.type === 'Identifier') {
                            // Method calls (obj.method())
                            addDecorator('function', node.callee.property.range[0], node.callee.property.range[1]);
                        }
                        break;

                    case 'ClassDeclaration':
                        // Class name
                        if (node.id) {
                            addDecorator('identifier', node.id.range[0], node.id.range[1]);
                        }
                        break;

                    case 'ImportDeclaration':
                        // Import specifiers
                        for (const specifier of node.specifiers) {
                            if (specifier.local) {
                                addDecorator('identifier', specifier.local.range[0], specifier.local.range[1]);
                            }
                            if (specifier.imported) {
                                addDecorator('identifier', specifier.imported.range[0], specifier.imported.range[1]);
                            }
                        }
                        break;

                    case 'ExportNamedDeclaration':
                    case 'ExportDefaultDeclaration':
                        // Handle export names
                        if (node.declaration && node.declaration.id) {
                            // For function/class declarations
                            addDecorator('identifier', node.declaration.id.range[0], node.declaration.id.range[1]);
                        }
                        if (node.specifiers) {
                            // For export { x, y }
                            for (const specifier of node.specifiers) {
                                if (specifier.local) {
                                    addDecorator('identifier', specifier.local.range[0], specifier.local.range[1]);
                                }
                                if (specifier.exported) {
                                    addDecorator('identifier', specifier.exported.range[0], specifier.exported.range[1]);
                                }
                            }
                        }
                        break;

                    case 'TemplateLiteral':
                        // Handle template literals and their expressions
                        for (const quasi of node.quasis) {
                            // Mark the entire quasi segment as a string
                            addDecorator('string', quasi.range[0], quasi.range[1]);

                            // Look for escape sequences within the template literal
                            const quasiText = source.substring(quasi.range[0], quasi.range[1]);
                            const escapeRegex = /\\./g;
                            let escapeMatch;

                            while ((escapeMatch = escapeRegex.exec(quasiText)) !== null) {
                                const escapeStart = quasi.range[0] + escapeMatch.index;
                                const escapeEnd = escapeStart + escapeMatch[0].length;
                                // You can add a specific decorator for escape sequences if desired
                                // addDecorator('string-escape', escapeStart, escapeEnd);
                            }
                        }

                        // Handle template expressions ${...}
                        for (const expr of node.expressions) {
                            // Find the ${
                            const exprStart = expr.range[0] - 2; // For the ${ part
                            if (exprStart >= 0 && source.substring(exprStart, exprStart + 2) === '${') {
                                addDecorator('string-interpolation', exprStart, exprStart + 2);

                                // The expression itself will be handled by the normal traversal

                                // Find the closing }
                                const closingBrace = expr.range[1]; // The end range should be right after the expression
                                if (closingBrace < source.length && source[closingBrace] === '}') {
                                    addDecorator('string-interpolation', closingBrace, closingBrace + 1);
                                }
                            }
                        }
                        break;
                }
            }
        });

        // Sort decorators by start position
        return decorators.sort((a, b) => a.start - b.start);
    } catch (error) {
        // If parsing fails, return an error decorator
        console.error('Parsing error:', error);
        return [{ type: 'error', start: 0, end: source.length }];
    }
}

// Helper function to apply highlighting to HTML
function applyHighlighting(source: string, decorators: Decorator[]): string {
    let html = '';
    let lastIndex = 0;

    // First, resolve overlapping decorators by sorting and removing overlaps
    // We prioritize more specific types (like string-escape) over more general types (like string)
    const resolvedDecorators = resolveOverlappingDecorators(decorators);

    for (const decorator of resolvedDecorators) {
        // Add any text before this decorator
        html += escapeHtml(source.substring(lastIndex, decorator.start));

        // Add the decorated text
        const content = escapeHtml(source.substring(decorator.start, decorator.end));
        html += `<span class="js-${decorator.type}">${content}</span>`;

        lastIndex = decorator.end;
    }

    // Add any remaining text
    html += escapeHtml(source.substring(lastIndex));

    return html;
}

// Helper function to resolve overlapping decorators
function resolveOverlappingDecorators(decorators: Decorator[]): Decorator[] {
    // First, sort by start position and then by length (shortest first)
    const sorted = [...decorators].sort((a, b) => {
        if (a.start !== b.start) return a.start - b.start;
        return (a.end - a.start) - (b.end - b.start);
    });

    // Then resolve overlaps by splitting overlapping decorators
    const result: Decorator[] = [];
    let lastEnd = 0;

    for (const decorator of sorted) {
        // Skip if this decorator is completely contained in the previous one
        if (decorator.start >= lastEnd) {
            result.push(decorator);
            lastEnd = decorator.end;
        } else if (decorator.end > lastEnd) {
            // Partial overlap - only add the non-overlapping part
            if (decorator.start < lastEnd && decorator.end > lastEnd) {
                result.push({
                    type: decorator.type,
                    start: lastEnd,
                    end: decorator.end
                });
                lastEnd = decorator.end;
            }
        }
        // Completely contained - skip it
    }

    return result;
}

// Helper function to escape HTML special characters
function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

export { highlightJavaScript, applyHighlighting };

// Usage example:
// import { highlightJavaScript, applyHighlighting } from './esprima-js-highlighter';
// 
// const source = `
// // This is a comment
// function calculateTotal(items) {
//   return items
//     .map(item => item.price * item.quantity)
//     .reduce((total, value) => total + value, 0);
// }
// 
// class ShoppingCart {
//   constructor() {
//     this.items = [];
//   }
//   
//   addItem(item) {
//     this.items.push(item);
//   }
//   
//   get total() {
//     return calculateTotal(this.items);
//   }
// }
// 
// export default ShoppingCart;
// `;
// 
// const decorators = highlightJavaScript(source);
// const html = applyHighlighting(source, decorators);
// document.getElementById('code-display').innerHTML = html;