import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { Innertube } = require('youtubei.js');

const videoId = 'gX8s25991ac'; // TED Talk

(async () => {
    try {
        console.log('Initializing InnerTube...');
        const youtube = await Innertube.create();

        console.log(`Fetching info for ${videoId}...`);
        const info = await youtube.getInfo(videoId);

        console.log('Info fetched. Checking for transcript...');
        const transcriptData = await info.getTranscript();

        if (transcriptData && transcriptData.transcript && transcriptData.transcript.content) {
            console.log(`Success! Found ${transcriptData.transcript.content.body.initial_segments.length} segments.`);

            // Map to standard format
            const items = transcriptData.transcript.content.body.initial_segments.map(segment => ({
                text: segment.snippet.text,
                duration: Number(segment.duration_ms) / 1000,
                offset: Number(segment.start_ms) / 1000
            }));

            console.log('First 3 items:', JSON.stringify(items.slice(0, 3), null, 2));
        } else {
            console.log('No transcript found in response.');
        }

    } catch (error) {
        console.error('Error:', error);
        if (error.info) console.error('Error Info:', JSON.stringify(error.info, null, 2));
    }
})();
