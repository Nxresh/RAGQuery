import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

const videoId = 'gX8s25991ac'; // TED Talk
const url = `https://www.youtube.com/watch?v=${videoId}`;

(async () => {
    console.log('Launching Stealth Puppeteer...');
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    try {
        console.log(`Navigating to ${url}...`);
        await page.goto(url, { waitUntil: 'networkidle2' });

        // Handle Consent Dialog
        try {
            const consentButton = await page.$('button[aria-label="Reject all"]');
            if (consentButton) {
                console.log('Found consent dialog. Clicking "Reject all"...');
                await consentButton.click();
                await page.waitForNavigation({ waitUntil: 'networkidle2' });
            }
        } catch (e) {
            console.log('No consent dialog found or error handling it.');
        }

        // Expand description
        console.log('Looking for "Show transcript" button...');
        let transcriptBtn = await page.$('button[aria-label="Show transcript"]');

        if (!transcriptBtn) {
            console.log('Button not found directly. Trying to expand description...');
            const moreBtn = await page.$('#expand');
            if (moreBtn) {
                await moreBtn.click();
                await new Promise(r => setTimeout(r, 2000)); // Wait for animation
                transcriptBtn = await page.$('button[aria-label="Show transcript"]');
            }
        }

        if (transcriptBtn) {
            console.log('Clicking "Show transcript"...');
            await transcriptBtn.click();

            // Wait for transcript panel
            await page.waitForSelector('ytd-transcript-segment-renderer', { timeout: 10000 });

            console.log('Extracting text...');
            const segments = await page.evaluate(() => {
                const nodes = document.querySelectorAll('ytd-transcript-segment-renderer');
                return Array.from(nodes).map(node => {
                    const text = node.querySelector('.segment-text')?.innerText?.trim();
                    const timestamp = node.querySelector('.segment-timestamp')?.innerText?.trim();
                    return { text, timestamp };
                });
            });

            console.log(`Success! Found ${segments.length} segments.`);
            console.log('First 3 items:', JSON.stringify(segments.slice(0, 3), null, 2));

        } else {
            console.log('Could not find "Show transcript" button.');
            // Dump title/content to debug
            const title = await page.title();
            console.log('Page Title:', title);
            const content = await page.content();
            if (content.includes('Sign in to confirm')) {
                console.log('Detected "Sign in to confirm" block.');
            }
        }

    } catch (error) {
        console.error('Puppeteer Error:', error);
    } finally {
        await browser.close();
    }
})();
