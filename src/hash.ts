
export function hashString(inputString: string): string {
    // Function to convert a number to alphanumeric character
    function toAlphanumeric(num: number): string {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        return chars[num % chars.length];
    }

    // Function to generate SHA-256 hash
    function sha256(input: string): string {
        // Simple SHA-256 implementation
        function sha256Internal(input: string): string {
            function rightRotate(value: number, shift: number): number {
                return (value >>> shift) | (value << (32 - shift));
            }

            function toHexString(num: number): string {
                let hex = '';
                for (let i = 0; i < 8; i++) {
                    hex += ((num >>> (24 - i * 4)) & 0xf).toString(16);
                }
                return hex;
            }

            const words: number[] = [];
            for (let i = 0; i < input.length * 8; i += 8) {
                words[i >> 5] |= (input.charCodeAt(i / 8) & 0xff) << (24 - i % 32);
            }
            words[input.length >> 2] |= 0x80 << (24 - (input.length % 4) * 8);
            words[((input.length + 64 >> 9) << 4) + 15] = input.length * 8;

            let a = 0x6a09e667;
            let b = 0xbb67ae85;
            let c = 0x3c6ef372;
            let d = 0xa54ff53a;
            let e = 0x510e527f;
            let f = 0x9b05688c;
            let g = 0x1f83d9ab;
            let h = 0x5be0cd19;

            for (let i = 0; i < words.length; i += 16) {
                let aa = a;
                let bb = b;
                let cc = c;
                let dd = d;
                let ee = e;
                let ff = f;
                let gg = g;
                let hh = h;

                for (let j = 0; j < 64; j++) {
                    let T1 = hh + ((ee & ff) | (~ee & gg)) + words[i + j] + K[j];
                    T1 = T1 | 0;
                    let T2 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
                    T2 = T2 | 0;
                    let T3 = (e & f) ^ (~e & g);
                    T3 = T3 | 0;
                    let T4 = h + T1 + T2 + T3 + H[j];
                    T4 = T4 | 0;

                    h = g;
                    g = f;
                    f = e;
                    e = d + T4;
                    e = e | 0;
                    d = c;
                    c = b;
                    b = a;
                    a = T4 + T1;
                    a = a | 0;
                }

                a = a + aa;
                b = b + bb;
                c = c + cc;
                d = d + dd;
                e = e + ee;
                f = f + ff;
                g = g + gg;
                h = h + hh;
            }

            return toHexString(a) + toHexString(b) + toHexString(c) + toHexString(d) +
                toHexString(e) + toHexString(f) + toHexString(g) + toHexString(h);
        }

        // Convert the SHA-256 hash to alphanumeric characters
        function hashToAlphanumeric(hash: string): string {
            return hash.replace(/[^\w]/g, '');
        }

        return hashToAlphanumeric(sha256Internal(input));
    }

    // Constants for SHA-256
    const K = [
        0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
        0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
        0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
        0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
        0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
        0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
        0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
        0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    ];

    const H = [
        0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
    ];

    return sha256(inputString);
}



export const generatePrefix = (prefix: string, tableName: string) => {
    return `TTT${prefix}_${tableName}`
}