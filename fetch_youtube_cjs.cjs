const Scraper = require('youtube-caption-scraper');
const scraper = new Scraper();
const getSubtitles = scraper.getSubtitles;

const videoId = process.argv[2];

if (!videoId) {
    console.error(JSON.stringify({ error: 'Video ID required' }));
    process.exit(1);
}

async function run() {
    try {
        const transcript = await getSubtitles({ videoID: videoId, lang: 'en' });
        console.log(JSON.stringify(transcript));
    } catch (error) {
        console.error(JSON.stringify({ error: error.message }));
        process.exit(1);
    }
}

run();
