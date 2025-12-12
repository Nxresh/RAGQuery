import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { YoutubeTranscript } = require('youtube-transcript');

const videoId = 'dQw4w9WgXcQ';

async function test() {
    try {
        const transcript = await YoutubeTranscript.fetchTranscript(videoId);
        console.log('Success! Length:', transcript.length);
        console.log('First item:', transcript[0]);
    } catch (e) {
        console.error('Error:', e);
    }
}

test();
