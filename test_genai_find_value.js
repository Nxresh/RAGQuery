const GenAI = await import('@google/genai');
for (const [key, value] of Object.entries(GenAI)) {
    if (key === 'Type' || key === 'SchemaType') {
        console.log(`Found ${key}!`);
    }
    if (value && typeof value === 'object') {
        if (value.STRING && value.OBJECT) {
            console.log(`Found likely SchemaType object at key: ${key}`);
        }
    }
}
console.log('Search complete');
