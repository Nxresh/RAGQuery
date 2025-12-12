import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { Innertube } = require('youtubei.js');

const videoId = 'gX8s25991ac'; // TED Talk

(async () => {
    try {
        console.log('Initializing InnerTube (ANDROID client)...');
        // Force Android client which is less likely to be blocked for metadata
        const youtube = await Innertube.create({
            client_type: 'ANDROID'
        });

        console.log(`Fetching info for ${videoId}...`);
        const info = await youtube.getInfo(videoId);

        console.log('Info fetched. Title:', info.basic_info.title);

        try {
            const transcriptData = await info.getTranscript();

            if (transcriptData && transcriptData.transcript && transcriptData.transcript.content) {
                console.log(`Success! Found ${transcriptData.transcript.content.body.initial_segments.length} segments.`);

                const items = transcriptData.transcript.content.body.initial_segments.map(segment => ({
                    text: segment.snippet.text,
                    duration: Number(segment.duration_ms) / 1000,
                    offset: Number(segment.start_ms) / 1000
                }));

                console.log('First 3 items:', JSON.stringify(items.slice(0, 3), null, 2));
            } else {
                console.log('No transcript found in response structure.');
            }
        } catch (e) {
            console.error('getTranscript failed:', e.message);
        }

    } catch (error) {
        console.error('Fatal Error:', error);
    }
})();
