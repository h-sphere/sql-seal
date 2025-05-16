// export type ColumnType = 'auto' | 'text' | 'number'
export type ColumnType = string

export interface ColumnDefinition {
    name: string;
    type: ColumnType
}