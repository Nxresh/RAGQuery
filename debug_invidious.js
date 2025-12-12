import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const https = require('https');

const videoId = 'gX8s25991ac'; // TED Talk
const instance = 'https://inv.tux.pizza'; // Reliable public instance
const url = `${instance}/api/v1/captions/${videoId}`;

console.log(`Fetching captions from ${url}...`);

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        try {
            const json = JSON.parse(data);
            if (json.captions) {
                console.log(`Found ${json.captions.length} caption tracks.`);
                // Find English track
                const enTrack = json.captions.find(c => c.label.startsWith('English') || c.language === 'en');
                if (enTrack) {
                    console.log('English track found:', enTrack.url);
                    // Fetch the actual VTT/JSON content
                    const trackUrl = `${instance}${enTrack.url}`;
                    console.log(`Fetching track content from ${trackUrl}...`);

                    https.get(trackUrl, (res2) => {
                        let data2 = '';
                        res2.on('data', (chunk) => data2 += chunk);
                        res2.on('end', () => {
                            console.log('Track content preview:', data2.substring(0, 200));
                        });
                    });
                } else {
                    console.log('No English track found.');
                }
            } else {
                console.log('No captions field in response:', data.substring(0, 200));
            }
        } catch (e) {
            console.error('Error parsing JSON:', e);
            console.log('Raw data:', data.substring(0, 200));
        }
    });
}).on('error', (e) => {
    console.error('Error:', e);
});
