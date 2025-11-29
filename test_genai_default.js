const GenAI = await import('@google/genai');
console.log('Default keys:', Object.keys(GenAI.default || {}));
console.log('Has Type in default:', !!GenAI.default?.Type);
console.log('Has SchemaType in default:', !!GenAI.default?.SchemaType);
