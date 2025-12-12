import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const scraper = require('youtube-caption-scraper');

const videoId = 'gX8s25991ac'; // TED Talk

console.log('Testing scraper as function...');
try {
    scraper.getSubtitles({ videoID: videoId, lang: 'en' })
        .then(captions => {
            console.log(`Success! Found ${captions.length} lines.`);
        })
        .catch(e => console.error('Error calling getSubtitles:', e));
} catch (e) {
    console.log('scraper.getSubtitles failed synchronously:', e.message);
}

// Maybe it's just `scraper(videoId)`?
// Inspecting the package source would be ideal but I can't.
// Let's try to see if it has a prototype method.
console.log('Prototype:', scraper.prototype);
