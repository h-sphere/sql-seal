// Generated from SqlSealLang.g4 by ANTLR 4.13.2
// noinspection ES6UnusedImports,JSUnusedGlobalSymbols,JSUnusedLocalSymbols
import {
	ATN,
	ATNDeserializer,
	CharStream,
	DecisionState, DFA,
	Lexer,
	LexerATNSimulator,
	RuleContext,
	PredictionContextCache,
	Token
} from "antlr4";
export default class SqlSealLangLexer extends Lexer {
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
	public static readonly EOF = Token.EOF;

	public static readonly channelNames: string[] = [ "DEFAULT_TOKEN_CHANNEL", "HIDDEN" ];
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
	public static readonly modeNames: string[] = [ "DEFAULT_MODE", ];

	public static readonly ruleNames: string[] = [
		"T__0", "T__1", "T__2", "T__3", "TABLE", "FILE", "WITH", "AS", "SELECT", 
		"ID", "FILE_URL", "WS", "ANY",
	];


	constructor(input: CharStream) {
		super(input);
		this._interp = new LexerATNSimulator(this, SqlSealLangLexer._ATN, SqlSealLangLexer.DecisionsToDFA, new PredictionContextCache());
	}

	public get grammarFileName(): string { return "SqlSealLang.g4"; }

	public get literalNames(): (string | null)[] { return SqlSealLangLexer.literalNames; }
	public get symbolicNames(): (string | null)[] { return SqlSealLangLexer.symbolicNames; }
	public get ruleNames(): string[] { return SqlSealLangLexer.ruleNames; }

	public get serializedATN(): number[] { return SqlSealLangLexer._serializedATN; }

	public get channelNames(): string[] { return SqlSealLangLexer.channelNames; }

	public get modeNames(): string[] { return SqlSealLangLexer.modeNames; }

	public static readonly _serializedATN: number[] = [4,0,13,80,6,-1,2,0,7,
	0,2,1,7,1,2,2,7,2,2,3,7,3,2,4,7,4,2,5,7,5,2,6,7,6,2,7,7,7,2,8,7,8,2,9,7,
	9,2,10,7,10,2,11,7,11,2,12,7,12,1,0,1,0,1,1,1,1,1,2,1,2,1,3,1,3,1,4,1,4,
	1,4,1,4,1,4,1,4,1,5,1,5,1,5,1,5,1,5,1,6,1,6,1,6,1,6,1,6,1,7,1,7,1,7,1,8,
	1,8,1,8,1,8,1,8,1,8,1,8,1,9,1,9,5,9,64,8,9,10,9,12,9,67,9,9,1,10,4,10,70,
	8,10,11,10,12,10,71,1,11,4,11,75,8,11,11,11,12,11,76,1,12,1,12,0,0,13,1,
	1,3,2,5,3,7,4,9,5,11,6,13,7,15,8,17,9,19,10,21,11,23,12,25,13,1,0,4,3,0,
	65,90,95,95,97,122,4,0,48,57,65,90,95,95,97,122,5,0,45,57,65,90,92,92,95,
	95,97,122,3,0,9,10,13,13,32,32,82,0,1,1,0,0,0,0,3,1,0,0,0,0,5,1,0,0,0,0,
	7,1,0,0,0,0,9,1,0,0,0,0,11,1,0,0,0,0,13,1,0,0,0,0,15,1,0,0,0,0,17,1,0,0,
	0,0,19,1,0,0,0,0,21,1,0,0,0,0,23,1,0,0,0,0,25,1,0,0,0,1,27,1,0,0,0,3,29,
	1,0,0,0,5,31,1,0,0,0,7,33,1,0,0,0,9,35,1,0,0,0,11,41,1,0,0,0,13,46,1,0,
	0,0,15,51,1,0,0,0,17,54,1,0,0,0,19,61,1,0,0,0,21,69,1,0,0,0,23,74,1,0,0,
	0,25,78,1,0,0,0,27,28,5,61,0,0,28,2,1,0,0,0,29,30,5,40,0,0,30,4,1,0,0,0,
	31,32,5,41,0,0,32,6,1,0,0,0,33,34,5,44,0,0,34,8,1,0,0,0,35,36,5,84,0,0,
	36,37,5,65,0,0,37,38,5,66,0,0,38,39,5,76,0,0,39,40,5,69,0,0,40,10,1,0,0,
	0,41,42,5,102,0,0,42,43,5,105,0,0,43,44,5,108,0,0,44,45,5,101,0,0,45,12,
	1,0,0,0,46,47,5,87,0,0,47,48,5,73,0,0,48,49,5,84,0,0,49,50,5,72,0,0,50,
	14,1,0,0,0,51,52,5,65,0,0,52,53,5,83,0,0,53,16,1,0,0,0,54,55,5,83,0,0,55,
	56,5,69,0,0,56,57,5,76,0,0,57,58,5,69,0,0,58,59,5,67,0,0,59,60,5,84,0,0,
	60,18,1,0,0,0,61,65,7,0,0,0,62,64,7,1,0,0,63,62,1,0,0,0,64,67,1,0,0,0,65,
	63,1,0,0,0,65,66,1,0,0,0,66,20,1,0,0,0,67,65,1,0,0,0,68,70,7,2,0,0,69,68,
	1,0,0,0,70,71,1,0,0,0,71,69,1,0,0,0,71,72,1,0,0,0,72,22,1,0,0,0,73,75,7,
	3,0,0,74,73,1,0,0,0,75,76,1,0,0,0,76,74,1,0,0,0,76,77,1,0,0,0,77,24,1,0,
	0,0,78,79,9,0,0,0,79,26,1,0,0,0,4,0,65,71,76,0];

	private static __ATN: ATN;
	public static get _ATN(): ATN {
		if (!SqlSealLangLexer.__ATN) {
			SqlSealLangLexer.__ATN = new ATNDeserializer().deserialize(SqlSealLangLexer._serializedATN);
		}

		return SqlSealLangLexer.__ATN;
	}


	static DecisionsToDFA = SqlSealLangLexer._ATN.decisionToState.map( (ds: DecisionState, index: number) => new DFA(ds, index) );
}