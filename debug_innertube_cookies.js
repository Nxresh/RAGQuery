import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { Innertube } = require('youtubei.js');
const fs = require('fs');

const videoId = 'gX8s25991ac'; // TED Talk

function parseCookies(filePath) {
    if (!fs.existsSync(filePath)) return '';
    const content = fs.readFileSync(filePath, 'utf8');

    const cookieMap = {};
    const regex = /([^\t\n]+)\t([^\t\n]+)\t([^\t\n]+)\t([^\t\n]+)\t([^\t\n]+)\t([^\t\n]+)\t([^\t\n]+)/g;

    let match;
    while ((match = regex.exec(content)) !== null) {
        const name = match[6];
        const value = match[7].trim();
        cookieMap[name] = value;
    }

    // Construct cookie string with priority
    const importantCookies = ['__Secure-3PSID', 'VISITOR_INFO1_LIVE', 'LOGIN_INFO', 'YSC', 'PREF'];
    const cookies = [];

    for (const name of importantCookies) {
        if (cookieMap[name]) {
            cookies.push(`${name}=${cookieMap[name]}`);
        }
    }

    // Add others
    for (const name in cookieMap) {
        if (!importantCookies.includes(name)) {
            cookies.push(`${name}=${cookieMap[name]}`);
        }
    }

    return cookies.join('; ');
}

(async () => {
    try {
        console.log('Parsing cookies...');
        const cookieString = parseCookies('cookies.txt');
        console.log('Parsed cookies string:', cookieString);
        console.log('Cookie string length:', cookieString.length);

        console.log('Initializing InnerTube with cookies (ANDROID)...');
        const youtube = await Innertube.create({
            cookie: cookieString,
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
