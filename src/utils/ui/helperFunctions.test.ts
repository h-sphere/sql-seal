import { isLinkLocal, isLinktext, removeExtension } from './helperFunctions';

describe('helperFunctions', () => {
    describe('isLinkLocal', () => {
        it('should return true for local links', () => {
            expect(isLinkLocal('local/file.md')).toBe(true);
            expect(isLinkLocal('folder/file')).toBe(true);
            expect(isLinkLocal('file')).toBe(true);
        });

        it('should return false for http links', () => {
            expect(isLinkLocal('http://example.com')).toBe(false);
            expect(isLinkLocal('https://example.com')).toBe(false);
        });

        it('should handle empty or undefined input', () => {
            expect(isLinkLocal('')).toBe(true);
            expect(isLinkLocal(undefined as any)).toBe(true);
        });
    });

    describe('isLinktext', () => {
        it('should return true for valid linktext format', () => {
            expect(isLinktext('[[file]]')).toBe(true);
            expect(isLinktext('[[folder/file]]')).toBe(true);
            expect(isLinktext('[[file with spaces]]')).toBe(true);
        });

        it('should return false for invalid linktext format', () => {
            expect(isLinktext('file')).toBe(false);
            expect(isLinktext('[file]')).toBe(false);
            expect(isLinktext('[[file')).toBe(false);
            expect(isLinktext('file]]')).toBe(false);
        });
    });

    describe('removeExtension', () => {
        it('should remove recognized file extensions', () => {
            expect(removeExtension('file.md')).toBe('file');
            expect(removeExtension('document.csv')).toBe('document');
            expect(removeExtension('data.json')).toBe('data');
            expect(removeExtension('config.json5')).toBe('config');
        });

        it('should handle files with multiple dots', () => {
            expect(removeExtension('my.file.md')).toBe('my.file');
            expect(removeExtension('config.min.js')).toBe('config.min.js'); // .js is not recognized
        });

        it('should return original filename if no extension', () => {
            expect(removeExtension('file')).toBe('file');
            expect(removeExtension('document')).toBe('document');
        });

        it('should handle filenames starting with dot', () => {
            expect(removeExtension('.gitignore')).toBe('.gitignore');
        });

        it('should not remove unrecognized extensions', () => {
            expect(removeExtension('this.com')).toBe('this.com');
            expect(removeExtension('this.com.md')).toBe('this.com');
            expect(removeExtension('file.txt')).toBe('file.txt');
            expect(removeExtension('image.jpg')).toBe('image.jpg');
            expect(removeExtension('script.js')).toBe('script.js');
        });
    });
}); 