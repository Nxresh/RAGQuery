// Test file upload
import FormData from 'form-data';
import fs from 'fs';

async function testUpload() {
    try {
        // Create a test file
        const testContent = `Machine Learning Overview

Machine learning is a subset of artificial intelligence that enables computers to learn from data.

Key Takeaways:
1. It uses algorithms to identify patterns in data
2. It improves performance over time with more data
3. It can make predictions on new, unseen data
4. Common applications include image recognition and NLP
`;

        fs.writeFileSync('test_document.txt', testContent);

        const formData = new FormData();
        formData.append('file', fs.createReadStream('test_document.txt'));

        console.log('Uploading test file...\n');

        const response = await fetch('http://localhost:3000/api/upload', {
            method: 'POST',
            body: formData,
            headers: formData.getHeaders()
        });

        const data = await response.json();

        console.log('='.repeat(80));
        console.log('UPLOAD RESPONSE:');
        console.log('='.repeat(80));
        console.log('Status:', response.status);
        console.log('ID:', data.id);
        console.log('Title:', data.title);
        console.log('\nContent Preview:');
        console.log(data.content.substring(0, 200));
        console.log('\nContent Length:', data.content.length);

    } catch (error) {
        console.error('ERROR:', error.message);
    }
}

testUpload();
