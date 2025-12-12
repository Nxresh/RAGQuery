import { createRequire } from 'module';
const require = createRequire(import.meta.url);
try {
    const Scraper = require('youtube-caption-scraper');
    console.log('Is Class?', Scraper.toString().startsWith('class'));

    try {
        const instance = new Scraper();
        console.log('Instance keys:', Object.keys(instance));
        console.log('Prototype keys:', Object.getOwnPropertyNames(Object.getPrototypeOf(instance)));
    } catch (e) {
        console.log('Instantiation error:', e.message);
    }
} catch (e) {
    console.error('Import error:', e);
}
