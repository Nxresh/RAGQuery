import fs from 'fs';
import { fetch } from 'undici'; // Node 18+ has fetch, but just in case
import { FormData } from 'undici';

// Create a dummy PDF file (minimal valid PDF header)
const pdfContent = '%PDF-1.4\n%\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 12 >>\nstream\nHello World\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000010 00000 n \n0000000060 00000 n \n0000000117 00000 n \n0000000204 00000 n \ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n253\n%%EOF';
fs.writeFileSync('test.pdf', pdfContent);

async function upload() {
    const formData = new FormData();
    const blob = new Blob([fs.readFileSync('test.pdf')], { type: 'application/pdf' });
    formData.append('file', blob, 'test.pdf');

    try {
        const res = await fetch('http://localhost:3000/api/upload', {
            method: 'POST',
            body: formData
        });
        const json = await res.json();
        console.log('Status:', res.status);
        console.log('Response:', json);
    } catch (e) {
        console.error('Upload failed:', e);
    }
}

upload();
