async function testEndpoint() {
    try {
        const response = await fetch('http://localhost:3000/api/generate-mindmap', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ topic: 'Solar System' })
        });

        console.log(`Status: ${response.status} ${response.statusText}`);
        const text = await response.text();
        console.log('Body:', text);
    } catch (error) {
        console.error('Network Error:', error);
    }
}

testEndpoint();
