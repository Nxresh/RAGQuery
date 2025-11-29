// Test semantic search with a comprehensive document
async function testSemanticSearch() {
    try {
        const testDocument = `
Machine Learning Overview

Machine learning is a subset of artificial intelligence that enables computers to learn from data without being explicitly programmed.

Key Concepts:
1. Supervised Learning: The algorithm learns from labeled training data
2. Unsupervised Learning: The algorithm finds patterns in unlabeled data
3. Reinforcement Learning: The algorithm learns through trial and error

Applications:
- Image recognition and computer vision
- Natural language processing and text analysis
- Recommendation systems for e-commerce
- Fraud detection in financial services
- Autonomous vehicles and robotics
- Medical diagnosis and drug discovery

Benefits:
- Automates repetitive tasks
- Improves accuracy over time
- Handles large datasets efficiently
- Discovers hidden patterns
- Makes predictions on new data

Challenges:
- Requires large amounts of quality data
- Can be computationally expensive
- Risk of bias in training data
- Difficulty in explaining decisions
- Privacy and security concerns

Future Trends:
The field is rapidly evolving with advances in deep learning, neural networks, and quantum computing.
`;

        // Test with a semantic query (not exact keywords)
        const testQuery = "What are the main advantages and disadvantages?";

        console.log('='.repeat(80));
        console.log('TESTING SEMANTIC SEARCH');
        console.log('='.repeat(80));
        console.log('\nDocument length:', testDocument.length, 'characters');
        console.log('Query:', testQuery);
        console.log('\nSending request...\n');

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
        console.log('\n' + '='.repeat(80));
        console.log('SYNTHESIZED ANSWER');
        console.log('='.repeat(80));
        console.log(data.synthesizedAnswer);
        console.log('\n' + '='.repeat(80));
        console.log('RANKED CHUNKS');
        console.log('='.repeat(80));
        data.rankedChunks.forEach((chunk, i) => {
            console.log(`\nChunk ${i + 1} (Relevance: ${chunk.relevanceScore}%):`);
            console.log(chunk.chunkText.substring(0, 200) + '...');
        });

        console.log('\n' + '='.repeat(80));
        if (data.synthesizedAnswer && !data.synthesizedAnswer.includes('failed')) {
            console.log('✅ SEMANTIC SEARCH IS WORKING!');
            console.log('✅ Found', data.rankedChunks.length, 'relevant chunks');
            console.log('✅ Top relevance:', data.rankedChunks[0]?.relevanceScore + '%');
        } else {
            console.log('❌ SEMANTIC SEARCH FAILED');
        }
        console.log('='.repeat(80));

    } catch (error) {
        console.error('ERROR:', error.message);
        console.error(error.stack);
    }
}

testSemanticSearch();
