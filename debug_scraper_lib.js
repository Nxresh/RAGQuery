import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const scraper = require('youtube-caption-scraper');

console.log('Type:', typeof scraper);
console.log('Keys:', Object.keys(scraper));
if (typeof scraper === 'function') {
    console.log('It is a function/class.');
    try {
        const instance = new scraper();
        console.log('Instance keys:', Object.keys(instance));
    } catch (e) {
        console.log('Not a constructor:', e.message);
    }
}

const videoId = 'gX8s25991ac'; // TED Talk

if (scraper.getSubtitles) {
    console.log('Testing getSubtitles...');
    scraper.getSubtitles({ videoID: videoId, lang: 'en' })
        .then(captions => {
            console.log(`Success! Found ${captions.length} lines.`);
            console.log('First line:', captions[0]);
        })
        .catch(e => console.error('Error:', e));
} else {
    console.log('getSubtitles not found on export.');
}
