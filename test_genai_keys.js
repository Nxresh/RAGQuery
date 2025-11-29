const GenAI = await import('@google/genai');
const keys = Object.keys(GenAI);
console.log('Has SchemaType:', keys.includes('SchemaType'));
console.log('Has Type:', keys.includes('Type'));
console.log('All keys:', keys.join(', '));
