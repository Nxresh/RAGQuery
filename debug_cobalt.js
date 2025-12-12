import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const https = require('https');

const videoId = 'gX8s25991ac'; // TED Talk
const url = `https://www.youtube.com/watch?v=${videoId}`;

const postData = JSON.stringify({
    url: url,
    vCodec: 'h264',
    vQuality: '720',
    aFormat: 'mp3',
    isAudioOnly: false
});

const options = {
    hostname: 'api.cobalt.tools',
    path: '/api/json',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
};

console.log('Sending request to Cobalt API...');

const req = https.request(options, (res) => {
    console.log('Status Code:', res.statusCode);
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log('Response:', JSON.stringify(json, null, 2));
        } catch (e) {
            console.log('Raw Response:', data);
        }
    });
});

req.on('error', (e) => {
    console.error('Request Error:', e);
});

req.write(postData);
req.end();
