import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const ytdl = require('@distube/ytdl-core');

const videoId = 'gX8s25991ac'; // TED Talk
const url = `https://www.youtube.com/watch?v=${videoId}`;

console.log(`Fetching info for ${url}...`);

async function test() {
    try {
        const info = await ytdl.getInfo(url);
        const tracks = info.player_response.captions?.playerCaptionsTracklistRenderer?.captionTracks;

        if (tracks && tracks.length > 0) {
            console.log('Found captions:', tracks.length);
            console.log('First track:', tracks[0].baseUrl);
        } else {
            console.log('No captions found in player_response.');
        }
    } catch (e) {
        console.error('Error:', e);
    }
}

test();
