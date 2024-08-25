
import { get } from "https"
import * as fs from 'fs'
import { isNumeric } from "./database";

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
