async function testAres() {
    try {
        const response = await fetch('http://localhost:3000/api/chat/ares', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: 'Hello, who are you?' })
        });

        console.log(`Status: ${response.status} ${response.statusText}`);
        const text = await response.text();
        console.log('Body:', text);
        try {
            const json = JSON.parse(text);
            console.log('Error Details:', JSON.stringify(json, null, 2));
        } catch (e) {
            console.log('Raw Body:', text);
        }
    } catch (error) {
        console.error('Network Error:', error);
    }
}

testAres();
