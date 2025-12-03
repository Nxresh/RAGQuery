import scraper from 'youtube-caption-scraper';
const getSubtitles = scraper.getSubtitles;

const videoId = 'jNQXAC9IVRw'; // Me at the zoo

console.log(`Testing transcript fetch for video ID: ${videoId}`);

try {
    const transcript = await getSubtitles({ videoID: videoId, lang: 'en' });
    console.log('Success!');
    console.log('Length:', transcript.length);
    console.log('First item:', transcript[0]);
} catch (error) {
    console.error('Error fetching transcript:', error);
}
