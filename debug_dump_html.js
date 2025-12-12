import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const https = require('https');
const fs = require('fs');

const videoId = 'gX8s25991ac'; // TED Talk
const url = `https://www.youtube.com/watch?v=${videoId}&hl=en`;

console.log(`Fetching ${url}...`);

const options = {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
    }
};

https.get(url, options, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        console.log(`Fetched ${data.length} bytes.`);
        fs.writeFileSync('debug_youtube_page.html', data);
        console.log('Saved to debug_youtube_page.html');

        // Quick check for keywords
        if (data.includes('captionTracks')) console.log('Found "captionTracks"!');
        else console.log('"captionTracks" NOT found.');

        if (data.includes('consent')) console.log('Found "consent" keyword (likely blocked).');
    });
}).on('error', (e) => {
    console.error('Error:', e);
});
