import { createRequire } from 'module';
const require = createRequire(import.meta.url);
try {
    const scraper = require('youtube-caption-scraper');
    console.log('Type:', typeof scraper);
    console.log('Is Class?', scraper.toString().startsWith('class'));
    console.log('Static properties:', Object.keys(scraper));
    console.log('Prototype properties:', Object.getOwnPropertyNames(scraper.prototype || {}));

    try {
        const instance = new scraper();
        console.log('Instance properties:', Object.keys(instance));
    } catch (e) {
        console.log('Instantiation failed:', e.message);
    }
} catch (e) {
    console.error('Import error:', e);
}
