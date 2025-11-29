// Test RAG endpoint with the new model
async function testRAG() {
    try {
        const testDocument = `
Machine learning is a subset of artificial intelligence. 
Key takeaways include:
1. It uses algorithms to learn from data
2. It improves with more data
3. Common applications include image recognition and NLP
`;

        const testQuery = "What are the key takeaways?";

        console.log('Testing RAG endpoint...\n');

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

        console.log('Status:', response.status);
        console.log('\n=== SYNTHESIZED ANSWER ===');
        console.log(data.synthesizedAnswer);
        console.log('\n=== RANKED CHUNKS ===');
        console.log(JSON.stringify(data.rankedChunks, null, 2));

        if (data.synthesizedAnswer && !data.synthesizedAnswer.includes('failed to generate')) {
            console.log('\n✅ RAG IS WORKING!');
        } else {
            console.log('\n❌ RAG STILL FAILING');
        }

    } catch (error) {
        console.error('ERROR:', error.message);
    }
}

testRAG();
