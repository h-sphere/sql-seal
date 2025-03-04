export type ColumnType = 'auto' | 'text' | 'number'

export interface ColumnDefinition {
    name: string;
    type: ColumnType
}