// Test script to reproduce the file upload error
import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const API_URL = 'http://localhost:3000';

async function testFileUpload() {
    console.log('=== Testing File Upload ===\n');

    // Create a test PDF file if it doesn't exist
    const testFilePath = path.join(process.cwd(), 'test.pdf');
    if (!fs.existsSync(testFilePath)) {
        // Create a minimal PDF
        const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/Resources <<
/Font <<
/F1 <<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
>>
>>
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj
4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(Test PDF) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000317 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
410
%%EOF`;
        fs.writeFileSync(testFilePath, pdfContent);
        console.log('✓ Created test PDF file');
    }

    try {
        const formData = new FormData();
        formData.append('file', fs.createReadStream(testFilePath), {
            filename: 'test.pdf',
            contentType: 'application/pdf'
        });

        console.log('Uploading file to /api/upload...');
        const response = await fetch(`${API_URL}/api/upload`, {
            method: 'POST',
            body: formData,
            headers: formData.getHeaders()
        });

        console.log(`Status: ${response.status} ${response.statusText}`);

        const responseText = await response.text();
        console.log('Response:', responseText);

        if (!response.ok) {
            console.error('\n❌ Upload failed!');
            console.error('Response body:', responseText);
            return false;
        }

        console.log('\n✅ Upload successful!');
        return true;

    } catch (error) {
        console.error('\n❌ Error during upload:');
        console.error(error.message);
        if (error.cause) {
            console.error('Cause:', error.cause);
        }
        return false;
    }
}

// Run the test
testFileUpload().then(success => {
    process.exit(success ? 0 : 1);
});
