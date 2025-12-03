import { YoutubeTranscript } from 'youtube-transcript';

const videoId = 'jNQXAC9IVRw'; // Me at the zoo

console.log(`Testing transcript fetch for video ID: ${videoId} with lang: 'en'`);

try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' });
    console.log('Success!');
    console.log('Length:', transcript.length);
    console.log('Full output:', JSON.stringify(transcript, null, 2));
} catch (error) {
    console.error('Error fetching transcript:', error);
}
