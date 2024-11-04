// Generated from SqlSealLang.g4 by ANTLR 4.13.2

import {ParseTreeListener} from "antlr4";


import { ParseContext } from "./SqlSealLangParser.js";
import { StatementContext } from "./SqlSealLangParser.js";
import { TableStatementContext } from "./SqlSealLangParser.js";
import { QueryStatementContext } from "./SqlSealLangParser.js";
import { WithClauseContext } from "./SqlSealLangParser.js";
import { CteDefinitionContext } from "./SqlSealLangParser.js";
import { SelectStatementContext } from "./SqlSealLangParser.js";
import { SelectBodyContext } from "./SqlSealLangParser.js";


/**
 * This interface defines a complete listener for a parse tree produced by
 * `SqlSealLangParser`.
 */
export default class SqlSealLangListener extends ParseTreeListener {
	/**
	 * Enter a parse tree produced by `SqlSealLangParser.parse`.
	 * @param ctx the parse tree
	 */
	enterParse?: (ctx: ParseContext) => void;
	/**
	 * Exit a parse tree produced by `SqlSealLangParser.parse`.
	 * @param ctx the parse tree
	 */
	exitParse?: (ctx: ParseContext) => void;
	/**
	 * Enter a parse tree produced by `SqlSealLangParser.statement`.
	 * @param ctx the parse tree
	 */
	enterStatement?: (ctx: StatementContext) => void;
	/**
	 * Exit a parse tree produced by `SqlSealLangParser.statement`.
	 * @param ctx the parse tree
	 */
	exitStatement?: (ctx: StatementContext) => void;
	/**
	 * Enter a parse tree produced by `SqlSealLangParser.tableStatement`.
	 * @param ctx the parse tree
	 */
	enterTableStatement?: (ctx: TableStatementContext) => void;
	/**
	 * Exit a parse tree produced by `SqlSealLangParser.tableStatement`.
	 * @param ctx the parse tree
	 */
	exitTableStatement?: (ctx: TableStatementContext) => void;
	/**
	 * Enter a parse tree produced by `SqlSealLangParser.queryStatement`.
	 * @param ctx the parse tree
	 */
	enterQueryStatement?: (ctx: QueryStatementContext) => void;
	/**
	 * Exit a parse tree produced by `SqlSealLangParser.queryStatement`.
	 * @param ctx the parse tree
	 */
	exitQueryStatement?: (ctx: QueryStatementContext) => void;
	/**
	 * Enter a parse tree produced by `SqlSealLangParser.withClause`.
	 * @param ctx the parse tree
	 */
	enterWithClause?: (ctx: WithClauseContext) => void;
	/**
	 * Exit a parse tree produced by `SqlSealLangParser.withClause`.
	 * @param ctx the parse tree
	 */
	exitWithClause?: (ctx: WithClauseContext) => void;
	/**
	 * Enter a parse tree produced by `SqlSealLangParser.cteDefinition`.
	 * @param ctx the parse tree
	 */
	enterCteDefinition?: (ctx: CteDefinitionContext) => void;
	/**
	 * Exit a parse tree produced by `SqlSealLangParser.cteDefinition`.
	 * @param ctx the parse tree
	 */
	exitCteDefinition?: (ctx: CteDefinitionContext) => void;
	/**
	 * Enter a parse tree produced by `SqlSealLangParser.selectStatement`.
	 * @param ctx the parse tree
	 */
	enterSelectStatement?: (ctx: SelectStatementContext) => void;
	/**
	 * Exit a parse tree produced by `SqlSealLangParser.selectStatement`.
	 * @param ctx the parse tree
	 */
	exitSelectStatement?: (ctx: SelectStatementContext) => void;
	/**
	 * Enter a parse tree produced by `SqlSealLangParser.selectBody`.
	 * @param ctx the parse tree
	 */
	enterSelectBody?: (ctx: SelectBodyContext) => void;
	/**
	 * Exit a parse tree produced by `SqlSealLangParser.selectBody`.
	 * @param ctx the parse tree
	 */
	exitSelectBody?: (ctx: SelectBodyContext) => void;
}

