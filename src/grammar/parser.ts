import { CommonTokenStream, ErrorListener, ParseTreeVisitor, RecognitionException } from 'antlr4';
import SqlSealLangLexer from './SqlSealLangLexer';
import { QueryStatementContext, TableStatementContext, ParseContext, StatementContext, WithClauseContext, SelectStatementContext } from './SqlSealLangParser';
import SqlSealLangParser from './SqlSealLangParser';
import SqlSealLangVisitor from './SqlSealLangVisitor';
import { CharStream, TokenStream } from 'antlr4';

export interface TableStatement {
  name: string;
  file: string;
  url: string;
  originalStatement: string;
}

export interface ParsedLanguage {
  tables: TableStatement[];
  queryPart: string | null;
}


class SQLSealErrorListener extends ErrorListener<any>  {
  private errors: string[] = [];

  syntaxError(recognizer: any, offendingSymbol: any, line: number, charPositionInLine: number, msg: string, e: RecognitionException | undefined): void {
    this.errors.push(`Line ${line}:${charPositionInLine} ${msg}`);
  }

  hasErrors(): boolean {
    return this.errors.length > 0;
  }

  getErrors(): string {
    return this.errors.join('\n');
  }

  reportAttemtpingFullContext() {
    
  }
}

export class SqlSealLangVisitorImpl extends ParseTreeVisitor<ParsedLanguage> implements SqlSealLangVisitor<ParsedLanguage> {
  private tables: TableStatement[] = [];
  private queryPart: string | null = null;

  defaultResult(): ParsedLanguage {
    return { tables: this.tables, queryPart: this.queryPart };
  }

  visitParse(ctx: ParseContext): ParsedLanguage {
    ctx.statement_list().forEach(stmt => this.visit(stmt));
    return this.defaultResult();
  }

  visitStatement(ctx: StatementContext): ParsedLanguage {
    if (ctx.tableStatement()) {
      this.visitTableStatement(ctx.tableStatement()!);
    } else if (ctx.queryStatement()) {
      this.visitQueryStatement(ctx.queryStatement()!);
    }
    return this.defaultResult();
  }

  visitTableStatement(ctx: TableStatementContext): ParsedLanguage {
    const tableName = ctx.ID().getText();
    const fileUrl = ctx.FILE_URL().getText();
    
    // Reconstruct the original table statement with whitespace
    const tableStmt = ctx.children!.map(child => child.getText()).join('');
    
    this.tables.push({
      name: tableName,
      file: 'file',
      url: fileUrl,
      originalStatement: tableStmt
    });
    return this.defaultResult();
  }

  visitQueryStatement(ctx: QueryStatementContext): ParsedLanguage {
    // Reconstruct the original query statement with whitespace and all characters
    this.queryPart = ctx.children!.map(child => child.getText()).join('');
    return this.defaultResult();
  }

  visitWithClause(ctx: WithClauseContext): ParsedLanguage {
    // The WITH clause is already included in the queryPart, so we don't need to do anything here
    return this.defaultResult();
  }

  visitSelectStatement(ctx: SelectStatementContext): ParsedLanguage {
    // The SELECT statement is already included in the queryPart, so we don't need to do anything here
    return this.defaultResult();
  }
}

export function parseLanguage(input: string): ParsedLanguage {
  const chars = new CharStream(input); // replace this with a FileStream as required
// const lexer = new MyGrammarLexer(chars);
// const tokens = new CommonTokenStream(lexer);
// const parser = new MyGrammarParser(tokens);

  const lexer = new SqlSealLangLexer(new CharStream(input));
  const tokens = new CommonTokenStream(lexer);
  const parser = new SqlSealLangParser(tokens);

  const errorListener = new SQLSealErrorListener();
  parser.removeErrorListeners();
  parser.addErrorListener(errorListener);

  const tree = parser.parse();
  
  if (errorListener.hasErrors()) {
    throw errorListener.getErrors()
  }
  const visitor = new SqlSealLangVisitorImpl();
  return visitor.visit(tree);
}