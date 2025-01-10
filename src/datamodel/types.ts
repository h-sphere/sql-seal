import { SourceType } from "src/grammar/newParser";

export interface TableRegistration {
    fileName: string;
    aliasName: string;
    sourceFile: string;
    type: SourceType;
    extras: any;
}