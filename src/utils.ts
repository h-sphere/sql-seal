
import { get } from "https"
import { parse } from 'json5'
import * as fs from 'fs'
import { camelCase } from "lodash";

export const fetchBlobData = async (url: string, filePath: string) => {
    return new Promise<void>((resolve, reject) => {
        get(url, (response) => {
        const statusCode = response.statusCode;
        const contentType = response.headers['content-type'];
    
        let error;
        if (statusCode === 301 || statusCode === 302) {
            // Handle redirect
            const redirectUrl = response.headers.location;
            if (!redirectUrl) { 
                reject('Redirect URL not found')
                return;
            }
            fetchBlobData(redirectUrl, filePath).then(resolve).catch(reject);
            return;
          }
        if (statusCode !== 200) {
            error = new Error(`Request Failed. Status Code: ${statusCode}`);
        } else if (!/^application\/octet-stream/.test(contentType ?? '')) {
            error = new Error(`Invalid content-type. Expected application/octet-stream but received ${contentType}`);
        }
        if (error) {
            console.error(error.message);
            // Consume response data to free up memory
            response.resume();
            return;
        }
    
        const fileStream = fs.createWriteStream(filePath);
        response.pipe(fileStream);
    
        fileStream.on('finish', () => {
            resolve()
            fileStream.close()
        });
    
        fileStream.on('error', (err) => {
            console.error(`Error writing to ${filePath}: ${err}`);
            reject(`Error writing to ${filePath}: ${err}`)
        });
        }).on('error', (err) => {
        console.error(`Error fetching blob data: ${err.message}`);
        reject(`Error writing to ${filePath}: ${err}`)
        });
    })
  };
export const predictType = (field: string, data: Array<Record<string, string | Object>>) => {

    if (field === 'id') {
        return 'TEXT'
    }

    const d = data.map(d => d[field])

    // CHECK JSONS.
    const isObject = d.reduce((acc, d) => acc && (!d || typeof d === 'object'), true)
    if (isObject) {
        return 'JSON'
    }

    const canBeNumber = data.reduce((acc, d) => acc && isNumeric(d[field] as string), true)
    if (canBeNumber) {

        // Check if Integer or Float
        const canBeInteger = data.reduce((acc, d) => acc && parseFloat(d[field] as string) === parseInt(d[field] as string), true)
        if (canBeInteger) {
            return 'INTEGER'
        }

        return 'REAL'
    }
    return 'TEXT'
}

export type FieldTypes = ReturnType<typeof predictType>


export const predictJson = (data: Array<Record<string, unknown>>) => {
    return data.map(d => Object.keys(d).reduce((o, k) => {
        if (typeof d[k] !== 'string') {
            return {
                ...o,
                [k]: d[k]
            }
        }
        const v = (d[k] as string).trim()
        if ((v.at(0) == '[' && v.at(-1) === ']') || (v.at(0) === '{' && v.at(-1) === '}')) {
            try {
                const d = parse(v)
                return {
                    ...o,
                    [k]: d
                }
            } catch (e) {
            }
        }
        return {
            ...o,
            [k]: d[k]
        }
    }, {}))
}


export function isNumeric(str: string) {
    if (typeof str != "string") return false // we only process strings!  
    return !isNaN(str as any) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
        !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
}

export function dataToCamelCase(data: Array<Record<string, unknown>>) {
    return data.map(d => Object.keys(d).reduce((acc, k) => ({
        ...acc,
        [camelCase(k)]: d[k]
    }), {}))
}


export const toTypeStatements = (header: Array<string>, data: Array<Record<string, string>>) => {
    let d: Array<Record<string, string | number>> = data
    const types: Record<string, ReturnType<typeof predictType>> = {}
    header.forEach(key => {
        const type = predictType(key, data)
        if (type === 'REAL' || type === 'INTEGER') {
            // converting all data here to text
            d = d.map(record => ({
                ...record,
                [key]: type === 'REAL'
                    ? parseFloat(record[key] as string)
                    : parseInt(record[key] as string)
            }))
        }

        types[key] = type
    })

    return {
        data: d,
        types
    }
}