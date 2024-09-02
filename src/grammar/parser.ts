import { ANTLRErrorListener, CharStreams, CommonTokenStream, RecognitionException, Recognizer } from 'antlr4ts';
import { SqlSealLangLexer } from './SqlSealLangLexer';
import { QueryStatementContext, TableStatementContext, SqlSealLangParser, ParseContext, StatementContext, WithClauseContext, SelectStatementContext } from './SqlSealLangParser';
import { SqlSealLangVisitor } from './SqlSealLangVisitor';
import { AbstractParseTreeVisitor } from 'antlr4ts/tree/AbstractParseTreeVisitor';

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


class ErrorListener implements ANTLRErrorListener<any> {
  private errors: string[] = [];

  syntaxError(recognizer: Recognizer<any, any>, offendingSymbol: any, line: number, charPositionInLine: number, msg: string, e: RecognitionException | undefined): void {
    this.errors.push(`Line ${line}:${charPositionInLine} ${msg}`);
  }

  hasErrors(): boolean {
    return this.errors.length > 0;
  }

  getErrors(): string {
    return this.errors.join('\n');
  }
}

export class SqlSealLangVisitorImpl extends AbstractParseTreeVisitor<ParsedLanguage> implements SqlSealLangVisitor<ParsedLanguage> {
  private tables: TableStatement[] = [];
  private queryPart: string | null = null;

  defaultResult(): ParsedLanguage {
    return { tables: this.tables, queryPart: this.queryPart };
  }

  visitParse(ctx: ParseContext): ParsedLanguage {
    ctx.statement().forEach(stmt => this.visit(stmt));
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
    const tableName = ctx.ID().text;
    const fileUrl = ctx.FILE_URL().text;
    
    // Reconstruct the original table statement with whitespace
    const tableStmt = ctx.children!.map(child => child.text).join('');
    
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
    this.queryPart = ctx.children!.map(child => child.text).join('');
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
  const chars = CharStreams.fromString(input);
  const lexer = new SqlSealLangLexer(chars);
  const tokens = new CommonTokenStream(lexer);
  const parser = new SqlSealLangParser(tokens);

  const errorListener = new ErrorListener();
  parser.removeErrorListeners();
  parser.addErrorListener(errorListener);

  const tree = parser.parse();
  
  if (errorListener.hasErrors()) {
    throw errorListener.getErrors()
  }
  const visitor = new SqlSealLangVisitorImpl();
  return visitor.visit(tree);
}