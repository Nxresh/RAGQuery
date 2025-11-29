// Test RAG endpoint with file output
const testDocument = `
Machine learning is a subset of artificial intelligence that enables computers to learn from data without being explicitly programmed. 
The key takeaways from machine learning include: 
1. It uses algorithms to identify patterns in data
2. It improves performance over time with more data
3. It can make predictions on new, unseen data
4. Common applications include image recognition, natural language processing, and recommendation systems
`;

const testQuery = "What are the key takeaways from the document?";

async function testRAG() {
    try {
        console.log('Testing RAG endpoint...');
        console.log('Query:', testQuery);

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

        const fs = require('fs');
        const output = {
            status: response.status,
            synthesizedAnswer: data.synthesizedAnswer,
            rankedChunks: data.rankedChunks
        };

        fs.writeFileSync('test_rag_output.json', JSON.stringify(output, null, 2));
        console.log('\nResults written to test_rag_output.json');
        console.log('\nSynthesized Answer:');
        console.log(data.synthesizedAnswer);
    } catch (error) {
        console.error('Error:', error.message);
        console.error(error.stack);
    }
}

testRAG();
