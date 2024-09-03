// Generated from SqlSealLang.g4 by ANTLR 4.9.0-SNAPSHOT


import { ATN } from "antlr4ts/atn/ATN";
import { ATNDeserializer } from "antlr4ts/atn/ATNDeserializer";
import { FailedPredicateException } from "antlr4ts/FailedPredicateException";
import { NotNull } from "antlr4ts/Decorators";
import { NoViableAltException } from "antlr4ts/NoViableAltException";
import { Override } from "antlr4ts/Decorators";
import { Parser } from "antlr4ts/Parser";
import { ParserRuleContext } from "antlr4ts/ParserRuleContext";
import { ParserATNSimulator } from "antlr4ts/atn/ParserATNSimulator";
import { ParseTreeListener } from "antlr4ts/tree/ParseTreeListener";
import { ParseTreeVisitor } from "antlr4ts/tree/ParseTreeVisitor";
import { RecognitionException } from "antlr4ts/RecognitionException";
import { RuleContext } from "antlr4ts/RuleContext";
//import { RuleVersion } from "antlr4ts/RuleVersion";
import { TerminalNode } from "antlr4ts/tree/TerminalNode";
import { Token } from "antlr4ts/Token";
import { TokenStream } from "antlr4ts/TokenStream";
import { Vocabulary } from "antlr4ts/Vocabulary";
import { VocabularyImpl } from "antlr4ts/VocabularyImpl";

import * as Utils from "antlr4ts/misc/Utils";

import { SqlSealLangListener } from "./SqlSealLangListener";
import { SqlSealLangVisitor } from "./SqlSealLangVisitor";


export class SqlSealLangParser extends Parser {
	public static readonly T__0 = 1;
	public static readonly T__1 = 2;
	public static readonly T__2 = 3;
	public static readonly T__3 = 4;
	public static readonly TABLE = 5;
	public static readonly FILE = 6;
	public static readonly WITH = 7;
	public static readonly AS = 8;
	public static readonly SELECT = 9;
	public static readonly ID = 10;
	public static readonly FILE_URL = 11;
	public static readonly WS = 12;
	public static readonly ANY = 13;
	public static readonly RULE_parse = 0;
	public static readonly RULE_statement = 1;
	public static readonly RULE_tableStatement = 2;
	public static readonly RULE_queryStatement = 3;
	public static readonly RULE_withClause = 4;
	public static readonly RULE_cteDefinition = 5;
	public static readonly RULE_selectStatement = 6;
	public static readonly RULE_selectBody = 7;
	// tslint:disable:no-trailing-whitespace
	public static readonly ruleNames: string[] = [
		"parse", "statement", "tableStatement", "queryStatement", "withClause", 
		"cteDefinition", "selectStatement", "selectBody",
	];

	private static readonly _LITERAL_NAMES: Array<string | undefined> = [
		undefined, "'='", "'('", "')'", "','", "'TABLE'", "'file'", "'WITH'", 
		"'AS'", "'SELECT'",
	];
	private static readonly _SYMBOLIC_NAMES: Array<string | undefined> = [
		undefined, undefined, undefined, undefined, undefined, "TABLE", "FILE", 
		"WITH", "AS", "SELECT", "ID", "FILE_URL", "WS", "ANY",
	];
	public static readonly VOCABULARY: Vocabulary = new VocabularyImpl(SqlSealLangParser._LITERAL_NAMES, SqlSealLangParser._SYMBOLIC_NAMES, []);

	// @Override
	// @NotNull
	public get vocabulary(): Vocabulary {
		return SqlSealLangParser.VOCABULARY;
	}
	// tslint:enable:no-trailing-whitespace

	// @Override
	public get grammarFileName(): string { return "SqlSealLang.g4"; }

	// @Override
	public get ruleNames(): string[] { return SqlSealLangParser.ruleNames; }

	// @Override
	public get serializedATN(): string { return SqlSealLangParser._serializedATN; }

	protected createFailedPredicateException(predicate?: string, message?: string): FailedPredicateException {
		return new FailedPredicateException(this, predicate, message);
	}

	constructor(input: TokenStream) {
		super(input);
		this._interp = new ParserATNSimulator(SqlSealLangParser._ATN, this);
	}
	// @RuleVersion(0)
	public parse(): ParseContext {
		let _localctx: ParseContext = new ParseContext(this._ctx, this.state);
		this.enterRule(_localctx, 0, SqlSealLangParser.RULE_parse);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 17;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			do {
				{
				{
				this.state = 16;
				this.statement();
				}
				}
				this.state = 19;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			} while ((((_la) & ~0x1F) === 0 && ((1 << _la) & ((1 << SqlSealLangParser.TABLE) | (1 << SqlSealLangParser.WITH) | (1 << SqlSealLangParser.SELECT))) !== 0));
			this.state = 21;
			this.match(SqlSealLangParser.EOF);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public statement(): StatementContext {
		let _localctx: StatementContext = new StatementContext(this._ctx, this.state);
		this.enterRule(_localctx, 2, SqlSealLangParser.RULE_statement);
		try {
			this.state = 25;
			this._errHandler.sync(this);
			switch (this._input.LA(1)) {
			case SqlSealLangParser.TABLE:
				this.enterOuterAlt(_localctx, 1);
				{
				this.state = 23;
				this.tableStatement();
				}
				break;
			case SqlSealLangParser.WITH:
			case SqlSealLangParser.SELECT:
				this.enterOuterAlt(_localctx, 2);
				{
				this.state = 24;
				this.queryStatement();
				}
				break;
			default:
				throw new NoViableAltException(this);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public tableStatement(): TableStatementContext {
		let _localctx: TableStatementContext = new TableStatementContext(this._ctx, this.state);
		this.enterRule(_localctx, 4, SqlSealLangParser.RULE_tableStatement);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 27;
			this.match(SqlSealLangParser.TABLE);
			this.state = 29;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			do {
				{
				{
				this.state = 28;
				this.match(SqlSealLangParser.WS);
				}
				}
				this.state = 31;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			} while (_la === SqlSealLangParser.WS);
			this.state = 33;
			this.match(SqlSealLangParser.ID);
			this.state = 37;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (_la === SqlSealLangParser.WS) {
				{
				{
				this.state = 34;
				this.match(SqlSealLangParser.WS);
				}
				}
				this.state = 39;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			}
			this.state = 40;
			this.match(SqlSealLangParser.T__0);
			this.state = 44;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (_la === SqlSealLangParser.WS) {
				{
				{
				this.state = 41;
				this.match(SqlSealLangParser.WS);
				}
				}
				this.state = 46;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			}
			this.state = 47;
			this.match(SqlSealLangParser.FILE);
			this.state = 51;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (_la === SqlSealLangParser.WS) {
				{
				{
				this.state = 48;
				this.match(SqlSealLangParser.WS);
				}
				}
				this.state = 53;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			}
			this.state = 54;
			this.match(SqlSealLangParser.T__1);
			this.state = 58;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (_la === SqlSealLangParser.WS) {
				{
				{
				this.state = 55;
				this.match(SqlSealLangParser.WS);
				}
				}
				this.state = 60;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			}
			this.state = 61;
			this.match(SqlSealLangParser.FILE_URL);
			this.state = 65;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (_la === SqlSealLangParser.WS) {
				{
				{
				this.state = 62;
				this.match(SqlSealLangParser.WS);
				}
				}
				this.state = 67;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			}
			this.state = 68;
			this.match(SqlSealLangParser.T__2);
			this.state = 72;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (_la === SqlSealLangParser.WS) {
				{
				{
				this.state = 69;
				this.match(SqlSealLangParser.WS);
				}
				}
				this.state = 74;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public queryStatement(): QueryStatementContext {
		let _localctx: QueryStatementContext = new QueryStatementContext(this._ctx, this.state);
		this.enterRule(_localctx, 6, SqlSealLangParser.RULE_queryStatement);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 76;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			if (_la === SqlSealLangParser.WITH) {
				{
				this.state = 75;
				this.withClause();
				}
			}

			this.state = 78;
			this.selectStatement();
			this.state = 82;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (_la === SqlSealLangParser.WS) {
				{
				{
				this.state = 79;
				this.match(SqlSealLangParser.WS);
				}
				}
				this.state = 84;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public withClause(): WithClauseContext {
		let _localctx: WithClauseContext = new WithClauseContext(this._ctx, this.state);
		this.enterRule(_localctx, 8, SqlSealLangParser.RULE_withClause);
		let _la: number;
		try {
			let _alt: number;
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 85;
			this.match(SqlSealLangParser.WITH);
			this.state = 87;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			do {
				{
				{
				this.state = 86;
				this.match(SqlSealLangParser.WS);
				}
				}
				this.state = 89;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			} while (_la === SqlSealLangParser.WS);
			this.state = 91;
			this.cteDefinition();
			this.state = 108;
			this._errHandler.sync(this);
			_alt = this.interpreter.adaptivePredict(this._input, 14, this._ctx);
			while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER) {
				if (_alt === 1) {
					{
					{
					this.state = 95;
					this._errHandler.sync(this);
					_la = this._input.LA(1);
					while (_la === SqlSealLangParser.WS) {
						{
						{
						this.state = 92;
						this.match(SqlSealLangParser.WS);
						}
						}
						this.state = 97;
						this._errHandler.sync(this);
						_la = this._input.LA(1);
					}
					this.state = 98;
					this.match(SqlSealLangParser.T__3);
					this.state = 102;
					this._errHandler.sync(this);
					_la = this._input.LA(1);
					while (_la === SqlSealLangParser.WS) {
						{
						{
						this.state = 99;
						this.match(SqlSealLangParser.WS);
						}
						}
						this.state = 104;
						this._errHandler.sync(this);
						_la = this._input.LA(1);
					}
					this.state = 105;
					this.cteDefinition();
					}
					}
				}
				this.state = 110;
				this._errHandler.sync(this);
				_alt = this.interpreter.adaptivePredict(this._input, 14, this._ctx);
			}
			this.state = 114;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (_la === SqlSealLangParser.WS) {
				{
				{
				this.state = 111;
				this.match(SqlSealLangParser.WS);
				}
				}
				this.state = 116;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public cteDefinition(): CteDefinitionContext {
		let _localctx: CteDefinitionContext = new CteDefinitionContext(this._ctx, this.state);
		this.enterRule(_localctx, 10, SqlSealLangParser.RULE_cteDefinition);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 117;
			this.match(SqlSealLangParser.ID);
			this.state = 119;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			do {
				{
				{
				this.state = 118;
				this.match(SqlSealLangParser.WS);
				}
				}
				this.state = 121;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			} while (_la === SqlSealLangParser.WS);
			this.state = 123;
			this.match(SqlSealLangParser.AS);
			this.state = 127;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (_la === SqlSealLangParser.WS) {
				{
				{
				this.state = 124;
				this.match(SqlSealLangParser.WS);
				}
				}
				this.state = 129;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			}
			this.state = 130;
			this.match(SqlSealLangParser.T__1);
			this.state = 134;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (_la === SqlSealLangParser.WS) {
				{
				{
				this.state = 131;
				this.match(SqlSealLangParser.WS);
				}
				}
				this.state = 136;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			}
			this.state = 137;
			this.selectStatement();
			this.state = 141;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (_la === SqlSealLangParser.WS) {
				{
				{
				this.state = 138;
				this.match(SqlSealLangParser.WS);
				}
				}
				this.state = 143;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			}
			this.state = 144;
			this.match(SqlSealLangParser.T__2);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public selectStatement(): SelectStatementContext {
		let _localctx: SelectStatementContext = new SelectStatementContext(this._ctx, this.state);
		this.enterRule(_localctx, 12, SqlSealLangParser.RULE_selectStatement);
		try {
			let _alt: number;
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 146;
			this.match(SqlSealLangParser.SELECT);
			this.state = 148;
			this._errHandler.sync(this);
			_alt = 1;
			do {
				switch (_alt) {
				case 1:
					{
					{
					this.state = 147;
					this.match(SqlSealLangParser.WS);
					}
					}
					break;
				default:
					throw new NoViableAltException(this);
				}
				this.state = 150;
				this._errHandler.sync(this);
				_alt = this.interpreter.adaptivePredict(this._input, 20, this._ctx);
			} while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER);
			this.state = 152;
			this.selectBody();
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public selectBody(): SelectBodyContext {
		let _localctx: SelectBodyContext = new SelectBodyContext(this._ctx, this.state);
		this.enterRule(_localctx, 14, SqlSealLangParser.RULE_selectBody);
		try {
			let _alt: number;
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 157;
			this._errHandler.sync(this);
			_alt = this.interpreter.adaptivePredict(this._input, 21, this._ctx);
			while (_alt !== 1 && _alt !== ATN.INVALID_ALT_NUMBER) {
				if (_alt === 1 + 1) {
					{
					{
					this.state = 154;
					this.matchWildcard();
					}
					}
				}
				this.state = 159;
				this._errHandler.sync(this);
				_alt = this.interpreter.adaptivePredict(this._input, 21, this._ctx);
			}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}

	public static readonly _serializedATN: string =
		"\x03\uC91D\uCABA\u058D\uAFBA\u4F53\u0607\uEA8B\uC241\x03\x0F\xA3\x04\x02" +
		"\t\x02\x04\x03\t\x03\x04\x04\t\x04\x04\x05\t\x05\x04\x06\t\x06\x04\x07" +
		"\t\x07\x04\b\t\b\x04\t\t\t\x03\x02\x06\x02\x14\n\x02\r\x02\x0E\x02\x15" +
		"\x03\x02\x03\x02\x03\x03\x03\x03\x05\x03\x1C\n\x03\x03\x04\x03\x04\x06" +
		"\x04 \n\x04\r\x04\x0E\x04!\x03\x04\x03\x04\x07\x04&\n\x04\f\x04\x0E\x04" +
		")\v\x04\x03\x04\x03\x04\x07\x04-\n\x04\f\x04\x0E\x040\v\x04\x03\x04\x03" +
		"\x04\x07\x044\n\x04\f\x04\x0E\x047\v\x04\x03\x04\x03\x04\x07\x04;\n\x04" +
		"\f\x04\x0E\x04>\v\x04\x03\x04\x03\x04\x07\x04B\n\x04\f\x04\x0E\x04E\v" +
		"\x04\x03\x04\x03\x04\x07\x04I\n\x04\f\x04\x0E\x04L\v\x04\x03\x05\x05\x05" +
		"O\n\x05\x03\x05\x03\x05\x07\x05S\n\x05\f\x05\x0E\x05V\v\x05\x03\x06\x03" +
		"\x06\x06\x06Z\n\x06\r\x06\x0E\x06[\x03\x06\x03\x06\x07\x06`\n\x06\f\x06" +
		"\x0E\x06c\v\x06\x03\x06\x03\x06\x07\x06g\n\x06\f\x06\x0E\x06j\v\x06\x03" +
		"\x06\x07\x06m\n\x06\f\x06\x0E\x06p\v\x06\x03\x06\x07\x06s\n\x06\f\x06" +
		"\x0E\x06v\v\x06\x03\x07\x03\x07\x06\x07z\n\x07\r\x07\x0E\x07{\x03\x07" +
		"\x03\x07\x07\x07\x80\n\x07\f\x07\x0E\x07\x83\v\x07\x03\x07\x03\x07\x07" +
		"\x07\x87\n\x07\f\x07\x0E\x07\x8A\v\x07\x03\x07\x03\x07\x07\x07\x8E\n\x07" +
		"\f\x07\x0E\x07\x91\v\x07\x03\x07\x03\x07\x03\b\x03\b\x06\b\x97\n\b\r\b" +
		"\x0E\b\x98\x03\b\x03\b\x03\t\x07\t\x9E\n\t\f\t\x0E\t\xA1\v\t\x03\t\x03" +
		"\x9F\x02\x02\n\x02\x02\x04\x02\x06\x02\b\x02\n\x02\f\x02\x0E\x02\x10\x02" +
		"\x02\x02\x02\xB0\x02\x13\x03\x02\x02\x02\x04\x1B\x03\x02\x02\x02\x06\x1D" +
		"\x03\x02\x02\x02\bN\x03\x02\x02\x02\nW\x03\x02\x02\x02\fw\x03\x02\x02" +
		"\x02\x0E\x94\x03\x02\x02\x02\x10\x9F\x03\x02\x02\x02\x12\x14\x05\x04\x03" +
		"\x02\x13\x12\x03\x02\x02\x02\x14\x15\x03\x02\x02\x02\x15\x13\x03\x02\x02" +
		"\x02\x15\x16\x03\x02\x02\x02\x16\x17\x03\x02\x02\x02\x17\x18\x07\x02\x02" +
		"\x03\x18\x03\x03\x02\x02\x02\x19\x1C\x05\x06\x04\x02\x1A\x1C\x05\b\x05" +
		"\x02\x1B\x19\x03\x02\x02\x02\x1B\x1A\x03\x02\x02\x02\x1C\x05\x03\x02\x02" +
		"\x02\x1D\x1F\x07\x07\x02\x02\x1E \x07\x0E\x02\x02\x1F\x1E\x03\x02\x02" +
		"\x02 !\x03\x02\x02\x02!\x1F\x03\x02\x02\x02!\"\x03\x02\x02\x02\"#\x03" +
		"\x02\x02\x02#\'\x07\f\x02\x02$&\x07\x0E\x02\x02%$\x03\x02\x02\x02&)\x03" +
		"\x02\x02\x02\'%\x03\x02\x02\x02\'(\x03\x02\x02\x02(*\x03\x02\x02\x02)" +
		"\'\x03\x02\x02\x02*.\x07\x03\x02\x02+-\x07\x0E\x02\x02,+\x03\x02\x02\x02" +
		"-0\x03\x02\x02\x02.,\x03\x02\x02\x02./\x03\x02\x02\x02/1\x03\x02\x02\x02" +
		"0.\x03\x02\x02\x0215\x07\b\x02\x0224\x07\x0E\x02\x0232\x03\x02\x02\x02" +
		"47\x03\x02\x02\x0253\x03\x02\x02\x0256\x03\x02\x02\x0268\x03\x02\x02\x02" +
		"75\x03\x02\x02\x028<\x07\x04\x02\x029;\x07\x0E\x02\x02:9\x03\x02\x02\x02" +
		";>\x03\x02\x02\x02<:\x03\x02\x02\x02<=\x03\x02\x02\x02=?\x03\x02\x02\x02" +
		"><\x03\x02\x02\x02?C\x07\r\x02\x02@B\x07\x0E\x02\x02A@\x03\x02\x02\x02" +
		"BE\x03\x02\x02\x02CA\x03\x02\x02\x02CD\x03\x02\x02\x02DF\x03\x02\x02\x02" +
		"EC\x03\x02\x02\x02FJ\x07\x05\x02\x02GI\x07\x0E\x02\x02HG\x03\x02\x02\x02" +
		"IL\x03\x02\x02\x02JH\x03\x02\x02\x02JK\x03\x02\x02\x02K\x07\x03\x02\x02" +
		"\x02LJ\x03\x02\x02\x02MO\x05\n\x06\x02NM\x03\x02\x02\x02NO\x03\x02\x02" +
		"\x02OP\x03\x02\x02\x02PT\x05\x0E\b\x02QS\x07\x0E\x02\x02RQ\x03\x02\x02" +
		"\x02SV\x03\x02\x02\x02TR\x03\x02\x02\x02TU\x03\x02\x02\x02U\t\x03\x02" +
		"\x02\x02VT\x03\x02\x02\x02WY\x07\t\x02\x02XZ\x07\x0E\x02\x02YX\x03\x02" +
		"\x02\x02Z[\x03\x02\x02\x02[Y\x03\x02\x02\x02[\\\x03\x02\x02\x02\\]\x03" +
		"\x02\x02\x02]n\x05\f\x07\x02^`\x07\x0E\x02\x02_^\x03\x02\x02\x02`c\x03" +
		"\x02\x02\x02a_\x03\x02\x02\x02ab\x03\x02\x02\x02bd\x03\x02\x02\x02ca\x03" +
		"\x02\x02\x02dh\x07\x06\x02\x02eg\x07\x0E\x02\x02fe\x03\x02\x02\x02gj\x03" +
		"\x02\x02\x02hf\x03\x02\x02\x02hi\x03\x02\x02\x02ik\x03\x02\x02\x02jh\x03" +
		"\x02\x02\x02km\x05\f\x07\x02la\x03\x02\x02\x02mp\x03\x02\x02\x02nl\x03" +
		"\x02\x02\x02no\x03\x02\x02\x02ot\x03\x02\x02\x02pn\x03\x02\x02\x02qs\x07" +
		"\x0E\x02\x02rq\x03\x02\x02\x02sv\x03\x02\x02\x02tr\x03\x02\x02\x02tu\x03" +
		"\x02\x02\x02u\v\x03\x02\x02\x02vt\x03\x02\x02\x02wy\x07\f\x02\x02xz\x07" +
		"\x0E\x02\x02yx\x03\x02\x02\x02z{\x03\x02\x02\x02{y\x03\x02\x02\x02{|\x03" +
		"\x02\x02\x02|}\x03\x02\x02\x02}\x81\x07\n\x02\x02~\x80\x07\x0E\x02\x02" +
		"\x7F~\x03\x02\x02\x02\x80\x83\x03\x02\x02\x02\x81\x7F\x03\x02\x02\x02" +
		"\x81\x82\x03\x02\x02\x02\x82\x84\x03\x02\x02\x02\x83\x81\x03\x02\x02\x02" +
		"\x84\x88\x07\x04\x02\x02\x85\x87\x07\x0E\x02\x02\x86\x85\x03\x02\x02\x02" +
		"\x87\x8A\x03\x02\x02\x02\x88\x86\x03\x02\x02\x02\x88\x89\x03\x02\x02\x02" +
		"\x89\x8B\x03\x02\x02\x02\x8A\x88\x03\x02\x02\x02\x8B\x8F\x05\x0E\b\x02" +
		"\x8C\x8E\x07\x0E\x02\x02\x8D\x8C\x03\x02\x02\x02\x8E\x91\x03\x02\x02\x02" +
		"\x8F\x8D\x03\x02\x02\x02\x8F\x90\x03\x02\x02\x02\x90\x92\x03\x02\x02\x02" +
		"\x91\x8F\x03\x02\x02\x02\x92\x93\x07\x05\x02\x02\x93\r\x03\x02\x02\x02" +
		"\x94\x96\x07\v\x02\x02\x95\x97\x07\x0E\x02\x02\x96\x95\x03\x02\x02\x02" +
		"\x97\x98\x03\x02\x02\x02\x98\x96\x03\x02\x02\x02\x98\x99\x03\x02\x02\x02" +
		"\x99\x9A\x03\x02\x02\x02\x9A\x9B\x05\x10\t\x02\x9B\x0F\x03\x02\x02\x02" +
		"\x9C\x9E\v\x02\x02\x02\x9D\x9C\x03\x02\x02\x02\x9E\xA1\x03\x02\x02\x02" +
		"\x9F\xA0\x03\x02\x02\x02\x9F\x9D\x03\x02\x02\x02\xA0\x11\x03\x02\x02\x02" +
		"\xA1\x9F\x03\x02\x02\x02\x18\x15\x1B!\'.5<CJNT[ahnt{\x81\x88\x8F\x98\x9F";
	public static __ATN: ATN;
	public static get _ATN(): ATN {
		if (!SqlSealLangParser.__ATN) {
			SqlSealLangParser.__ATN = new ATNDeserializer().deserialize(Utils.toCharArray(SqlSealLangParser._serializedATN));
		}

		return SqlSealLangParser.__ATN;
	}

}

export class ParseContext extends ParserRuleContext {
	public EOF(): TerminalNode { return this.getToken(SqlSealLangParser.EOF, 0); }
	public statement(): StatementContext[];
	public statement(i: number): StatementContext;
	public statement(i?: number): StatementContext | StatementContext[] {
		if (i === undefined) {
			return this.getRuleContexts(StatementContext);
		} else {
			return this.getRuleContext(i, StatementContext);
		}
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return SqlSealLangParser.RULE_parse; }
	// @Override
	public enterRule(listener: SqlSealLangListener): void {
		if (listener.enterParse) {
			listener.enterParse(this);
		}
	}
	// @Override
	public exitRule(listener: SqlSealLangListener): void {
		if (listener.exitParse) {
			listener.exitParse(this);
		}
	}
	// @Override
	public accept<Result>(visitor: SqlSealLangVisitor<Result>): Result {
		if (visitor.visitParse) {
			return visitor.visitParse(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class StatementContext extends ParserRuleContext {
	public tableStatement(): TableStatementContext | undefined {
		return this.tryGetRuleContext(0, TableStatementContext);
	}
	public queryStatement(): QueryStatementContext | undefined {
		return this.tryGetRuleContext(0, QueryStatementContext);
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return SqlSealLangParser.RULE_statement; }
	// @Override
	public enterRule(listener: SqlSealLangListener): void {
		if (listener.enterStatement) {
			listener.enterStatement(this);
		}
	}
	// @Override
	public exitRule(listener: SqlSealLangListener): void {
		if (listener.exitStatement) {
			listener.exitStatement(this);
		}
	}
	// @Override
	public accept<Result>(visitor: SqlSealLangVisitor<Result>): Result {
		if (visitor.visitStatement) {
			return visitor.visitStatement(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class TableStatementContext extends ParserRuleContext {
	public TABLE(): TerminalNode { return this.getToken(SqlSealLangParser.TABLE, 0); }
	public ID(): TerminalNode { return this.getToken(SqlSealLangParser.ID, 0); }
	public FILE(): TerminalNode { return this.getToken(SqlSealLangParser.FILE, 0); }
	public FILE_URL(): TerminalNode { return this.getToken(SqlSealLangParser.FILE_URL, 0); }
	public WS(): TerminalNode[];
	public WS(i: number): TerminalNode;
	public WS(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(SqlSealLangParser.WS);
		} else {
			return this.getToken(SqlSealLangParser.WS, i);
		}
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return SqlSealLangParser.RULE_tableStatement; }
	// @Override
	public enterRule(listener: SqlSealLangListener): void {
		if (listener.enterTableStatement) {
			listener.enterTableStatement(this);
		}
	}
	// @Override
	public exitRule(listener: SqlSealLangListener): void {
		if (listener.exitTableStatement) {
			listener.exitTableStatement(this);
		}
	}
	// @Override
	public accept<Result>(visitor: SqlSealLangVisitor<Result>): Result {
		if (visitor.visitTableStatement) {
			return visitor.visitTableStatement(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class QueryStatementContext extends ParserRuleContext {
	public selectStatement(): SelectStatementContext {
		return this.getRuleContext(0, SelectStatementContext);
	}
	public withClause(): WithClauseContext | undefined {
		return this.tryGetRuleContext(0, WithClauseContext);
	}
	public WS(): TerminalNode[];
	public WS(i: number): TerminalNode;
	public WS(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(SqlSealLangParser.WS);
		} else {
			return this.getToken(SqlSealLangParser.WS, i);
		}
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return SqlSealLangParser.RULE_queryStatement; }
	// @Override
	public enterRule(listener: SqlSealLangListener): void {
		if (listener.enterQueryStatement) {
			listener.enterQueryStatement(this);
		}
	}
	// @Override
	public exitRule(listener: SqlSealLangListener): void {
		if (listener.exitQueryStatement) {
			listener.exitQueryStatement(this);
		}
	}
	// @Override
	public accept<Result>(visitor: SqlSealLangVisitor<Result>): Result {
		if (visitor.visitQueryStatement) {
			return visitor.visitQueryStatement(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class WithClauseContext extends ParserRuleContext {
	public WITH(): TerminalNode { return this.getToken(SqlSealLangParser.WITH, 0); }
	public cteDefinition(): CteDefinitionContext[];
	public cteDefinition(i: number): CteDefinitionContext;
	public cteDefinition(i?: number): CteDefinitionContext | CteDefinitionContext[] {
		if (i === undefined) {
			return this.getRuleContexts(CteDefinitionContext);
		} else {
			return this.getRuleContext(i, CteDefinitionContext);
		}
	}
	public WS(): TerminalNode[];
	public WS(i: number): TerminalNode;
	public WS(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(SqlSealLangParser.WS);
		} else {
			return this.getToken(SqlSealLangParser.WS, i);
		}
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return SqlSealLangParser.RULE_withClause; }
	// @Override
	public enterRule(listener: SqlSealLangListener): void {
		if (listener.enterWithClause) {
			listener.enterWithClause(this);
		}
	}
	// @Override
	public exitRule(listener: SqlSealLangListener): void {
		if (listener.exitWithClause) {
			listener.exitWithClause(this);
		}
	}
	// @Override
	public accept<Result>(visitor: SqlSealLangVisitor<Result>): Result {
		if (visitor.visitWithClause) {
			return visitor.visitWithClause(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class CteDefinitionContext extends ParserRuleContext {
	public ID(): TerminalNode { return this.getToken(SqlSealLangParser.ID, 0); }
	public AS(): TerminalNode { return this.getToken(SqlSealLangParser.AS, 0); }
	public selectStatement(): SelectStatementContext {
		return this.getRuleContext(0, SelectStatementContext);
	}
	public WS(): TerminalNode[];
	public WS(i: number): TerminalNode;
	public WS(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(SqlSealLangParser.WS);
		} else {
			return this.getToken(SqlSealLangParser.WS, i);
		}
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return SqlSealLangParser.RULE_cteDefinition; }
	// @Override
	public enterRule(listener: SqlSealLangListener): void {
		if (listener.enterCteDefinition) {
			listener.enterCteDefinition(this);
		}
	}
	// @Override
	public exitRule(listener: SqlSealLangListener): void {
		if (listener.exitCteDefinition) {
			listener.exitCteDefinition(this);
		}
	}
	// @Override
	public accept<Result>(visitor: SqlSealLangVisitor<Result>): Result {
		if (visitor.visitCteDefinition) {
			return visitor.visitCteDefinition(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class SelectStatementContext extends ParserRuleContext {
	public SELECT(): TerminalNode { return this.getToken(SqlSealLangParser.SELECT, 0); }
	public selectBody(): SelectBodyContext {
		return this.getRuleContext(0, SelectBodyContext);
	}
	public WS(): TerminalNode[];
	public WS(i: number): TerminalNode;
	public WS(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(SqlSealLangParser.WS);
		} else {
			return this.getToken(SqlSealLangParser.WS, i);
		}
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return SqlSealLangParser.RULE_selectStatement; }
	// @Override
	public enterRule(listener: SqlSealLangListener): void {
		if (listener.enterSelectStatement) {
			listener.enterSelectStatement(this);
		}
	}
	// @Override
	public exitRule(listener: SqlSealLangListener): void {
		if (listener.exitSelectStatement) {
			listener.exitSelectStatement(this);
		}
	}
	// @Override
	public accept<Result>(visitor: SqlSealLangVisitor<Result>): Result {
		if (visitor.visitSelectStatement) {
			return visitor.visitSelectStatement(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class SelectBodyContext extends ParserRuleContext {
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return SqlSealLangParser.RULE_selectBody; }
	// @Override
	public enterRule(listener: SqlSealLangListener): void {
		if (listener.enterSelectBody) {
			listener.enterSelectBody(this);
		}
	}
	// @Override
	public exitRule(listener: SqlSealLangListener): void {
		if (listener.exitSelectBody) {
			listener.exitSelectBody(this);
		}
	}
	// @Override
	public accept<Result>(visitor: SqlSealLangVisitor<Result>): Result {
		if (visitor.visitSelectBody) {
			return visitor.visitSelectBody(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


