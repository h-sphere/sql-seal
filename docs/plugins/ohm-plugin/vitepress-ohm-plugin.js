// .vitepress/ohmMarkdownPlugin.js
import * as ohm from 'ohm-js'
import { SQLSealLangDefinition } from '../../../src/grammar/parser'
import { highlighterOperation } from '../../../src/grammar/highlighterOperation'

const parser = (sql) => {
    const defaultViews = [
        {
            name: 'GRID',
            singleLine: false,
            argument: 'anyObject?'
        },
        {
            name: 'HTML',
            singleLine: true,
            argument: 'restLine?'
        },
        {
            name: 'MARKDOWN',
            singleLine: true,
            argument: 'restLine?'
        },
        {
            name: 'LIST',
            singleLine: true,
            argument: 'restLine?'
        },
        {
            name: 'TEMPLATE',
            singleLine: false,
            argument: 'handlebarsTemplate'
        }
    ]

    const grammar = ohm.grammar(SQLSealLangDefinition(defaultViews, [], false))
    const match = grammar.match(sql)
    if (match.failed()) {
        return []
    }
    const highlight = highlighterOperation(grammar)(match)

    const results = highlight.highlight()
    return results
}

/**
 * Creates a markdown-it plugin that integrates Ohm.js parsing for code blocks
 * 
 * @returns {Function} A markdown-it plugin function
 */
export default function ohmMarkdownPlugin() {
    // Languages we want to parse with Ohm.js
    const supportedLanguages = ['js', 'javascript', 'ts', 'typescript', 'jsx', 'tsx', 'sqlseal']
    
    // Track processed tokens to prevent duplicate processing
    const processedTokens = new WeakSet()

    /**
     * This is the actual markdown-it plugin function that gets registered
     * with markdown-it.use()
     */
    return (md) => {
        // Store the original fence renderer
        const originalFence = md.renderer.rules.fence

        // Replace it with our custom implementation
        md.renderer.rules.fence = (tokens, idx, options, env, slf) => {
            const token = tokens[idx]
            
            // Check if we've already processed this token to prevent duplicate processing
            if (processedTokens.has(token)) {
                return originalFence(tokens, idx, options, env, slf)
            }
            
            // Mark this token as processed
            processedTokens.add(token)
            
            const code = token.content
            const lang = token.info.trim()

            // Skip unsupported languages
            if (!supportedLanguages.includes(lang)) {
                return originalFence(tokens, idx, options, env, slf)
            }

            try {
                // Parse the code with Ohm.js
                const rawDecorators = parser(code)

                // If no decorators found, use the original renderer
                if (!rawDecorators || rawDecorators.length === 0) {
                    return originalFence(tokens, idx, options, env, slf)
                }

                // Process decorators with block types prioritized to create nested structure
                const html = buildNestedDecorators(code, rawDecorators, lang)
                
                return html

            } catch (error) {
                console.error('❌ Error parsing code with Ohm.js:', error)
                return originalFence(tokens, idx, options, env, slf)
            }
        }
    }
}

/**
 * Builds nested HTML structure where block decorators properly
 * encapsulate smaller decorators
 * 
 * @param {string} code - The code to be decorated
 * @param {Array} decorators - The decorators to apply
 * @param {string} lang - The language of the code
 * @returns {string} HTML with properly nested decorators
 */
function buildNestedDecorators(code, decorators, lang) {
    if (!decorators || decorators.length === 0) {
        return `<pre class="language-${lang} vp-custom-code-block"><code class="language-${lang}">${escapeHtml(code)}</code></pre>`
    }
    
    // Sort decorators by priority (block types first) and then by size (largest first)
    const sortedDecorators = [...decorators].sort((a, b) => {
        // First prioritize block types
        const aIsBlock = a.type.startsWith('block')
        const bIsBlock = b.type.startsWith('block')
        
        if (aIsBlock && !bIsBlock) return -1
        if (!aIsBlock && bIsBlock) return 1
        
        // If both are blocks or both are not blocks, sort by size (larger first)
        const aSize = a.end - a.start
        const bSize = b.end - b.start
        
        return bSize - aSize
    })
    
    // Create a tree representation of the decorators
    const decoratorTree = buildDecoratorTree(sortedDecorators)
    
    // Render the HTML with the tree
    let html = `<pre class="language-${lang} vp-custom-code-block"><code class="language-${lang}">`
    html += renderDecoratorTree(decoratorTree, code)
    html += '</code></pre>'
    
    return html
}

/**
 * Builds a tree representation of decorators where parent nodes
 * contain child nodes
 * 
 * @param {Array} decorators - Sorted decorators array
 * @returns {Array} Tree structure of decorators
 */
function buildDecoratorTree(decorators) {
    // Initialize with the entire code range as the root
    const root = {
        start: 0,
        end: Infinity,
        children: []
    }
    
    // Function to add a decorator to the tree
    function addToTree(node, decorator) {
        // Check if this decorator fits within any of the children
        for (let i = 0; i < node.children.length; i++) {
            const child = node.children[i]
            
            // If the decorator fits entirely within this child
            if (decorator.start >= child.start && decorator.end <= child.end) {
                return addToTree(child, decorator)
            }
        }
        
        // This decorator doesn't fit within any child, so it's a direct child of this node
        const newNode = {
            ...decorator,
            children: []
        }
        
        // Any existing children that fit within this new node should become its children
        for (let i = node.children.length - 1; i >= 0; i--) {
            const child = node.children[i]
            
            if (child.start >= decorator.start && child.end <= decorator.end) {
                newNode.children.push(child)
                node.children.splice(i, 1)
            }
        }
        
        // Sort the children by start position
        newNode.children.sort((a, b) => a.start - b.start)
        
        // Add the new node to the current node's children
        node.children.push(newNode)
        
        // Sort the children by start position
        node.children.sort((a, b) => a.start - b.start)
    }
    
    // Add each decorator to the tree
    for (const decorator of decorators) {
        addToTree(root, decorator)
    }
    
    return root
}

/**
 * Renders the decorator tree as HTML
 * 
 * @param {Object} node - Current tree node
 * @param {string} code - The original code
 * @param {number} lastPos - Last rendered position in the code
 * @returns {string} HTML representation of the tree
 */
function renderDecoratorTree(node, code, lastPos = 0) {
    let html = ''
    let currentPos = lastPos
    
    // If this is not the root node, add its content
    if (node.type) {
        html += `<span class="vp-code-decorator vp-${node.type}" data-type="${node.type}">`
    }
    
    // Add the children with the text between them
    for (const child of node.children) {
        // Add text before this child
        if (child.start > currentPos) {
            html += escapeHtml(code.substring(currentPos, child.start))
        }
        
        // Add the child
        html += renderDecoratorTree(child, code, child.start)
        
        // Update the current position
        currentPos = child.end
    }
    
    // Add the remaining text in this node
    const endPos = node.type ? node.end : code.length
    if (currentPos < endPos) {
        html += escapeHtml(code.substring(currentPos, endPos))
    }
    
    // Close the tag if this is not the root
    if (node.type) {
        html += '</span>'
    }
    
    return html
}

/**
 * Escapes HTML and additionally escapes handlebars/mustache syntax 
 * to prevent Vue from interpreting them as Vue template directives
 */
function escapeHtml(unsafe) {
    // First do regular HTML escaping
    let escaped = unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    
    // Then escape the handlebars/mustache syntax by adding a zero-width space
    // between the opening braces to prevent Vue from interpreting them
    escaped = escaped
        .replace(/{{/g, "{&#8203;{")
        .replace(/}}/g, "}&#8203;}");
    
    return escaped;
}