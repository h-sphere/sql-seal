// Generated from SqlSealLang.g4 by ANTLR 4.13.2

import {ParseTreeVisitor} from 'antlr4';


import { ParseContext } from "./SqlSealLangParser.js";
import { StatementContext } from "./SqlSealLangParser.js";
import { TableStatementContext } from "./SqlSealLangParser.js";
import { QueryStatementContext } from "./SqlSealLangParser.js";
import { WithClauseContext } from "./SqlSealLangParser.js";
import { CteDefinitionContext } from "./SqlSealLangParser.js";
import { SelectStatementContext } from "./SqlSealLangParser.js";
import { SelectBodyContext } from "./SqlSealLangParser.js";


/**
 * This interface defines a complete generic visitor for a parse tree produced
 * by `SqlSealLangParser`.
 *
 * @param <Result> The return type of the visit operation. Use `void` for
 * operations with no return type.
 */
export default class SqlSealLangVisitor<Result> extends ParseTreeVisitor<Result> {
	/**
	 * Visit a parse tree produced by `SqlSealLangParser.parse`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitParse?: (ctx: ParseContext) => Result;
	/**
	 * Visit a parse tree produced by `SqlSealLangParser.statement`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitStatement?: (ctx: StatementContext) => Result;
	/**
	 * Visit a parse tree produced by `SqlSealLangParser.tableStatement`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitTableStatement?: (ctx: TableStatementContext) => Result;
	/**
	 * Visit a parse tree produced by `SqlSealLangParser.queryStatement`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitQueryStatement?: (ctx: QueryStatementContext) => Result;
	/**
	 * Visit a parse tree produced by `SqlSealLangParser.withClause`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitWithClause?: (ctx: WithClauseContext) => Result;
	/**
	 * Visit a parse tree produced by `SqlSealLangParser.cteDefinition`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitCteDefinition?: (ctx: CteDefinitionContext) => Result;
	/**
	 * Visit a parse tree produced by `SqlSealLangParser.selectStatement`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitSelectStatement?: (ctx: SelectStatementContext) => Result;
	/**
	 * Visit a parse tree produced by `SqlSealLangParser.selectBody`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitSelectBody?: (ctx: SelectBodyContext) => Result;
}

