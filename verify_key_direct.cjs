const fs = require('fs');
const path = require('path');
const https = require('https');

// 1. Read API Key directly from .env
const envPath = path.resolve(__dirname, '.env');
let apiKey = '';
try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/API_KEY=(.*)/);
    if (match) apiKey = match[1].trim();
} catch (e) {
    console.error("Error reading .env:", e.message);
}

if (!apiKey) {
    console.error("❌ No API_KEY found in .env");
    process.exit(1);
}

console.log(`🔑 Testing API Key: ${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 4)}`);

// 2. Define models to test
const modelsToTest = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-001",
    "gemini-pro",
    "gemini-1.0-pro"
];

function listModels() {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'generativelanguage.googleapis.com',
            path: `/v1beta/models?key=${apiKey}`,
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(body);
                    resolve({ status: res.statusCode, data: json });
                } catch (e) {
                    resolve({ status: res.statusCode, data: { error: { message: "Invalid JSON response" } } });
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.end();
    });
}

async function runTests() {
    console.log("🚀 Listing Available Models...");
    try {
        const result = await listModels();
        if (result.status === 200 && result.data.models) {
            console.log("✅ API Key is VALID. Available Models:");
            const modelNames = result.data.models.map(m => m.name.replace('models/', ''));
            console.log(modelNames.join(', '));
            fs.writeFileSync('error.txt', "SUCCESS: " + modelNames.join(', '));
        } else {
            console.log(`❌ ListModels FAILED (${result.status})`);
            if (result.data && result.data.error) {
                const msg = `ERROR_MSG: ${result.data.error.message}`;
                console.log(msg);
                fs.writeFileSync('error.txt', msg);
            }
        }
    } catch (error) {
        console.log(`❌ NETWORK ERROR (${error.message})`);
    }
}

runTests();
