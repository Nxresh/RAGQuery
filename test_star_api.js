async function testStar() {
    const baseUrl = 'http://localhost:3000';
    const userId = 'test-user-star';

    console.log('1. Creating starred document...');
    try {
        const createRes = await fetch(`${baseUrl}/api/documents`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-User-Id': userId
            },
            body: JSON.stringify({
                title: 'Starred Test Doc',
                content: 'This is a test content',
                type: 'text',
                isStarred: true
            })
        });

        const createData = await createRes.json();
        console.log('Create Response:', createData);

        console.log('2. Fetching documents...');
        const listRes = await fetch(`${baseUrl}/api/documents`, {
            headers: {
                'X-User-Id': userId
            }
        });

        const listData = await listRes.json();
        const doc = listData.documents.find(d => d.id === createData.id);

        console.log('Fetched Document:', doc);

        if (doc && doc.is_starred === true) {
            console.log('✅ SUCCESS: Document is starred.');
        } else {
            console.log('❌ FAILURE: Document is NOT starred or field is missing.');
            console.log('is_starred value:', doc ? doc.is_starred : 'N/A');
        }
    } catch (err) {
        console.error('Test failed:', err);
    }
}

testStar();
