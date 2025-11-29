import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
console.log('pdf-parse loaded via require:', typeof pdfParse);
