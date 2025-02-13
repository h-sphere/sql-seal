/***
 SQLSealLang {
    Grammar = (GrammarEntry | Flag)* SelectStmt*
    SelectStmt = ("WITH" | "SELECT") any+
	GrammarEntry = TableExpression | RendererExpression
    Flag = "REPEAT" | "NO REPEAT" | "EXPLAIN"
    TableExpression = "TABLE" identifier "=" "file(" filename ")"
    identifier = alnum+
    filename  = (alnum | ".")+
    RendererExpression = "GRID" anyObject -- grid
    	| "HTML" -- html
        | "MARKDOWN" --markdown
    NewLine = "\n"
    sp = " "
    blank = sp* nl  // blank line has only newline
  	endline = (~nl any)+ end
    objectContent = (alnum | "." | ":" | "," | sp | nl | tab)+
    anyObject = "{" (~"}" any)*  "}"
    nl = "\n"   // new line
    tab = "\t"
}
 */