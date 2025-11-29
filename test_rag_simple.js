// Simple RAG test
async function testRAG() {
    try {
        const testDocument = `
Machine learning is a subset of artificial intelligence that enables computers to learn from data without being explicitly programmed. 
The key takeaways from machine learning include: 
1. It uses algorithms to identify patterns in data
2. It improves performance over time with more data
3. It can make predictions on new, unseen data
4. Common applications include image recognition, natural language processing, and recommendation systems
`;

        const testQuery = "What are the key takeaways from the document?";

        console.log('Sending request to RAG endpoint...\n');

        const response = await fetch('http://localhost:3000/api/proxy', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'rag',
                payload: {
                    documentContent: testDocument,
                    query: testQuery
                }
            })
        });

        const data = await response.json();

        console.log('='.repeat(80));
        console.log('SYNTHESIZED ANSWER:');
        console.log('='.repeat(80));
        console.log(data.synthesizedAnswer);
        console.log('\n' + '='.repeat(80));
        console.log('RANKED CHUNKS:');
        console.log('='.repeat(80));
        data.rankedChunks.forEach((chunk, i) => {
            console.log(`\nChunk ${i + 1} (Relevance: ${chunk.relevanceScore}%):`);
            console.log(chunk.chunkText);
        });

    } catch (error) {
        console.error('ERROR:', error.message);
    }
}

testRAG();
