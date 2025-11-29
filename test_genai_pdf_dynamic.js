import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

const { GoogleGenAI, SchemaType } = await import('@google/genai');

console.log('Loaded both dynamically');
