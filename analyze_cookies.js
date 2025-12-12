const fs = require('fs');
const content = fs.readFileSync('cookies.txt', 'utf8');
console.log('Total length:', content.length);
const lines = content.split('\n');
console.log('Total lines:', lines.length);

for (let i = 0; i < Math.min(lines.length, 20); i++) {
    const line = lines[i];
    if (line.trim() === '' || line.startsWith('#')) continue;

    console.log(`Line ${i}:`);
    console.log('  Length:', line.length);
    console.log('  Has tabs:', line.includes('\t'));
    console.log('  Has spaces:', line.includes(' '));
    const parts = line.split('\t');
    console.log('  Split by tab count:', parts.length);
    const partsSpace = line.split(/\s+/);
    console.log('  Split by space count:', partsSpace.length);
    console.log('  Content:', line.substring(0, 50) + '...');
}
