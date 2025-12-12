import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const https = require('https');
const fs = require('fs');

const videoId = 'gX8s25991ac'; // TED Talk

function parseCookies(filePath) {
    if (!fs.existsSync(filePath)) return '';
    const content = fs.readFileSync(filePath, 'utf8');

    const cookieMap = {};
    const regex = /([^\t\n]+)\t([^\t\n]+)\t([^\t\n]+)\t([^\t\n]+)\t([^\t\n]+)\t([^\t\n]+)\t([^\t\n]+)/g;

    let match;
    while ((match = regex.exec(content)) !== null) {
        const name = match[6];
        const value = match[7].trim();
        cookieMap[name] = value;
    }

    const cookies = [];
    for (const name in cookieMap) {
        cookies.push(`${name}=${cookieMap[name]}`);
    }
    return cookies.join('; ');
}

const cookieHeader = parseCookies('cookies.txt');
console.log('Cookie Header Length:', cookieHeader.length);

const options = {
    hostname: 'www.youtube.com',
    path: `/watch?v=${videoId}`,
    method: 'GET',
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Cookie': cookieHeader,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
    }
};

const req = https.request(options, (res) => {
    console.log('Status Code:', res.statusCode);
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        console.log('HTML Length:', data.length);
        if (data.includes('captionTracks')) {
            console.log('Success! Found captionTracks.');
            const match = data.match(/"captionTracks":(\[.*?\])/);
            if (match) {
                console.log('Captions JSON:', match[1].substring(0, 100) + '...');
            }
        } else if (data.includes('Sign in to confirm')) {
            console.log('Failed: Sign in required.');
        } else if (data.includes('Video unavailable')) {
            console.log('Failed: Video unavailable.');
        } else {
            console.log('Failed: captionTracks not found.');
            // Dump snippet
            console.log('Snippet:', data.substring(0, 500));
        }
    });
});

req.on('error', (e) => {
    console.error('Request Error:', e);
});

req.end();
