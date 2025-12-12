import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const youtubedl = require('youtube-dl-exec');
const fs = require('fs');
const path = require('path');
const https = require('https');

const videoId = process.argv[2];

if (!videoId) {
    console.error(JSON.stringify({ error: 'No video ID provided' }));
    process.exit(1);
}

async function fetchUrl(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

(async () => {
    try {
        const url = `https://www.youtube.com/watch?v=${videoId}`;
        const cookiesPath = path.resolve('cookies.txt');

        const options = {
            dumpSingleJson: true,
            verbose: true,
            skipDownload: true,
            writeSubs: true,
            writeAutoSub: true,
            subLang: 'en',
        };

        if (fs.existsSync(cookiesPath)) {
            // console.error('Using cookies.txt');
            options.cookies = cookiesPath;
        }

        const output = await youtubedl(url, options);

        const subtitles = output.subtitles || {};
        const automaticCaptions = output.automatic_captions || {};

        // Prioritize manual English subs, then auto-generated
        let tracks = subtitles['en'] || automaticCaptions['en'] || [];

        if (tracks.length === 0) {
            throw new Error('No English tracks found');
        }

        const trackUrl = tracks[0].url;
        const data = await fetchUrl(trackUrl);

        try {
            const json = JSON.parse(data);
            const events = json.events;
            if (!events) throw new Error('Invalid JSON3 format');

            const items = events
                .filter(e => e.segs && e.segs.length > 0)
                .map(e => ({
                    text: e.segs.map(s => s.utf8).join(''),
                    duration: e.dDurationMs / 1000,
                    offset: e.tStartMs / 1000
                }));
            console.log(JSON.stringify(items));
        } catch (e) {
            throw new Error('Failed to parse transcript JSON');
        }

    } catch (error) {
        // console.error(error);
        console.error(JSON.stringify({
            error: `yt-dlp failed: ${error.message}`,
            stderr: error.stderr,
            stdout: error.stdout
        }));
        process.exit(1);
    }
})();
