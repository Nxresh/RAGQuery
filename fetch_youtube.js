import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { YoutubeTranscript } = require('youtube-transcript');
const https = require('https');

const videoId = process.argv[2];

if (!videoId) {
    console.error(JSON.stringify({ error: 'No video ID provided' }));
    process.exit(1);
}

// Strategy 1: youtube-transcript library
async function tryLibrary(videoId) {
    try {
        const transcript = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' });
        return transcript;
    } catch (e) {
        throw new Error(`Library failed: ${e.message}`);
    }
}

// Strategy 2: Invidious API
function fetchJson(url) {
    return new Promise((resolve, reject) => {
        const options = {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
            timeout: 5000 // 5s timeout
        };
        const req = https.get(url, options, (res) => {
            if (res.statusCode !== 200) {
                res.resume();
                return reject(new Error(`Status ${res.statusCode}`));
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

async function tryInvidious(videoId) {
    const instances = [
        'https://inv.tux.pizza',
        'https://vid.puffyan.us',
        'https://yewtu.be',
        'https://invidious.projectsegfau.lt'
    ];

    for (const instance of instances) {
        try {
            // console.error(`Trying Invidious instance: ${instance}`); // Debug
            const captionsData = await fetchJson(`${instance}/api/v1/captions/${videoId}`);
            const captions = captionsData.captions || [];
            const enTrack = captions.find(c => c.label.startsWith('English') || c.language === 'en');

            if (enTrack) {
                const trackUrl = `${instance}${enTrack.url}`;
                const transcriptData = await fetchJson(trackUrl); // Invidious returns JSON transcript directly
                // Convert to standard format
                return transcriptData.captions.map(item => ({
                    text: item.content,
                    duration: item.durationMs / 1000,
                    offset: item.startTimeMs / 1000
                }));
            }
        } catch (e) {
            // console.error(`Instance ${instance} failed: ${e.message}`); // Debug
            continue;
        }
    }
    throw new Error('All Invidious instances failed');
}

// Strategy 3: Custom Scraper (HTML Parsing)
async function tryCustomScraper(videoId) {
    try {
        // 1. Fetch Video Page
        const videoPageHtml = await new Promise((resolve, reject) => {
            const options = {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Cookie': 'CONSENT=YES+cb.20210328-17-p0.en+FX+417; SOCS=CAESEwgDEgk0ODE3Nzk3MjQaAmVuIAEaBgiA_LyaBg'
                }
            };
            https.get(`https://www.youtube.com/watch?v=${videoId}`, options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => resolve(data));
            }).on('error', reject);
        });

        // 2. Extract Caption Tracks
        const captionTracksRegex = /"captionTracks":(\[.*?\])/;
        const match = videoPageHtml.match(captionTracksRegex);

        if (!match) {
            throw new Error('captionTracks not found in HTML');
        }

        const captionTracks = JSON.parse(match[1]);
        const englishTrack = captionTracks.find(track => track.languageCode === 'en') || captionTracks[0];

        if (!englishTrack) {
            throw new Error('No English transcript available');
        }

        // 3. Fetch Transcript XML
        const transcriptXml = await new Promise((resolve, reject) => {
            https.get(englishTrack.baseUrl, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => resolve(data));
            }).on('error', reject);
        });

        // 4. Parse XML to JSON
        const textRegex = /<text start="([\d.]+)" dur="([\d.]+)">([^<]+)<\/text>/g;
        const items = [];
        let textMatch;

        while ((textMatch = textRegex.exec(transcriptXml)) !== null) {
            items.push({
                text: textMatch[3].replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&'),
                duration: parseFloat(textMatch[2]),
                offset: parseFloat(textMatch[1])
            });
        }

        return items;

    } catch (e) {
        throw new Error(`Custom Scraper failed: ${e.message}`);
    }
}

// Main Execution
(async () => {
    try {
        // Strategy 1: Library
        try {
            console.error('[DEBUG] Trying youtube-transcript library...');
            const result = await tryLibrary(videoId);
            if (result && result.length > 0) {
                console.log(JSON.stringify(result));
                return;
            } else {
                console.error('[DEBUG] Library returned empty result');
            }
        } catch (e) {
            console.error(`[DEBUG] Library error: ${e.message}`);
        }

        // Strategy 2: Invidious
        try {
            console.error('[DEBUG] Trying Invidious...');
            const result = await tryInvidious(videoId);
            console.log(JSON.stringify(result));
            return;
        } catch (e) {
            console.error(`[DEBUG] Invidious error: ${e.message}`);
        }

        // Strategy 3: Custom Scraper
        try {
            console.error('[DEBUG] Trying custom scraper...');
            const result = await tryCustomScraper(videoId);
            console.log(JSON.stringify(result));
            return;
        } catch (e) {
            console.error(`[DEBUG] Custom scraper error: ${e.message}`);
        }

        throw new Error('All strategies failed. No transcript available.');

    } catch (error) {
        console.error(JSON.stringify({ error: error.message }));
        process.exit(1);
    }
})();
