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
                console.log('Keys:', Object.keys(transcriptData));
            }
        } catch (e) {
            console.error('getTranscript failed:', e.message);
            if (e.info) {
                console.error('Error Info:', JSON.stringify(e.info, null, 2));
            }
        }

    } catch (error) {
        console.error('Fatal Error:', error);
    }
})();
