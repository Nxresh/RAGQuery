import http from 'http';
import fs from 'fs';
import path from 'path';

const filePath = 'test.pdf';
const fileStat = fs.statSync(filePath);
const boundary = '--------------------------' + Date.now().toString(16);

const request = http.request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/upload',
    method: 'POST',
    headers: {
        'Content-Type': 'multipart/form-data; boundary=' + boundary,
    }
}, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        console.log('Status:', res.statusCode);
        console.log('Body:', data);
    });
});

request.on('error', (e) => console.error('Request error:', e));

// Multipart body construction
request.write(`--${boundary}\r\n`);
request.write(`Content-Disposition: form-data; name="file"; filename="test.pdf"\r\n`);
request.write(`Content-Type: application/pdf\r\n\r\n`);

const fileStream = fs.createReadStream(filePath);
fileStream.pipe(request, { end: false });

fileStream.on('end', () => {
    request.write(`\r\n--${boundary}--\r\n`);
    request.end();
});
