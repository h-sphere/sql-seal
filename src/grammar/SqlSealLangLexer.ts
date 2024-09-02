// Generated from SqlSealLang.g4 by ANTLR 4.9.0-SNAPSHOT


import { ATN } from "antlr4ts/atn/ATN";
import { ATNDeserializer } from "antlr4ts/atn/ATNDeserializer";
import { CharStream } from "antlr4ts/CharStream";
import { Lexer } from "antlr4ts/Lexer";
import { LexerATNSimulator } from "antlr4ts/atn/LexerATNSimulator";
import { NotNull } from "antlr4ts/Decorators";
import { Override } from "antlr4ts/Decorators";
import { RuleContext } from "antlr4ts/RuleContext";
import { Vocabulary } from "antlr4ts/Vocabulary";
import { VocabularyImpl } from "antlr4ts/VocabularyImpl";

import * as Utils from "antlr4ts/misc/Utils";


export class SqlSealLangLexer extends Lexer {
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

	// tslint:disable:no-trailing-whitespace
	public static readonly channelNames: string[] = [
		"DEFAULT_TOKEN_CHANNEL", "HIDDEN",
	];

	// tslint:disable:no-trailing-whitespace
	public static readonly modeNames: string[] = [
		"DEFAULT_MODE",
	];

	public static readonly ruleNames: string[] = [
		"T__0", "T__1", "T__2", "T__3", "TABLE", "FILE", "WITH", "AS", "SELECT", 
		"ID", "FILE_URL", "WS", "ANY",
	];

	private static readonly _LITERAL_NAMES: Array<string | undefined> = [
		undefined, "'='", "'('", "')'", "','", "'TABLE'", "'file'", "'WITH'", 
		"'AS'", "'SELECT'",
	];
	private static readonly _SYMBOLIC_NAMES: Array<string | undefined> = [
		undefined, undefined, undefined, undefined, undefined, "TABLE", "FILE", 
		"WITH", "AS", "SELECT", "ID", "FILE_URL", "WS", "ANY",
	];
	public static readonly VOCABULARY: Vocabulary = new VocabularyImpl(SqlSealLangLexer._LITERAL_NAMES, SqlSealLangLexer._SYMBOLIC_NAMES, []);

	// @Override
	// @NotNull
	public get vocabulary(): Vocabulary {
		return SqlSealLangLexer.VOCABULARY;
	}
	// tslint:enable:no-trailing-whitespace


	constructor(input: CharStream) {
		super(input);
		this._interp = new LexerATNSimulator(SqlSealLangLexer._ATN, this);
	}

	// @Override
	public get grammarFileName(): string { return "SqlSealLang.g4"; }

	// @Override
	public get ruleNames(): string[] { return SqlSealLangLexer.ruleNames; }

	// @Override
	public get serializedATN(): string { return SqlSealLangLexer._serializedATN; }

	// @Override
	public get channelNames(): string[] { return SqlSealLangLexer.channelNames; }

	// @Override
	public get modeNames(): string[] { return SqlSealLangLexer.modeNames; }

	public static readonly _serializedATN: string =
		"\x03\uC91D\uCABA\u058D\uAFBA\u4F53\u0607\uEA8B\uC241\x02\x0FR\b\x01\x04" +
		"\x02\t\x02\x04\x03\t\x03\x04\x04\t\x04\x04\x05\t\x05\x04\x06\t\x06\x04" +
		"\x07\t\x07\x04\b\t\b\x04\t\t\t\x04\n\t\n\x04\v\t\v\x04\f\t\f\x04\r\t\r" +
		"\x04\x0E\t\x0E\x03\x02\x03\x02\x03\x03\x03\x03\x03\x04\x03\x04\x03\x05" +
		"\x03\x05\x03\x06\x03\x06\x03\x06\x03\x06\x03\x06\x03\x06\x03\x07\x03\x07" +
		"\x03\x07\x03\x07\x03\x07\x03\b\x03\b\x03\b\x03\b\x03\b\x03\t\x03\t\x03" +
		"\t\x03\n\x03\n\x03\n\x03\n\x03\n\x03\n\x03\n\x03\v\x03\v\x07\vB\n\v\f" +
		"\v\x0E\vE\v\v\x03\f\x06\fH\n\f\r\f\x0E\fI\x03\r\x06\rM\n\r\r\r\x0E\rN" +
		"\x03\x0E\x03\x0E\x02\x02\x02\x0F\x03\x02\x03\x05\x02\x04\x07\x02\x05\t" +
		"\x02\x06\v\x02\x07\r\x02\b\x0F\x02\t\x11\x02\n\x13\x02\v\x15\x02\f\x17" +
		"\x02\r\x19\x02\x0E\x1B\x02\x0F\x03\x02\x06\x05\x02C\\aac|\x06\x022;C\\" +
		"aac|\x07\x02/;C\\^^aac|\x05\x02\v\f\x0F\x0F\"\"\x02T\x02\x03\x03\x02\x02" +
		"\x02\x02\x05\x03\x02\x02\x02\x02\x07\x03\x02\x02\x02\x02\t\x03\x02\x02" +
		"\x02\x02\v\x03\x02\x02\x02\x02\r\x03\x02\x02\x02\x02\x0F\x03\x02\x02\x02" +
		"\x02\x11\x03\x02\x02\x02\x02\x13\x03\x02\x02\x02\x02\x15\x03\x02\x02\x02" +
		"\x02\x17\x03\x02\x02\x02\x02\x19\x03\x02\x02\x02\x02\x1B\x03\x02\x02\x02" +
		"\x03\x1D\x03\x02\x02\x02\x05\x1F\x03\x02\x02\x02\x07!\x03\x02\x02\x02" +
		"\t#\x03\x02\x02\x02\v%\x03\x02\x02\x02\r+\x03\x02\x02\x02\x0F0\x03\x02" +
		"\x02\x02\x115\x03\x02\x02\x02\x138\x03\x02\x02\x02\x15?\x03\x02\x02\x02" +
		"\x17G\x03\x02\x02\x02\x19L\x03\x02\x02\x02\x1BP\x03\x02\x02\x02\x1D\x1E" +
		"\x07?\x02\x02\x1E\x04\x03\x02\x02\x02\x1F \x07*\x02\x02 \x06\x03\x02\x02" +
		"\x02!\"\x07+\x02\x02\"\b\x03\x02\x02\x02#$\x07.\x02\x02$\n\x03\x02\x02" +
		"\x02%&\x07V\x02\x02&\'\x07C\x02\x02\'(\x07D\x02\x02()\x07N\x02\x02)*\x07" +
		"G\x02\x02*\f\x03\x02\x02\x02+,\x07h\x02\x02,-\x07k\x02\x02-.\x07n\x02" +
		"\x02./\x07g\x02\x02/\x0E\x03\x02\x02\x0201\x07Y\x02\x0212\x07K\x02\x02" +
		"23\x07V\x02\x0234\x07J\x02\x024\x10\x03\x02\x02\x0256\x07C\x02\x0267\x07" +
		"U\x02\x027\x12\x03\x02\x02\x0289\x07U\x02\x029:\x07G\x02\x02:;\x07N\x02" +
		"\x02;<\x07G\x02\x02<=\x07E\x02\x02=>\x07V\x02\x02>\x14\x03\x02\x02\x02" +
		"?C\t\x02\x02\x02@B\t\x03\x02\x02A@\x03\x02\x02\x02BE\x03\x02\x02\x02C" +
		"A\x03\x02\x02\x02CD\x03\x02\x02\x02D\x16\x03\x02\x02\x02EC\x03\x02\x02" +
		"\x02FH\t\x04\x02\x02GF\x03\x02\x02\x02HI\x03\x02\x02\x02IG\x03\x02\x02" +
		"\x02IJ\x03\x02\x02\x02J\x18\x03\x02\x02\x02KM\t\x05\x02\x02LK\x03\x02" +
		"\x02\x02MN\x03\x02\x02\x02NL\x03\x02\x02\x02NO\x03\x02\x02\x02O\x1A\x03" +
		"\x02\x02\x02PQ\v\x02\x02\x02Q\x1C\x03\x02\x02\x02\x06\x02CIN\x02";
	public static __ATN: ATN;
	public static get _ATN(): ATN {
		if (!SqlSealLangLexer.__ATN) {
			SqlSealLangLexer.__ATN = new ATNDeserializer().deserialize(Utils.toCharArray(SqlSealLangLexer._serializedATN));
		}

		return SqlSealLangLexer.__ATN;
	}

}

