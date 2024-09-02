grammar SqlSealLang;

parse
 : statement+ EOF
 ;

statement
 : tableStatement
 | queryStatement
 ;

tableStatement
 : TABLE WS+ ID WS* '=' WS* FILE WS* '(' WS* FILE_URL WS* ')' WS*
 ;

queryStatement
 : withClause? selectStatement WS*
 ;

withClause
 : WITH WS+ cteDefinition (WS* ',' WS* cteDefinition)* WS*
 ;

cteDefinition
 : ID WS+ AS WS* '(' WS* selectStatement WS* ')'
 ;

selectStatement
 : SELECT WS+ selectBody
 ;

selectBody
 : .*?
 ;

TABLE : 'TABLE';
FILE : 'file';
WITH : 'WITH';
AS : 'AS';
SELECT : 'SELECT';

ID : [a-zA-Z_][a-zA-Z_0-9]*;
FILE_URL : [a-zA-Z0-9_./\\-]+;
WS : [ \t\r\n]+;

// Catch-all rule for any other character
ANY : .;