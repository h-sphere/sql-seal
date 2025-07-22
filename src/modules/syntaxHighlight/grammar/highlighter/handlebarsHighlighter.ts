interface Decorator {
    type: 'identifier' | 'literal' | 'parameter' | 'comment' | 'keyword' | 'function' | 'error' | 'template-keyword';
    start: number;
    end: number;
  }
  
  /**
   * Highlights Handlebars syntax in a template string using regex patterns
   * @param template - The Handlebars template to highlight
   * @returns Array of decorator objects for syntax highlighting
   */
  function highlightHandlebars(template: string): Decorator[] {
    const decorators: Decorator[] = [];
    
    // Define Handlebars keywords
    const keywords = ['if', 'else', 'unless', 'each', 'with', 'as', 'in', 'let', 'log', 'lookup'];
    
    // Helper function to add a decorator
    function addDecorator(type: Decorator['type'], start: number, end: number): void {
      // Skip if out of bounds
      if (start < 0 || end > template.length || start >= end) return;
      
      decorators.push({ type, start, end });
    }
    
    // 1. Find all block comments: {{!-- comment --}}
    const blockCommentRegex = /{{!--([\s\S]*?)--}}/g;
    let match: RegExpExecArray | null;
    
    while ((match = blockCommentRegex.exec(template)) !== null) {
      addDecorator('comment', match.index, match.index + match[0].length);
    }
    
    // 2. Find all inline comments: {{! comment }}
    const inlineCommentRegex = /{{!((?!--)[^}])*}}/g;
    
    while ((match = inlineCommentRegex.exec(template)) !== null) {
      addDecorator('comment', match.index, match.index + match[0].length);
    }
    
    // 3. Find all triple mustaches: {{{unescaped}}}
    const tripleRegex = /{{{([^}]+)}}}/g;
    
    while ((match = tripleRegex.exec(template)) !== null) {
      // Highlight the opening and closing braces as keywords
      addDecorator('template-keyword', match.index, match.index + 3);
      addDecorator('template-keyword', match.index + match[0].length - 3, match.index + match[0].length);
      
      // Highlight the content as an identifier
      const contentStart = match.index + 3;
      const contentEnd = match.index + match[0].length - 3;
      addDecorator('identifier', contentStart, contentEnd);
    }
    
    // 4. Find all block expressions: {{#helper}}...{{/helper}}
    const blockStartRegex = /{{#([^}]+)}}/g;
    
    while ((match = blockStartRegex.exec(template)) !== null) {
      // Highlight the opening braces and # as keywords
      addDecorator('template-keyword', match.index, match.index + 2); // {{
      addDecorator('template-keyword', match.index + 2, match.index + 3); // #
      addDecorator('template-keyword', match.index + match[0].length - 2, match.index + match[0].length); // }}
      
      // Process the helper content
      const helperContent = match[1].trim();
      const helperStart = match.index + 3;
      
      // Identify helper name
      const helperNameMatch = /^([^\s]+)/.exec(helperContent);
      if (helperNameMatch) {
        const helperName = helperNameMatch[1];
        const helperNameEnd = helperStart + helperName.length;
        
        // Check if it's a keyword or function
        if (keywords.includes(helperName)) {
          addDecorator('template-keyword', helperStart, helperNameEnd);
        } else {
          addDecorator('function', helperStart, helperNameEnd);
        }
        
        // Process params - this is simplified
        const paramsStr = helperContent.substring(helperName.length).trim();
        if (paramsStr.length > 0) {
          const paramStart = helperNameEnd + (helperContent.substring(helperName.length).length - paramsStr.length);
          processParams(paramsStr, paramStart, decorators);
        }
      }
    }
    
    // 5. Find all closing block expressions: {{/helper}}
    const blockEndRegex = /{{\/([^}]+)}}/g;
    
    while ((match = blockEndRegex.exec(template)) !== null) {
      // Highlight the opening braces and / as keywords
      addDecorator('template-keyword', match.index, match.index + 2); // {{
      addDecorator('template-keyword', match.index + 2, match.index + 3); // /
      addDecorator('template-keyword', match.index + match[0].length - 2, match.index + match[0].length); // }}
      
      // Highlight the helper name
      const helperName = match[1].trim();
      const helperStart = match.index + 3;
      const helperEnd = helperStart + helperName.length;
      
      if (keywords.includes(helperName)) {
        addDecorator('template-keyword', helperStart, helperEnd);
      } else {
        addDecorator('function', helperStart, helperEnd);
      }
    }
    
    // 6. Find all partials: {{> partial}}
    const partialRegex = /{{>([^}]+)}}/g;
    
    while ((match = partialRegex.exec(template)) !== null) {
      // Highlight the opening braces and > as keywords
      addDecorator('template-keyword', match.index, match.index + 2); // {{
      addDecorator('template-keyword', match.index + 2, match.index + 3); // >
      addDecorator('template-keyword', match.index + match[0].length - 2, match.index + match[0].length); // }}
      
      // Highlight the partial name
      const partialContent = match[1].trim();
      const partialStart = match.index + 3;
      
      // Identify partial name
      const partialNameMatch = /^([^\s]+)/.exec(partialContent);
      if (partialNameMatch) {
        const partialName = partialNameMatch[1];
        const partialNameEnd = partialStart + partialName.length;
        
        addDecorator('identifier', partialStart, partialNameEnd);
        
        // Process params - this is simplified
        const paramsStr = partialContent.substring(partialName.length).trim();
        if (paramsStr.length > 0) {
          const paramStart = partialNameEnd + (partialContent.substring(partialName.length).length - paramsStr.length);
          processParams(paramsStr, paramStart, decorators);
        }
      }
    }
    
    // 7. Find all regular mustaches: {{expression}}
    const regularRegex = /{{([^#/!>]([^}]+))}}/g;
    
    while ((match = regularRegex.exec(template)) !== null) {
      // Highlight the opening and closing braces as keywords
      addDecorator('template-keyword', match.index, match.index + 2);
      addDecorator('template-keyword', match.index + match[0].length - 2, match.index + match[0].length);
      
      // Process the content
      const expressionContent = match[1].trim();
      const expressionStart = match.index + 2;
      
      // Simple expression like {{variable}}
      if (!/\s/.test(expressionContent)) {
        addDecorator('identifier', expressionStart, expressionStart + expressionContent.length);
      } else {
        // Handle helpers with params
        const helperMatch = /^([^\s]+)/.exec(expressionContent);
        if (helperMatch) {
          const helperName = helperMatch[1];
          const helperNameEnd = expressionStart + helperName.length;
          
          if (keywords.includes(helperName)) {
            addDecorator('template-keyword', expressionStart, helperNameEnd);
          } else {
            addDecorator('identifier', expressionStart, helperNameEnd);
          }
          
          // Process params
          const paramsStr = expressionContent.substring(helperName.length).trim();
          if (paramsStr.length > 0) {
            const paramStart = helperNameEnd + (expressionContent.substring(helperName.length).length - paramsStr.length);
            processParams(paramsStr, paramStart, decorators);
          }
        }
      }
    }
    
    // Sort decorators by start position
    decorators.sort((a, b) => a.start - b.start);
    
    return decorators;
  }
  
  /**
   * Process parameters in an expression
   */
  function processParams(paramsStr: string, startPos: number, decorators: Decorator[]): void {
    // Helper function to add a decorator
    function addDecorator(type: Decorator['type'], start: number, end: number): void {
      decorators.push({ type, start, end });
    }
    
    // Find string literals
    const stringRegex = /"([^"\\]*(\\.[^"\\]*)*)"|'([^'\\]*(\\.[^'\\]*)*)'/g;
    let match: RegExpExecArray | null;
    let lastPos = 0;
    
    // First pass: Handle string literals
    while ((match = stringRegex.exec(paramsStr)) !== null) {
      const literalStart = startPos + match.index;
      const literalEnd = literalStart + match[0].length;
      
      addDecorator('literal', literalStart, literalEnd);
      lastPos = match.index + match[0].length;
    }
    
    // Second pass: Handle parameters
    const paramRegex = /\s+([^\s"'=]+)=?/g;
    
    while ((match = paramRegex.exec(paramsStr)) !== null) {
      const paramStart = startPos + match.index + match[0].indexOf(match[1]);
      const paramEnd = paramStart + match[1].length;
      
      // Don't highlight if this is inside a previously detected string literal
      const isInLiteral = decorators.some(d => 
        d.type === 'literal' && paramStart >= d.start && paramEnd <= d.end
      );
      
      if (!isInLiteral) {
        addDecorator('parameter', paramStart, paramEnd);
      }
    }
    
    // Find non-literal parameters (simplified)
    const simpleParamRegex = /([^\s"'=]+)/g;
    
    while ((match = simpleParamRegex.exec(paramsStr)) !== null) {
      const paramStart = startPos + match.index;
      const paramEnd = paramStart + match[0].length;
      
      // Don't highlight if this is inside a previously detected string literal or parameter
      const isAlreadyHighlighted = decorators.some(d => 
        paramStart >= d.start && paramEnd <= d.end
      );
      
      if (!isAlreadyHighlighted) {
        addDecorator('parameter', paramStart, paramEnd);
      }
    }
  }
  
  export default highlightHandlebars;