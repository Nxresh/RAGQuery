// No import needed for fetch in Node 22+

async function testYoutubeEndpoint() {
    const url = 'http://localhost:3000/api/process/youtube';
    const body = {
        url: 'https://www.youtube.com/watch?v=jNQXAC9IVRw' // Me at the zoo
    };

    console.log(`Testing POST ${url}`);
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        console.log(`Status: ${response.status}`);
        const data = await response.json();
        console.log('Response:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error:', error);
    }
}

testYoutubeEndpoint();
