// const fetch = require('node-fetch'); // Built-in fetch in Node 18+

async function testRag() {
    try {
        const response = await fetch('http://localhost:5190/api/proxy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'rag',
                payload: {
                    documentContent: "This is a test document about RAGQuery. It is a tool for querying documents.",
                    query: "What is RAGQuery?"
                }
            })
        });

        console.log('Status:', response.status);
        const data = await response.json();
        console.log('Response:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error:', error);
    }
}

testRag();
