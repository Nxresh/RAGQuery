import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const puppeteer = require('puppeteer');

const videoId = 'gX8s25991ac'; // TED Talk
const url = `https://www.youtube.com/watch?v=${videoId}`;

(async () => {
    console.log('Launching Puppeteer...');
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    try {
        // Set User Agent to look like a real desktop browser
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');

        console.log(`Navigating to ${url}...`);
        await page.goto(url, { waitUntil: 'networkidle2' });

        // Check for Consent Dialog (e.g., "Before you continue to YouTube")
        const consentButton = await page.$('button[aria-label="Reject all"]');
        if (consentButton) {
            console.log('Found consent dialog. Clicking "Reject all"...');
            await consentButton.click();
            await page.waitForNavigation({ waitUntil: 'networkidle2' });
        }

        // Expand description to find "Show transcript" button
        console.log('Looking for "Show transcript" button...');

        // Note: YouTube UI changes often. We might need to click "More" in description first.
        // Try to find the button directly first.
        let transcriptBtn = await page.$('button[aria-label="Show transcript"]');

        if (!transcriptBtn) {
            console.log('Button not found directly. Trying to expand description...');
            const moreBtn = await page.$('#expand');
            if (moreBtn) {
                await moreBtn.click();
                // Wait a bit for UI update
                await new Promise(r => setTimeout(r, 1000));
                transcriptBtn = await page.$('button[aria-label="Show transcript"]');
            }
        }

        if (transcriptBtn) {
            console.log('Clicking "Show transcript"...');
            await transcriptBtn.click();

            // Wait for transcript panel to load
            await page.waitForSelector('ytd-transcript-segment-renderer', { timeout: 5000 });

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
            // Dump page title to verify we are on the right page
            const title = await page.title();
            console.log('Page Title:', title);
        }

    } catch (error) {
        console.error('Puppeteer Error:', error);
    } finally {
        await browser.close();
    }
})();
