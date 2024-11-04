// Generated from SqlSealLang.g4 by ANTLR 4.13.2
// noinspection ES6UnusedImports,JSUnusedGlobalSymbols,JSUnusedLocalSymbols

import {
	ATN,
	ATNDeserializer, DecisionState, DFA, FailedPredicateException,
	RecognitionException, NoViableAltException, BailErrorStrategy,
	Parser, ParserATNSimulator,
	RuleContext, ParserRuleContext, PredictionMode, PredictionContextCache,
	TerminalNode, RuleNode,
	Token, TokenStream,
	Interval, IntervalSet
} from 'antlr4';
import SqlSealLangListener from "./SqlSealLangListener.js";
import SqlSealLangVisitor from "./SqlSealLangVisitor.js";

// for running tests with parameters, TODO: discuss strategy for typed parameters in CI
// eslint-disable-next-line no-unused-vars
type int = number;

export default class SqlSealLangParser extends Parser {
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
	public static override readonly EOF = Token.EOF;
	public static readonly RULE_parse = 0;
	public static readonly RULE_statement = 1;
	public static readonly RULE_tableStatement = 2;
	public static readonly RULE_queryStatement = 3;
	public static readonly RULE_withClause = 4;
	public static readonly RULE_cteDefinition = 5;
	public static readonly RULE_selectStatement = 6;
	public static readonly RULE_selectBody = 7;
	public static readonly literalNames: (string | null)[] = [ null, "'='", 
                                                            "'('", "')'", 
                                                            "','", "'TABLE'", 
                                                            "'file'", "'WITH'", 
                                                            "'AS'", "'SELECT'" ];
	public static readonly symbolicNames: (string | null)[] = [ null, null, 
                                                             null, null, 
                                                             null, "TABLE", 
                                                             "FILE", "WITH", 
                                                             "AS", "SELECT", 
                                                             "ID", "FILE_URL", 
                                                             "WS", "ANY" ];
	// tslint:disable:no-trailing-whitespace
	public static readonly ruleNames: string[] = [
		"parse", "statement", "tableStatement", "queryStatement", "withClause", 
		"cteDefinition", "selectStatement", "selectBody",
	];
	public get grammarFileName(): string { return "SqlSealLang.g4"; }
	public get literalNames(): (string | null)[] { return SqlSealLangParser.literalNames; }
	public get symbolicNames(): (string | null)[] { return SqlSealLangParser.symbolicNames; }
	public get ruleNames(): string[] { return SqlSealLangParser.ruleNames; }
	public get serializedATN(): number[] { return SqlSealLangParser._serializedATN; }

	protected createFailedPredicateException(predicate?: string, message?: string): FailedPredicateException {
		return new FailedPredicateException(this, predicate, message);
	}

	constructor(input: TokenStream) {
		super(input);
		this._interp = new ParserATNSimulator(this, SqlSealLangParser._ATN, SqlSealLangParser.DecisionsToDFA, new PredictionContextCache());
	}
	// @RuleVersion(0)
	public parse(): ParseContext {
		let localctx: ParseContext = new ParseContext(this, this._ctx, this.state);
		this.enterRule(localctx, 0, SqlSealLangParser.RULE_parse);
		let _la: number;
		try {
			this.enterOuterAlt(localctx, 1);
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
			} while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 672) !== 0));
			this.state = 21;
			this.match(SqlSealLangParser.EOF);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public statement(): StatementContext {
		let localctx: StatementContext = new StatementContext(this, this._ctx, this.state);
		this.enterRule(localctx, 2, SqlSealLangParser.RULE_statement);
		try {
			this.state = 25;
			this._errHandler.sync(this);
			switch (this._input.LA(1)) {
			case 5:
				this.enterOuterAlt(localctx, 1);
				{
				this.state = 23;
				this.tableStatement();
				}
				break;
			case 7:
			case 9:
				this.enterOuterAlt(localctx, 2);
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
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public tableStatement(): TableStatementContext {
		let localctx: TableStatementContext = new TableStatementContext(this, this._ctx, this.state);
		this.enterRule(localctx, 4, SqlSealLangParser.RULE_tableStatement);
		let _la: number;
		try {
			this.enterOuterAlt(localctx, 1);
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
			} while (_la===12);
			this.state = 33;
			this.match(SqlSealLangParser.ID);
			this.state = 37;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (_la===12) {
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
			while (_la===12) {
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
			while (_la===12) {
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
			while (_la===12) {
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
			while (_la===12) {
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
			while (_la===12) {
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
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public queryStatement(): QueryStatementContext {
		let localctx: QueryStatementContext = new QueryStatementContext(this, this._ctx, this.state);
		this.enterRule(localctx, 6, SqlSealLangParser.RULE_queryStatement);
		let _la: number;
		try {
			this.enterOuterAlt(localctx, 1);
			{
			this.state = 76;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			if (_la===7) {
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
			while (_la===12) {
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
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public withClause(): WithClauseContext {
		let localctx: WithClauseContext = new WithClauseContext(this, this._ctx, this.state);
		this.enterRule(localctx, 8, SqlSealLangParser.RULE_withClause);
		let _la: number;
		try {
			let _alt: number;
			this.enterOuterAlt(localctx, 1);
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
			} while (_la===12);
			this.state = 91;
			this.cteDefinition();
			this.state = 108;
			this._errHandler.sync(this);
			_alt = this._interp.adaptivePredict(this._input, 14, this._ctx);
			while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER) {
				if (_alt === 1) {
					{
					{
					this.state = 95;
					this._errHandler.sync(this);
					_la = this._input.LA(1);
					while (_la===12) {
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
					while (_la===12) {
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
				_alt = this._interp.adaptivePredict(this._input, 14, this._ctx);
			}
			this.state = 114;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (_la===12) {
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
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public cteDefinition(): CteDefinitionContext {
		let localctx: CteDefinitionContext = new CteDefinitionContext(this, this._ctx, this.state);
		this.enterRule(localctx, 10, SqlSealLangParser.RULE_cteDefinition);
		let _la: number;
		try {
			this.enterOuterAlt(localctx, 1);
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
			} while (_la===12);
			this.state = 123;
			this.match(SqlSealLangParser.AS);
			this.state = 127;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (_la===12) {
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
			while (_la===12) {
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
			while (_la===12) {
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
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public selectStatement(): SelectStatementContext {
		let localctx: SelectStatementContext = new SelectStatementContext(this, this._ctx, this.state);
		this.enterRule(localctx, 12, SqlSealLangParser.RULE_selectStatement);
		try {
			let _alt: number;
			this.enterOuterAlt(localctx, 1);
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
				_alt = this._interp.adaptivePredict(this._input, 20, this._ctx);
			} while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER);
			this.state = 152;
			this.selectBody();
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}
	// @RuleVersion(0)
	public selectBody(): SelectBodyContext {
		let localctx: SelectBodyContext = new SelectBodyContext(this, this._ctx, this.state);
		this.enterRule(localctx, 14, SqlSealLangParser.RULE_selectBody);
		try {
			let _alt: number;
			this.enterOuterAlt(localctx, 1);
			{
			this.state = 157;
			this._errHandler.sync(this);
			_alt = this._interp.adaptivePredict(this._input, 21, this._ctx);
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
				_alt = this._interp.adaptivePredict(this._input, 21, this._ctx);
			}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return localctx;
	}

	public static readonly _serializedATN: number[] = [4,1,13,161,2,0,7,0,2,
	1,7,1,2,2,7,2,2,3,7,3,2,4,7,4,2,5,7,5,2,6,7,6,2,7,7,7,1,0,4,0,18,8,0,11,
	0,12,0,19,1,0,1,0,1,1,1,1,3,1,26,8,1,1,2,1,2,4,2,30,8,2,11,2,12,2,31,1,
	2,1,2,5,2,36,8,2,10,2,12,2,39,9,2,1,2,1,2,5,2,43,8,2,10,2,12,2,46,9,2,1,
	2,1,2,5,2,50,8,2,10,2,12,2,53,9,2,1,2,1,2,5,2,57,8,2,10,2,12,2,60,9,2,1,
	2,1,2,5,2,64,8,2,10,2,12,2,67,9,2,1,2,1,2,5,2,71,8,2,10,2,12,2,74,9,2,1,
	3,3,3,77,8,3,1,3,1,3,5,3,81,8,3,10,3,12,3,84,9,3,1,4,1,4,4,4,88,8,4,11,
	4,12,4,89,1,4,1,4,5,4,94,8,4,10,4,12,4,97,9,4,1,4,1,4,5,4,101,8,4,10,4,
	12,4,104,9,4,1,4,5,4,107,8,4,10,4,12,4,110,9,4,1,4,5,4,113,8,4,10,4,12,
	4,116,9,4,1,5,1,5,4,5,120,8,5,11,5,12,5,121,1,5,1,5,5,5,126,8,5,10,5,12,
	5,129,9,5,1,5,1,5,5,5,133,8,5,10,5,12,5,136,9,5,1,5,1,5,5,5,140,8,5,10,
	5,12,5,143,9,5,1,5,1,5,1,6,1,6,4,6,149,8,6,11,6,12,6,150,1,6,1,6,1,7,5,
	7,156,8,7,10,7,12,7,159,9,7,1,7,1,157,0,8,0,2,4,6,8,10,12,14,0,0,174,0,
	17,1,0,0,0,2,25,1,0,0,0,4,27,1,0,0,0,6,76,1,0,0,0,8,85,1,0,0,0,10,117,1,
	0,0,0,12,146,1,0,0,0,14,157,1,0,0,0,16,18,3,2,1,0,17,16,1,0,0,0,18,19,1,
	0,0,0,19,17,1,0,0,0,19,20,1,0,0,0,20,21,1,0,0,0,21,22,5,0,0,1,22,1,1,0,
	0,0,23,26,3,4,2,0,24,26,3,6,3,0,25,23,1,0,0,0,25,24,1,0,0,0,26,3,1,0,0,
	0,27,29,5,5,0,0,28,30,5,12,0,0,29,28,1,0,0,0,30,31,1,0,0,0,31,29,1,0,0,
	0,31,32,1,0,0,0,32,33,1,0,0,0,33,37,5,10,0,0,34,36,5,12,0,0,35,34,1,0,0,
	0,36,39,1,0,0,0,37,35,1,0,0,0,37,38,1,0,0,0,38,40,1,0,0,0,39,37,1,0,0,0,
	40,44,5,1,0,0,41,43,5,12,0,0,42,41,1,0,0,0,43,46,1,0,0,0,44,42,1,0,0,0,
	44,45,1,0,0,0,45,47,1,0,0,0,46,44,1,0,0,0,47,51,5,6,0,0,48,50,5,12,0,0,
	49,48,1,0,0,0,50,53,1,0,0,0,51,49,1,0,0,0,51,52,1,0,0,0,52,54,1,0,0,0,53,
	51,1,0,0,0,54,58,5,2,0,0,55,57,5,12,0,0,56,55,1,0,0,0,57,60,1,0,0,0,58,
	56,1,0,0,0,58,59,1,0,0,0,59,61,1,0,0,0,60,58,1,0,0,0,61,65,5,11,0,0,62,
	64,5,12,0,0,63,62,1,0,0,0,64,67,1,0,0,0,65,63,1,0,0,0,65,66,1,0,0,0,66,
	68,1,0,0,0,67,65,1,0,0,0,68,72,5,3,0,0,69,71,5,12,0,0,70,69,1,0,0,0,71,
	74,1,0,0,0,72,70,1,0,0,0,72,73,1,0,0,0,73,5,1,0,0,0,74,72,1,0,0,0,75,77,
	3,8,4,0,76,75,1,0,0,0,76,77,1,0,0,0,77,78,1,0,0,0,78,82,3,12,6,0,79,81,
	5,12,0,0,80,79,1,0,0,0,81,84,1,0,0,0,82,80,1,0,0,0,82,83,1,0,0,0,83,7,1,
	0,0,0,84,82,1,0,0,0,85,87,5,7,0,0,86,88,5,12,0,0,87,86,1,0,0,0,88,89,1,
	0,0,0,89,87,1,0,0,0,89,90,1,0,0,0,90,91,1,0,0,0,91,108,3,10,5,0,92,94,5,
	12,0,0,93,92,1,0,0,0,94,97,1,0,0,0,95,93,1,0,0,0,95,96,1,0,0,0,96,98,1,
	0,0,0,97,95,1,0,0,0,98,102,5,4,0,0,99,101,5,12,0,0,100,99,1,0,0,0,101,104,
	1,0,0,0,102,100,1,0,0,0,102,103,1,0,0,0,103,105,1,0,0,0,104,102,1,0,0,0,
	105,107,3,10,5,0,106,95,1,0,0,0,107,110,1,0,0,0,108,106,1,0,0,0,108,109,
	1,0,0,0,109,114,1,0,0,0,110,108,1,0,0,0,111,113,5,12,0,0,112,111,1,0,0,
	0,113,116,1,0,0,0,114,112,1,0,0,0,114,115,1,0,0,0,115,9,1,0,0,0,116,114,
	1,0,0,0,117,119,5,10,0,0,118,120,5,12,0,0,119,118,1,0,0,0,120,121,1,0,0,
	0,121,119,1,0,0,0,121,122,1,0,0,0,122,123,1,0,0,0,123,127,5,8,0,0,124,126,
	5,12,0,0,125,124,1,0,0,0,126,129,1,0,0,0,127,125,1,0,0,0,127,128,1,0,0,
	0,128,130,1,0,0,0,129,127,1,0,0,0,130,134,5,2,0,0,131,133,5,12,0,0,132,
	131,1,0,0,0,133,136,1,0,0,0,134,132,1,0,0,0,134,135,1,0,0,0,135,137,1,0,
	0,0,136,134,1,0,0,0,137,141,3,12,6,0,138,140,5,12,0,0,139,138,1,0,0,0,140,
	143,1,0,0,0,141,139,1,0,0,0,141,142,1,0,0,0,142,144,1,0,0,0,143,141,1,0,
	0,0,144,145,5,3,0,0,145,11,1,0,0,0,146,148,5,9,0,0,147,149,5,12,0,0,148,
	147,1,0,0,0,149,150,1,0,0,0,150,148,1,0,0,0,150,151,1,0,0,0,151,152,1,0,
	0,0,152,153,3,14,7,0,153,13,1,0,0,0,154,156,9,0,0,0,155,154,1,0,0,0,156,
	159,1,0,0,0,157,158,1,0,0,0,157,155,1,0,0,0,158,15,1,0,0,0,159,157,1,0,
	0,0,22,19,25,31,37,44,51,58,65,72,76,82,89,95,102,108,114,121,127,134,141,
	150,157];

	private static __ATN: ATN;
	public static get _ATN(): ATN {
		if (!SqlSealLangParser.__ATN) {
			SqlSealLangParser.__ATN = new ATNDeserializer().deserialize(SqlSealLangParser._serializedATN);
		}

		return SqlSealLangParser.__ATN;
	}


	static DecisionsToDFA = SqlSealLangParser._ATN.decisionToState.map( (ds: DecisionState, index: number) => new DFA(ds, index) );

}

export class ParseContext extends ParserRuleContext {
	constructor(parser?: SqlSealLangParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
    	this.parser = parser;
	}
	public EOF(): TerminalNode {
		return this.getToken(SqlSealLangParser.EOF, 0);
	}
	public statement_list(): StatementContext[] {
		return this.getTypedRuleContexts(StatementContext) as StatementContext[];
	}
	public statement(i: number): StatementContext {
		return this.getTypedRuleContext(StatementContext, i) as StatementContext;
	}
    public get ruleIndex(): number {
    	return SqlSealLangParser.RULE_parse;
	}
	public enterRule(listener: SqlSealLangListener): void {
	    if(listener.enterParse) {
	 		listener.enterParse(this);
		}
	}
	public exitRule(listener: SqlSealLangListener): void {
	    if(listener.exitParse) {
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
	constructor(parser?: SqlSealLangParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
    	this.parser = parser;
	}
	public tableStatement(): TableStatementContext {
		return this.getTypedRuleContext(TableStatementContext, 0) as TableStatementContext;
	}
	public queryStatement(): QueryStatementContext {
		return this.getTypedRuleContext(QueryStatementContext, 0) as QueryStatementContext;
	}
    public get ruleIndex(): number {
    	return SqlSealLangParser.RULE_statement;
	}
	public enterRule(listener: SqlSealLangListener): void {
	    if(listener.enterStatement) {
	 		listener.enterStatement(this);
		}
	}
	public exitRule(listener: SqlSealLangListener): void {
	    if(listener.exitStatement) {
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
	constructor(parser?: SqlSealLangParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
    	this.parser = parser;
	}
	public TABLE(): TerminalNode {
		return this.getToken(SqlSealLangParser.TABLE, 0);
	}
	public ID(): TerminalNode {
		return this.getToken(SqlSealLangParser.ID, 0);
	}
	public FILE(): TerminalNode {
		return this.getToken(SqlSealLangParser.FILE, 0);
	}
	public FILE_URL(): TerminalNode {
		return this.getToken(SqlSealLangParser.FILE_URL, 0);
	}
	public WS_list(): TerminalNode[] {
	    	return this.getTokens(SqlSealLangParser.WS);
	}
	public WS(i: number): TerminalNode {
		return this.getToken(SqlSealLangParser.WS, i);
	}
    public get ruleIndex(): number {
    	return SqlSealLangParser.RULE_tableStatement;
	}
	public enterRule(listener: SqlSealLangListener): void {
	    if(listener.enterTableStatement) {
	 		listener.enterTableStatement(this);
		}
	}
	public exitRule(listener: SqlSealLangListener): void {
	    if(listener.exitTableStatement) {
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
	constructor(parser?: SqlSealLangParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
    	this.parser = parser;
	}
	public selectStatement(): SelectStatementContext {
		return this.getTypedRuleContext(SelectStatementContext, 0) as SelectStatementContext;
	}
	public withClause(): WithClauseContext {
		return this.getTypedRuleContext(WithClauseContext, 0) as WithClauseContext;
	}
	public WS_list(): TerminalNode[] {
	    	return this.getTokens(SqlSealLangParser.WS);
	}
	public WS(i: number): TerminalNode {
		return this.getToken(SqlSealLangParser.WS, i);
	}
    public get ruleIndex(): number {
    	return SqlSealLangParser.RULE_queryStatement;
	}
	public enterRule(listener: SqlSealLangListener): void {
	    if(listener.enterQueryStatement) {
	 		listener.enterQueryStatement(this);
		}
	}
	public exitRule(listener: SqlSealLangListener): void {
	    if(listener.exitQueryStatement) {
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
	constructor(parser?: SqlSealLangParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
    	this.parser = parser;
	}
	public WITH(): TerminalNode {
		return this.getToken(SqlSealLangParser.WITH, 0);
	}
	public cteDefinition_list(): CteDefinitionContext[] {
		return this.getTypedRuleContexts(CteDefinitionContext) as CteDefinitionContext[];
	}
	public cteDefinition(i: number): CteDefinitionContext {
		return this.getTypedRuleContext(CteDefinitionContext, i) as CteDefinitionContext;
	}
	public WS_list(): TerminalNode[] {
	    	return this.getTokens(SqlSealLangParser.WS);
	}
	public WS(i: number): TerminalNode {
		return this.getToken(SqlSealLangParser.WS, i);
	}
    public get ruleIndex(): number {
    	return SqlSealLangParser.RULE_withClause;
	}
	public enterRule(listener: SqlSealLangListener): void {
	    if(listener.enterWithClause) {
	 		listener.enterWithClause(this);
		}
	}
	public exitRule(listener: SqlSealLangListener): void {
	    if(listener.exitWithClause) {
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
	constructor(parser?: SqlSealLangParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
    	this.parser = parser;
	}
	public ID(): TerminalNode {
		return this.getToken(SqlSealLangParser.ID, 0);
	}
	public AS(): TerminalNode {
		return this.getToken(SqlSealLangParser.AS, 0);
	}
	public selectStatement(): SelectStatementContext {
		return this.getTypedRuleContext(SelectStatementContext, 0) as SelectStatementContext;
	}
	public WS_list(): TerminalNode[] {
	    	return this.getTokens(SqlSealLangParser.WS);
	}
	public WS(i: number): TerminalNode {
		return this.getToken(SqlSealLangParser.WS, i);
	}
    public get ruleIndex(): number {
    	return SqlSealLangParser.RULE_cteDefinition;
	}
	public enterRule(listener: SqlSealLangListener): void {
	    if(listener.enterCteDefinition) {
	 		listener.enterCteDefinition(this);
		}
	}
	public exitRule(listener: SqlSealLangListener): void {
	    if(listener.exitCteDefinition) {
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
	constructor(parser?: SqlSealLangParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
    	this.parser = parser;
	}
	public SELECT(): TerminalNode {
		return this.getToken(SqlSealLangParser.SELECT, 0);
	}
	public selectBody(): SelectBodyContext {
		return this.getTypedRuleContext(SelectBodyContext, 0) as SelectBodyContext;
	}
	public WS_list(): TerminalNode[] {
	    	return this.getTokens(SqlSealLangParser.WS);
	}
	public WS(i: number): TerminalNode {
		return this.getToken(SqlSealLangParser.WS, i);
	}
    public get ruleIndex(): number {
    	return SqlSealLangParser.RULE_selectStatement;
	}
	public enterRule(listener: SqlSealLangListener): void {
	    if(listener.enterSelectStatement) {
	 		listener.enterSelectStatement(this);
		}
	}
	public exitRule(listener: SqlSealLangListener): void {
	    if(listener.exitSelectStatement) {
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
	constructor(parser?: SqlSealLangParser, parent?: ParserRuleContext, invokingState?: number) {
		super(parent, invokingState);
    	this.parser = parser;
	}
    public get ruleIndex(): number {
    	return SqlSealLangParser.RULE_selectBody;
	}
	public enterRule(listener: SqlSealLangListener): void {
	    if(listener.enterSelectBody) {
	 		listener.enterSelectBody(this);
		}
	}
	public exitRule(listener: SqlSealLangListener): void {
	    if(listener.exitSelectBody) {
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
