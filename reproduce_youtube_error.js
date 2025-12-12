// Native fetch for Node 18+
async function testYouTube() {
    const url = 'http://localhost:5190/api/process/youtube';
    const body = {
        url: 'https://www.youtube.com/watch?v=gX8s25991ac' // TED Talk (Bill Gates) - definitely has captions
    };

    try {
        console.log('Sending request to:', url);
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const data = await response.json();
        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error:', error);
    }
}

testYouTube();
