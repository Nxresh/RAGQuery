import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const youtubedl = require('youtube-dl-exec');

const videoId = 'gX8s25991ac'; // TED Talk
const url = `https://www.youtube.com/watch?v=${videoId}`;

(async () => {
    try {
        const cookiesPath = require('path').resolve('cookies.txt');
        const options = {
            dumpSingleJson: true,
            verbose: true,
            skipDownload: true,
            writeSubs: true,
            writeAutoSub: true,
            subLang: 'en',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        };

        if (require('fs').existsSync(cookiesPath)) {
            console.log('Using cookies from:', cookiesPath);
            options.cookies = cookiesPath;
        }

        const output = await youtubedl(url, options);

        console.log('Title:', output.title);

        // Check for subtitles in the JSON output
        const subtitles = output.subtitles || {};
        const automaticCaptions = output.automatic_captions || {};

        console.log('Manual Subtitles:', Object.keys(subtitles));
        console.log('Auto Captions:', Object.keys(automaticCaptions));

        // Find English track
        let tracks = subtitles['en'] || automaticCaptions['en'] || [];
        if (tracks.length > 0) {
            console.log('Found English tracks:', tracks.length);
            console.log('First track URL:', tracks[0].url);

            // We can now fetch this URL to get the VTT/JSON
            // But for now, just proving we got the URL is enough.
        } else {
            console.log('No English tracks found.');
        }

    } catch (error) {
        console.error('yt-dlp Error:', error);
    }
})();
