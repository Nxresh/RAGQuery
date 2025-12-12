import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { YoutubeTranscript } = require('youtube-transcript');

const videoId = 'gX8s25991ac'; // TED Talk (Bill Gates)

console.log(`Fetching transcript for ${videoId}...`);

YoutubeTranscript.fetchTranscript(videoId)
    .then(transcript => {
        console.log(`Successfully fetched ${transcript.length} items.`);
        if (transcript.length > 0) {
            console.log('First 3 items:', JSON.stringify(transcript.slice(0, 3), null, 2));

            // Simulate server processing
            const content = transcript.reduce((acc, item, index) => {
                if (index % 15 === 0 && index !== 0) {
                    return acc + '\n\n' + item.text;
                }
                return acc + ' ' + item.text;
            }, '');

            console.log('\nProcessed Content Preview (first 500 chars):');
            console.log(content.substring(0, 500));
        } else {
            console.log('Transcript is empty.');
        }
    })
    .catch(error => {
        console.error('Error fetching transcript:', error);
    });
