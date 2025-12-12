import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const https = require('https');

const videoId = 'gX8s25991ac'; // TED Talk

const instances = [
    'https://inv.tux.pizza',
    'https://invidious.projectsegfau.lt',
    'https://invidious.fdn.fr',
    'https://vid.puffyan.us',
    'https://yewtu.be',
    'https://invidious.kavin.rocks',
    'https://invidious.drgns.space'
];

async function fetchJson(url) {
    return new Promise((resolve, reject) => {
        const req = https.get(url, { timeout: 10000 }, (res) => {
            if (res.statusCode !== 200) {
                res.resume();
                reject(new Error(`Status ${res.statusCode}`));
                return;
            }
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        });
        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Timeout'));
        });
    });
}

(async () => {
    console.log(`Testing Invidious instances for video ${videoId}...`);

    for (const instance of instances) {
        console.log(`\nTrying ${instance}...`);
        try {
            // Try to get captions metadata
            const apiUrl = `${instance}/api/v1/captions/${videoId}`;
            console.log(`Fetching ${apiUrl}`);

            const captions = await fetchJson(apiUrl);
            console.log(`Success! Found ${captions.captions ? captions.captions.length : 0} caption tracks.`);

            if (captions.captions && captions.captions.length > 0) {
                // Find English
                const enTrack = captions.captions.find(c => c.languageCode === 'en' || c.label.includes('English'));
                if (enTrack) {
                    console.log('Found English track:', enTrack);
                    const trackUrl = `${instance}${enTrack.url}`;
                    console.log(`Fetching transcript from ${trackUrl}`);

                    // Fetch the actual VTT/JSON
                    // Note: Invidious returns VTT usually, need to check format
                    // But just proving we can reach it is enough for now.
                    process.exit(0);
                }
            }

        } catch (error) {
            console.log(`Failed: ${error.message}`);
        }
    }

    console.log('\nAll instances failed.');
})();
