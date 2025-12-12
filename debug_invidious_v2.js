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
    'https://invidious.drgns.space',
    'https://yt.artemislena.eu'
];

async function fetchJson(url) {
    return new Promise((resolve, reject) => {
        const req = https.get(url, { timeout: 8000 }, (res) => {
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
    console.log(`Testing Invidious V2 (Video Info) for ${videoId}...`);

    for (const instance of instances) {
        console.log(`\nChecking ${instance}...`);
        try {
            const apiUrl = `${instance}/api/v1/videos/${videoId}`;
            console.log(`Fetching ${apiUrl}`);

            const videoInfo = await fetchJson(apiUrl);

            if (videoInfo.captions && videoInfo.captions.length > 0) {
                console.log(`Success! Found ${videoInfo.captions.length} captions.`);
                const enTrack = videoInfo.captions.find(c => c.label.includes('English') || c.languageCode === 'en');

                if (enTrack) {
                    console.log('Found English track:', enTrack);
                    const captionUrl = `${instance}${enTrack.url}`;
                    console.log(`Caption URL: ${captionUrl}`);
                    process.exit(0);
                }
            } else {
                console.log('No captions found in video info.');
            }

        } catch (error) {
            console.log(`Failed: ${error.message}`);
        }
    }

    console.log('\nAll instances failed.');
})();
