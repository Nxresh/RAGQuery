import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { YoutubeTranscript } = require('youtube-transcript');

// Trying a different video: "Me at the zoo" (jNQXAC9IVRw) might fail if no captions, 
// so let's stick to TED Talk (gX8s25991ac) which definitely has them.
const videoId = 'gX8s25991ac';

console.error(`[DEBUG] Starting fetch for ${videoId}`);

YoutubeTranscript.fetchTranscript(videoId)
    .then(transcript => {
        console.error(`[DEBUG] Success! Items: ${transcript.length}`);
        if (transcript.length > 0) {
            console.error('[DEBUG] First item:', JSON.stringify(transcript[0]));
            console.error('[DEBUG] Last item:', JSON.stringify(transcript[transcript.length - 1]));
        }
    })
    .catch(error => {
        console.error('[DEBUG] FAILED:', error);
        if (error.message) console.error('[DEBUG] Msg:', error.message);
    });
