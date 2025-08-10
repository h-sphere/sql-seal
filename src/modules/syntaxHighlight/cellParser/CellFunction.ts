import { CellParserResult } from "./ModernCellParser";

export interface CellFunction<T = unknown> {
     get name(): string;
     get sqlFunctionArgumentsCount(): number;
     prepare(content: T): CellParserResult;
     renderAsString(content: T): string;
}