import * as acorn from 'acorn';
import type { Node } from 'acorn';

interface Decorator {
  type: string;
  start: number;
  end: number;
}

export function generateDecorators(code: string): Decorator[] {
  const decorators: Decorator[] = [];
  
  // Keywords in JavaScript
  const keywords = new Set([
    'const', 'let', 'var', 'function', 'class', 'extends',
    'if', 'else', 'for', 'while', 'do', 'switch', 'case',
    'break', 'continue', 'return', 'throw', 'try', 'catch',
    'finally', 'new', 'delete', 'typeof', 'instanceof', 'void',
    'null', 'undefined', 'true', 'false'
  ]);

  // Wrap the code in parentheses to make it a valid expression
  const wrappedCode = `(${code})`;

  try {
    // Parse the code
    const ast = acorn.parse(wrappedCode, {
      ecmaVersion: 2020,
      sourceType: 'module',
      locations: true,
      ranges: true,
      onToken: (token) => {
        // Adjust token positions to account for the opening parenthesis
        const start = token.start - 1;
        const end = token.end - 1;

        // Handle keywords
        if (keywords.has(token.value?.toString())) {
          decorators.push({
            type: 'keyword',
            start,
            end
          });
        }
        
        // Handle operators and punctuation
        if (token.type.label === ':' || token.type.label === ',' || 
            token.type.label === '{' || token.type.label === '}' ||
            token.type.label === '[' || token.type.label === ']') {
          decorators.push({
            type: 'punctuation',
            start,
            end
          });
        }
      },
      onComment: (isBlock, text, start, end) => {
        // Adjust comment positions
        decorators.push({
          type: 'comment',
          start: start - 1,
          end: end - 1
        });
      }
    });

    function visitNode(node: Node) {
      // Adjust positions to account for the opening parenthesis
      const start = node.start - 1;
      const end = node.end - 1;

      switch (node.type) {
        case 'Literal':
          decorators.push({
            type: typeof (node as any).value === 'string' ? 'string' : 'literal',
            start,
            end
          });
          break;

        case 'Identifier':
          decorators.push({
            type: 'identifier',
            start,
            end
          });
          break;

        case 'ArrowFunction':
          decorators.push({
            type: 'function',
            start,
            end
          });
          break;

        case 'Property':
          if ((node as any).key.type === 'Identifier') {
            decorators.push({
              type: 'property',
              start: (node as any).key.start - 1,
              end: (node as any).key.end - 1
            });
          }
          break;

        case 'ObjectExpression':
          // Visit children but don't create a decorator for the object itself
          break;

        case 'ArrayExpression':
          // Visit children but don't create a decorator for the array itself
          break;
      }

      // Recursively visit all child nodes
      for (const key in node) {
        const child = (node as any)[key];
        if (child && typeof child === 'object') {
          if (Array.isArray(child)) {
            child.forEach(item => {
              if (item && typeof item === 'object' && 'type' in item) {
                visitNode(item);
              }
            });
          } else if ('type' in child) {
            visitNode(child);
          }
        }
      }
    }

    // Visit the AST
    visitNode(ast);

  } catch (error) {
    console.error('Parsing error:', error);
    return [];
  }

  // Sort decorators by start position
  return decorators.sort((a, b) => a.start - b.start);
}
