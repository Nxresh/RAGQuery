const GenAI = await import('@google/genai');
console.log('Keys:', Object.keys(GenAI));
console.log('SchemaType directly:', GenAI.SchemaType);
console.log('SchemaType in default:', GenAI.default?.SchemaType);
