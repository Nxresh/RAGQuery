import scraper from 'youtube-caption-scraper';
const getSubtitles = scraper.getSubtitles;

const videoId = process.argv[2];

if (!videoId) {
    console.error(JSON.stringify({ error: 'No video ID provided' }));
    process.exit(1);
}

try {
    const transcript = await getSubtitles({ videoID: videoId, lang: 'en' });
    console.log(JSON.stringify(transcript));
} catch (error) {
    console.error(JSON.stringify({ error: error.message }));
    process.exit(1);
}
