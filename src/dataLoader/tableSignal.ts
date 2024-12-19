import { Signal } from "src/utils/signal";
import { DataTransformerOut } from "./dataTransformer";
import { SqlSealDatabase } from "src/database";
import { FieldTypes } from "src/utils";

export const linkTableWithFile = (dataSig: Signal<DataTransformerOut>, tableSignal: Signal<number>, tableName: string, db: SqlSealDatabase) => {
    return dataSig(({ data, types }) => {

        // Check if the columns are exactly the same. If not, delete and reinstantiate the table.

        // For now always remove and reinstantiate the table
        db.dropTable(tableName)

        // compute the types of the keys
        const columns = Object.entries(types).map(([key, value]) => ({
            name: key,
            type: value as FieldTypes
          }));

        // create table again
        db.createTableClean(tableName, columns)

        // Load all the data
        db.insertData(tableName, data)

        // Here we do the actual update of the table. If it succeeds, we return it with current date to indicate sync time.
        tableSignal(Date.now())
    })
}
